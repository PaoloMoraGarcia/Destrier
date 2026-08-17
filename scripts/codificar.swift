import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import VideoToolbox

// Recodifica un ProRes 4444 con alfa a un H.264 compuesto sobre un color plano.
//
// En web no hay formato de vídeo con alfa que pinte en todos los navegadores, así
// que el recorte se compone contra el color de la sección — aquí el blanco de la
// página. **Los vídeos no llevan fondo negro**: llevan alfa, y hay que respetarla.
//
// Tres cosas que costaron descubrirse y que este archivo no puede perder:
//
//  1. **El bitrate se pone a mano.** Ni los presets de `AVAssetExportSession` ni
//     los de `avconvert` lo dejan elegir, y su "máxima calidad" son 21 Mbps.
//  2. **No se reescala con CoreImage.** Su transformación afín no filtra y sobre
//     material con detalle fino eso alias — se ve pixelado. Va por `CGContext`
//     con interpolación alta.
//  3. **Se recorta a la caja de la alfa.** Si no, la mitad del fotograma es
//     transparente y se están pagando píxeles por nada.

struct Ajustes {
    let entrada: URL
    let salida: URL
    let anchoDestino: Int
    let bitrate: Int
    let fondo: CGColor
}

let args = CommandLine.arguments
guard args.count >= 5 else {
    FileHandle.standardError.write(
        "uso: codificar <entrada> <salida> <ancho> <mbps> [fondo] [fps]\n".data(using: .utf8)!)
    exit(2)
}

/*
 * **Los fotogramas por segundo también son un argumento**, y en el portátil de la
 * portada es la diferencia entre que vaya y que no.
 *
 * El original viene a 60. Perfilando la página en un móvil con la CPU frenada
 * cuatro veces salió que **el 77 % del tiempo se iba en `texImage2D`**: subir el
 * fotograma a la GPU. Con la alfa empaquetada ese fotograma mide 2560x2832 —7,25
 * millones de píxeles— y se subía sesenta veces por segundo. Los arcos, que
 * parecían el sospechoso, se llevaban el 1 %.
 *
 * A 30 se sube la mitad, pesa la mitad y **no se nota**: es un portátil quieto
 * enseñando un vídeo, no una panorámica. Los fotogramas se descartan por tiempo,
 * no de uno en uno, para que valga con cualquier fuente.
 */
let fpsDestino = args.count >= 7 ? Double(args[6]) : nil

/*
 * **El fondo es un argumento, y tiene que serlo.**
 *
 * El vídeo se compone contra el color de la sección donde va a vivir. Los dos
 * aparatos se sacaron sobre blanco porque iban en la sección clara; al mudarlos a
 * la negra había que volver a sacarlos, porque un recorte compuesto sobre blanco
 * puesto sobre negro enseña un rectángulo blanco alrededor.
 *
 * Estaba escrito a fuego y por eso el error era fácil de cometer. Ahora se elige
 * al llamar, y quien mueva un vídeo de sección sabe que tiene que recodificarlo.
 */
let ALFA = "alfa"

/**
 * `empaquetada` — la alfa viaja **dentro de la imagen**.
 *
 * Es la salida al callejón de siempre: no existe ningún formato de vídeo con
 * transparencia que reproduzcan todos los navegadores. Safari hace HEVC con alfa,
 * Chrome y Firefox hacen VP9 con alfa, y no se solapan; con un archivo por motor,
 * la página se ve distinta en cada ventana.
 *
 * Así que la alfa deja de ser un canal y pasa a ser **imagen**: el fotograma sale
 * al doble de alto, con el color arriba y el recorte en gris abajo. Lo que sale
 * es un MP4 corriente —H.264, sin canal alfa, sin nada raro— y quien lo pinta
 * vuelve a juntar las dos mitades en la máquina de quien mira. Ver `Mac.tsx`.
 *
 * El color va **premultiplicado**, que es como viene: se rellena de negro y se
 * dibuja encima con `src-over`, y eso deja exactamente `color x alfa`. El
 * compositor mezcla en premultiplicado y no hay que deshacer nada — desmultiplicar
 * para volver a multiplicar en el navegador es de donde salen los halos oscuros
 * alrededor del recorte.
 */
let EMPAQUETADA = "empaquetada"

let fondos: [String: CGColor] = [
    "blanco": CGColor(red: 1, green: 1, blue: 1, alpha: 1),
    // El mismo `#0a0a0a` que `bg-[#0a0a0a]`.
    "tinta": CGColor(red: 10 / 255, green: 10 / 255, blue: 10 / 255, alpha: 1),
    // Negro puro, que es contra lo que se premultiplica al empaquetar.
    "negro": CGColor(red: 0, green: 0, blue: 0, alpha: 1),
]

let nombreFondo = args.count >= 6 ? args[5] : "blanco"

/*
 * `alfa` conserva la transparencia en vez de componerla contra un color.
 *
 * Componer era la única salida mientras el fondo fuera liso: en H.264 no hay
 * canal alfa que valga. En cuanto detrás hay algo —los arcos de la portada— el
 * recorte compuesto **enseña su rectángulo**, porque el negro con el que se
 * rellenó tapa lo que haya debajo.
 *
 * HEVC sí lleva alfa y Safari lo reproduce. No lo hacen Chrome ni Firefox, así
 * que el compuesto sigue haciendo falta como recambio: dos archivos, dos
 * `<source>`, y cada navegador coge el que entiende.
 */
let conservarAlfa = nombreFondo == ALFA
let empaquetar = nombreFondo == EMPAQUETADA

guard conservarAlfa || empaquetar || fondos[nombreFondo] != nil else {
    FileHandle.standardError.write(
        "fondo desconocido: \(nombreFondo) — usa blanco, tinta, negro, alfa o empaquetada\n".data(using: .utf8)!)
    exit(2)
}
// Al empaquetar el relleno es negro puro: es contra lo que se premultiplica.
let fondo = empaquetar
    ? CGColor(red: 0, green: 0, blue: 0, alpha: 1)
    : (fondos[nombreFondo] ?? CGColor(red: 0, green: 0, blue: 0, alpha: 0))

let ajustes = Ajustes(
    entrada: URL(fileURLWithPath: args[1]),
    salida: URL(fileURLWithPath: args[2]),
    anchoDestino: Int(args[3])!,
    bitrate: Int(Double(args[4])! * 1_000_000),
    fondo: fondo
)

let asset = AVAsset(url: ajustes.entrada)
let semaforo = DispatchSemaphore(value: 0)
var pista: AVAssetTrack?
var duracion: CMTime = .zero

asset.loadValuesAsynchronously(forKeys: ["tracks", "duration"]) {
    pista = asset.tracks(withMediaType: .video).first
    duracion = asset.duration
    semaforo.signal()
}
semaforo.wait()

guard let pistaVideo = pista else { print("sin pista de vídeo"); exit(1) }

let tamano = pistaVideo.naturalSize.applying(pistaVideo.preferredTransform)
let anchoOrigen = Int(abs(tamano.width))
let altoOrigen = Int(abs(tamano.height))
let fps = pistaVideo.nominalFrameRate > 0 ? pistaVideo.nominalFrameRate : 30

print("origen: \(anchoOrigen)x\(altoOrigen) @\(fps)fps, \(CMTimeGetSeconds(duracion))s")

// ---------------------------------------------------------------------------
// 1. La caja de la alfa
//
// Se mide sobre una versión reducida: escanear 2500x1875 por píxel y por
// fotograma es minutos de trabajo para un rectángulo que no necesita precisión
// de píxel. Se muestrean fotogramas repartidos por todo el clip, porque el
// aparato se mueve y la caja tiene que ser la unión de todas sus posiciones.
// ---------------------------------------------------------------------------

func cajaDeLaAlfa() -> CGRect {
    let generador = AVAssetImageGenerator(asset: asset)
    generador.appliesPreferredTrackTransform = true
    generador.requestedTimeToleranceBefore = .zero
    generador.requestedTimeToleranceAfter = .zero

    let escala = 8
    let anchoMini = anchoOrigen / escala
    let altoMini = altoOrigen / escala

    var minX = anchoMini, minY = altoMini, maxX = 0, maxY = 0
    let muestras = 16
    let segundos = CMTimeGetSeconds(duracion)

    for i in 0..<muestras {
        let t = CMTime(seconds: segundos * Double(i) / Double(muestras - 1) * 0.999, preferredTimescale: 600)
        guard let cg = try? generador.copyCGImage(at: t, actualTime: nil) else { continue }

        var pixeles = [UInt8](repeating: 0, count: anchoMini * altoMini * 4)
        guard let ctx = CGContext(
            data: &pixeles, width: anchoMini, height: altoMini,
            bitsPerComponent: 8, bytesPerRow: anchoMini * 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { continue }

        ctx.clear(CGRect(x: 0, y: 0, width: anchoMini, height: altoMini))
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: anchoMini, height: altoMini))

        for y in 0..<altoMini {
            for x in 0..<anchoMini {
                if pixeles[(y * anchoMini + x) * 4 + 3] > 8 {
                    if x < minX { minX = x }; if x > maxX { maxX = x }
                    if y < minY { minY = y }; if y > maxY { maxY = y }
                }
            }
        }
    }

    if maxX <= minX || maxY <= minY {
        print("aviso: no se ha encontrado alfa, se usa el fotograma entero")
        return CGRect(x: 0, y: 0, width: anchoOrigen, height: altoOrigen)
    }

    // Un píxel de margen por cada lado, devuelto a escala real. El eje Y del
    // contexto va al revés que el de la imagen, y aquí da igual porque la caja
    // se usa simétrica — pero conviene saberlo antes de tocar esto.
    let x0 = max(0, (minX - 1) * escala)
    let y0 = max(0, (minY - 1) * escala)
    let x1 = min(anchoOrigen, (maxX + 2) * escala)
    let y1 = min(altoOrigen, (maxY + 2) * escala)

    return CGRect(x: x0, y: y0, width: x1 - x0, height: y1 - y0)
}

let caja = cajaDeLaAlfa()
print("caja de la alfa: \(Int(caja.origin.x)),\(Int(caja.origin.y)) \(Int(caja.width))x\(Int(caja.height))")

// El destino conserva la proporción de la caja, y en par: H.264 lo exige.
let anchoSalida = (ajustes.anchoDestino / 2) * 2
let altoSalida = (Int(Double(anchoSalida) * caja.height / caja.width) / 2) * 2

// Al empaquetar, el lienzo mide el doble de alto: el color arriba, la máscara
// abajo. `altoSalida` sigue siendo el alto de la imagen de verdad, y es el que
// usa todo lo demás.
let altoLienzo = empaquetar ? altoSalida * 2 : altoSalida
print("salida: \(anchoSalida)x\(altoLienzo)"
    + (empaquetar ? " (imagen \(anchoSalida)x\(altoSalida) + máscara)" : "")
    + " a \(ajustes.bitrate / 1_000_000) Mbps")

// ---------------------------------------------------------------------------
// 2. Leer, componer y escribir
// ---------------------------------------------------------------------------

guard let lector = try? AVAssetReader(asset: asset) else { print("no se puede leer"); exit(1) }

let salidaPista = AVAssetReaderTrackOutput(
    track: pistaVideo,
    outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
)
salidaPista.alwaysCopiesSampleData = false
lector.add(salidaPista)

try? FileManager.default.removeItem(at: ajustes.salida)
// **HEVC con alfa no cabe en un MP4.** El códec `muxa` solo se puede meter en un
// contenedor QuickTime; con `.mp4` el escritor lanza una excepción y no escribe
// nada. Safari reproduce el `.mov` sin problema.
guard let escritor = try? AVAssetWriter(
    outputURL: ajustes.salida, fileType: conservarAlfa ? .mov : .mp4
) else {
    print("no se puede escribir"); exit(1)
}

let entradaEscritor = AVAssetWriterInput(mediaType: .video, outputSettings: [
    // HEVC con alfa cuando se pide conservarla; si no, el H.264 de siempre.
    AVVideoCodecKey: conservarAlfa ? AVVideoCodecType.hevcWithAlpha : AVVideoCodecType.h264,
    AVVideoWidthKey: anchoSalida,
    AVVideoHeightKey: altoLienzo,
    /*
     * **Se etiqueta el color, y no es cosmética.**
     *
     * Sin estas claves el archivo sale sin decir en qué espacio está, y entonces
     * cada navegador adivina el rango al decodificar: el mismo negro sale a un
     * nivel en Safari y a otro en Chrome, y contra un fondo del color exacto eso
     * dibuja el rectángulo del vídeo en uno de los dos.
     * Al empaquetar es todavía más grave, porque **la mitad de abajo no es una
     * imagen, es un dato**: un desplazamiento de niveles en la máscara es un
     * recorte con borde blando en un navegador y duro en otro.
     */
    AVVideoColorPropertiesKey: [
        AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
        AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
        AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: [
        // Esto es lo que ningún preset deja poner.
        AVVideoAverageBitRateKey: ajustes.bitrate,
        AVVideoMaxKeyFrameIntervalKey: Int(fps * 2),
    ].merging(
        conservarAlfa
            // Sin esto la alfa sale cuantizada a saco y el borde del aparato
            // queda dentado.
            ? [kVTCompressionPropertyKey_TargetQualityForAlpha as String: 0.95]
            : [AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
        uniquingKeysWith: { a, _ in a }
    ),
])
entradaEscritor.expectsMediaDataInRealTime = false

let adaptador = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: entradaEscritor,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: anchoSalida,
        kCVPixelBufferHeightKey as String: altoLienzo,
    ]
)

escritor.add(entradaEscritor)
escritor.startWriting()
escritor.startSession(atSourceTime: .zero)
lector.startReading()

let cola = DispatchQueue(label: "codificar")
let fin = DispatchSemaphore(value: 0)
var contador = 0
/** Hasta dónde hay que llegar para escribir el siguiente fotograma. */
var siguienteHueco = 0.0

entradaEscritor.requestMediaDataWhenReady(on: cola) {
    while entradaEscritor.isReadyForMoreMediaData {
        guard let muestra = salidaPista.copyNextSampleBuffer(),
              let origen = CMSampleBufferGetImageBuffer(muestra) else {
            entradaEscritor.markAsFinished()
            fin.signal()
            return
        }

        let tiempo = CMSampleBufferGetPresentationTimeStamp(muestra)

        // Descarte por tiempo: se queda el primer fotograma de cada intervalo.
        if let objetivo = fpsDestino {
            let t = CMTimeGetSeconds(tiempo)
            if t < siguienteHueco - 1e-6 { continue }
            siguienteHueco = (floor(t * objetivo) + 1) / objetivo
        }

        CVPixelBufferLockBaseAddress(origen, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(origen, .readOnly) }

        let ancho = CVPixelBufferGetWidth(origen)
        let alto = CVPixelBufferGetHeight(origen)

        guard let base = CVPixelBufferGetBaseAddress(origen),
              let ctxOrigen = CGContext(
                data: base, width: ancho, height: alto,
                bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(origen),
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
                    | CGBitmapInfo.byteOrder32Little.rawValue
              ),
              let imagen = ctxOrigen.makeImage() else { continue }

        // Recorte en coordenadas de imagen (origen arriba), que es como vino la
        // caja del generador.
        guard let recortada = imagen.cropping(to: caja) else { continue }

        var destino: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, adaptador.pixelBufferPool!, &destino)
        guard let salidaBuffer = destino else { continue }

        CVPixelBufferLockBaseAddress(salidaBuffer, [])
        if let baseSalida = CVPixelBufferGetBaseAddress(salidaBuffer),
           let ctxSalida = CGContext(
            data: baseSalida, width: anchoSalida, height: altoLienzo,
            bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(salidaBuffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
                | CGBitmapInfo.byteOrder32Little.rawValue
           ) {
            // El fondo primero, y encima el recorte con su alfa — salvo que se
            // esté conservando la transparencia, y entonces no se rellena nada.
            if !conservarAlfa {
                ctxSalida.setFillColor(ajustes.fondo)
                ctxSalida.fill(CGRect(x: 0, y: 0, width: anchoSalida, height: altoLienzo))
            } else {
                ctxSalida.clear(CGRect(x: 0, y: 0, width: anchoSalida, height: altoLienzo))
            }

            // Interpolación alta y **no CoreImage**: su afín no filtra y alias.
            ctxSalida.interpolationQuality = .high

            // Al empaquetar, las dos mitades se escriben más abajo a partir de un
            // solo dibujo; aquí no hay nada que pintar.
            if !empaquetar {
                ctxSalida.draw(recortada, in: CGRect(
                    x: 0, y: 0, width: anchoSalida, height: altoSalida))
            }

            if empaquetar {
                /*
                 * Y abajo, la máscara — sacada **del mismo dibujo**.
                 *
                 * El recorte se pinta una sola vez sobre transparente, y de ese
                 * único búfer salen las dos mitades: el color premultiplicado es
                 * literalmente los bytes BGR tal cual —premultiplicar es lo que
                 * hace `src-over` sobre negro— y la máscara es el byte de alfa.
                 *
                 * Dibujar dos veces sería pedir que dos escalados independientes
                 * cayeran en el mismo píxel; así **no pueden desalinearse**, que
                 * es de lo único que depende que no aparezca un halo.
                 *
                 * Las filas se copian a mano en vez de dibujarlas con otro
                 * `CGContext`: en un contexto el eje Y va al revés que en memoria,
                 * y esto es exactamente donde una de las dos mitades acabaría del
                 * revés sin que nada avisara.
                 */
                var plano = [UInt8](repeating: 0, count: anchoSalida * altoSalida * 4)
                plano.withUnsafeMutableBytes { crudo in
                    guard let ctxPlano = CGContext(
                        data: crudo.baseAddress, width: anchoSalida, height: altoSalida,
                        bitsPerComponent: 8, bytesPerRow: anchoSalida * 4,
                        space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
                            | CGBitmapInfo.byteOrder32Little.rawValue
                    ) else { return }
                    ctxPlano.clear(CGRect(x: 0, y: 0, width: anchoSalida, height: altoSalida))
                    ctxPlano.interpolationQuality = .high
                    ctxPlano.draw(recortada, in: CGRect(
                        x: 0, y: 0, width: anchoSalida, height: altoSalida))
                }

                let filaBytes = CVPixelBufferGetBytesPerRow(salidaBuffer)
                let pixeles = baseSalida.assumingMemoryBound(to: UInt8.self)
                for y in 0..<altoSalida {
                    let color = pixeles + y * filaBytes
                    let mascara = pixeles + (altoSalida + y) * filaBytes
                    let origen = y * anchoSalida * 4
                    for x in 0..<anchoSalida {
                        let s = origen + x * 4
                        let d = x * 4
                        // BGRA: los tres primeros ya vienen premultiplicados.
                        color[d] = plano[s]
                        color[d + 1] = plano[s + 1]
                        color[d + 2] = plano[s + 2]
                        color[d + 3] = 255
                        let a = plano[s + 3]
                        mascara[d] = a; mascara[d + 1] = a
                        mascara[d + 2] = a; mascara[d + 3] = 255
                    }
                }
            }
        }
        CVPixelBufferUnlockBaseAddress(salidaBuffer, [])

        adaptador.append(salidaBuffer, withPresentationTime: tiempo)

        contador += 1
        if contador % 120 == 0 { print("  \(contador) fotogramas") }
    }
}

fin.wait()
escritor.finishWriting { fin.signal() }
fin.wait()

if escritor.status == .completed {
    let peso = (try? FileManager.default.attributesOfItem(atPath: ajustes.salida.path)[.size] as? Int) ?? 0
    print("listo: \(contador) fotogramas, \(String(format: "%.1f", Double(peso ?? 0) / 1_048_576)) MB")
} else {
    print("fallo: \(escritor.error?.localizedDescription ?? "desconocido")")
    exit(1)
}
