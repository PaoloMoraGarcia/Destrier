import AVFoundation
import Foundation

/*
 * Mueve el índice de un MP4 al principio del archivo. **No recodifica nada.**
 *
 * `AVAssetWriter` deja el átomo `moov` —el índice del contenedor— al final salvo
 * que se le pida lo contrario, y así salieron los cuatro vídeos de la página.
 * Reproduciendo desde disco no se nota. Por internet es la diferencia entre medio
 * segundo y ocho, porque el navegador no puede pintar el primer fotograma hasta
 * leer el índice, y para eso tiene que bajarse el archivo entero.
 *
 * Medido en producción: el portátil de la portada tardaba **7,7 s** en aparecer a
 * 12 Mbps.
 *
 * Esto es un remontaje con `passthrough`: los mismos fotogramas, bit a bit, en un
 * contenedor ordenado de otra forma. No hay pérdida de calidad porque no hay
 * ninguna recompresión — cosa que sí habría si se recodificara.
 */

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("uso: adelantar-indice <entrada.mp4> <salida.mp4>\n".data(using: .utf8)!)
    exit(2)
}

let entrada = URL(fileURLWithPath: args[1])
let salida = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: salida)

let asset = AVURLAsset(url: entrada)
guard let export = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetPassthrough) else {
    print("no se puede exportar"); exit(1)
}

export.outputURL = salida
export.outputFileType = .mp4
export.shouldOptimizeForNetworkUse = true

let fin = DispatchSemaphore(value: 0)
export.exportAsynchronously { fin.signal() }
fin.wait()

guard export.status == .completed else {
    print("fallo: \(export.error?.localizedDescription ?? "desconocido")"); exit(1)
}

let antes = (try? FileManager.default.attributesOfItem(atPath: entrada.path)[.size] as? Int) ?? 0
let despues = (try? FileManager.default.attributesOfItem(atPath: salida.path)[.size] as? Int) ?? 0
print(String(format: "  %.1f MB → %.1f MB", Double(antes ?? 0) / 1_048_576, Double(despues ?? 0) / 1_048_576))
