// Extract foreground subject (puppy on cloud) to a transparent PNG.
// Usage: swift scripts/remove-bg.swift <input.png> <output.png>
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import AppKit

guard CommandLine.arguments.count == 3 else {
    fputs("usage: remove-bg.swift <input> <output>\n", stderr)
    exit(1)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard let ciImage = CIImage(contentsOf: inputURL) else {
    fputs("cannot read input image\n", stderr)
    exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ciImage)
try handler.perform([request])

guard let result = request.results?.first else {
    fputs("no foreground subject found\n", stderr)
    exit(1)
}

let maskPixelBuffer = try result.generateScaledMaskForImage(
    forInstances: result.allInstances,
    from: handler
)

let maskImage = CIImage(cvPixelBuffer: maskPixelBuffer)
let filter = CIFilter.blendWithMask()
filter.inputImage = ciImage
filter.maskImage = maskImage
filter.backgroundImage = CIImage.empty()

guard let output = filter.outputImage else {
    fputs("blend failed\n", stderr)
    exit(1)
}

let context = CIContext()
guard let cgImage = context.createCGImage(output, from: ciImage.extent) else {
    fputs("render failed\n", stderr)
    exit(1)
}

let rep = NSBitmapImageRep(cgImage: cgImage)
guard let pngData = rep.representation(using: .png, properties: [:]) else {
    fputs("png encode failed\n", stderr)
    exit(1)
}
try pngData.write(to: outputURL)
print("wrote \(outputURL.path)")
