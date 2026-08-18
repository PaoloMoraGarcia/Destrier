import AVFoundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

/*
 * El póster del portátil, **con su transparencia**.
 *
 * Se ve mientras el vídeo carga, así que tiene que ser el fotograma cero del propio
 * vídeo: es lo que hace que el relevo no se note. Pero el vídeo lleva la alfa
 * empaquetada —color arriba, recorte abajo—, y quedarse solo con la mitad de color
 * da un **rectángulo negro opaco**, que es justo lo que tapa los arcos de la
 * portada. Ese error ya se cometió una vez con el vídeo entero.
 *
 * Así que aquí se juntan las dos mitades igual que hace el compositor de la página:
 * el color como está —viene premultiplicado— y la máscara como canal alfa. Sale un
 * PNG con transparencia de verdad.
 */

let entrada = URL(fileURLWithPath: CommandLine.arguments[1])
let salida = URL(fileURLWithPath: CommandLine.arguments[2])
let anchoDestino = Int(CommandLine.arguments[3])!

let gen = AVAssetImageGenerator(asset: AVURLAsset(url: entrada))
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero

let cg = try! gen.copyCGImage(at: .zero, actualTime: nil)
let W = cg.width, H = cg.height / 2

func leer(_ rect: CGRect) -> [UInt8] {
    var buf = [UInt8](repeating: 0, count: W * H * 4)
    buf.withUnsafeMutableBytes { crudo in
        let ctx = CGContext(data: crudo.baseAddress, width: W, height: H,
                            bitsPerComponent: 8, bytesPerRow: W * 4,
                            space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(cg.cropping(to: rect)!, in: CGRect(x: 0, y: 0, width: W, height: H))
    }
    return buf
}

// En coordenadas de imagen el origen está arriba: el color es la mitad de arriba.
let color = leer(CGRect(x: 0, y: 0, width: W, height: H))
let mascara = leer(CGRect(x: 0, y: H, width: W, height: H))

// El color ya viene premultiplicado del codificador, así que juntarlo con la
// máscara como alfa da directamente RGBA premultiplicado. No hay que dividir nada.
var junto = [UInt8](repeating: 0, count: W * H * 4)
for i in stride(from: 0, to: W * H * 4, by: 4) {
    junto[i] = color[i]; junto[i + 1] = color[i + 1]; junto[i + 2] = color[i + 2]
    junto[i + 3] = mascara[i]
}

let alto = Int(Double(anchoDestino) * Double(H) / Double(W))
var fuente: CGImage!
junto.withUnsafeMutableBytes { crudo in
    let ctx = CGContext(data: crudo.baseAddress, width: W, height: H,
                        bitsPerComponent: 8, bytesPerRow: W * 4,
                        space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    fuente = ctx.makeImage()
}

let destinoCtx = CGContext(data: nil, width: anchoDestino, height: alto, bitsPerComponent: 8,
                           bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                           bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
destinoCtx.interpolationQuality = .high
destinoCtx.draw(fuente, in: CGRect(x: 0, y: 0, width: anchoDestino, height: alto))

let dest = CGImageDestinationCreateWithURL(salida as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, destinoCtx.makeImage()!, nil)
guard CGImageDestinationFinalize(dest) else { print("no se pudo escribir"); exit(1) }
print("  \(anchoDestino)x\(alto), con alfa")
