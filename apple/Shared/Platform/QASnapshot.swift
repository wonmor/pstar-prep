#if DEBUG && os(macOS)
import AppKit

/// Screenshots only (Debug): `-QASnapshot name` renders the main window (or
/// its sheet) to <container tmp>/name.png after a short delay, then quits.
/// Draws the layer tree itself, so it works without Screen Recording access
/// and while the screen is locked. Materials (glass) render as a flat ground.
enum QASnapshot {
    static func scheduleIfRequested() {
        guard let name = UserDefaults.standard.string(forKey: "QASnapshot") else { return }
        let delay = UserDefaults.standard.double(forKey: "QASnapshotDelay")
        DispatchQueue.main.asyncAfter(deadline: .now() + (delay > 0 ? delay : 3)) {
            guard let window = NSApp.windows.first(where: { $0.isVisible && $0.level == .normal && $0.contentView != nil }) else { exit(2) }
            let w = window.attachedSheet ?? window
            guard let view = w.contentView?.superview ?? w.contentView, let layer = view.layer else { exit(3) }
            let scale = w.backingScaleFactor
            let size = view.bounds.size
            let px = (Int(size.width * scale), Int(size.height * scale))
            guard let ctx = CGContext(data: nil, width: px.0, height: px.1, bitsPerComponent: 8, bytesPerRow: 0,
                                      space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(4) }
            let dark = view.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            ctx.setFillColor(dark ? CGColor(red: 0.07, green: 0.07, blue: 0.07, alpha: 1) : CGColor(red: 0.953, green: 0.933, blue: 0.89, alpha: 1))
            ctx.fill(CGRect(x: 0, y: 0, width: px.0, height: px.1))
            ctx.scaleBy(x: scale, y: scale)
            if layer.isGeometryFlipped == false && view.isFlipped {
                ctx.translateBy(x: 0, y: size.height)
                ctx.scaleBy(x: 1, y: -1)
            }
            layer.render(in: ctx)
            guard let img = ctx.makeImage() else { exit(5) }
            let rep = NSBitmapImageRep(cgImage: img)
            let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("\(name).png")
            try? rep.representation(using: .png, properties: [:])?.write(to: url)
            print("QASnapshot \(url.path)")
            exit(0)
        }
    }
}
#endif
