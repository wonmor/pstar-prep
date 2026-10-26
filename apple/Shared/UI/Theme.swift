// Bauhaus tokens from src/theme.ts: flat primaries, black (default) or paper
// ground, Jost type, thick rules, no gradients or shadows. Every icon is an
// SF Symbol line glyph; no circles, dots, squares or triangles as ornaments.
import CoreText
import SwiftUI

struct Palette {
    var paper: Color
    var paperDeep: Color
    var ink: Color
    var inkSoft: Color
    var red: Color
    var blue: Color
    var yellow: Color
    var onAccent: Color
    var onYellow: Color
    /// visionOS: the ground is system glass, so `paper` is clear.
    var isGlass = false

    static let light = Palette(
        paper: Color(hex: 0xF3EEE3), paperDeep: Color(hex: 0xE8E1D2), ink: Color(hex: 0x141414),
        inkSoft: Color(hex: 0x5B574F), red: Color(hex: 0xC8231B), blue: Color(hex: 0x1D4E9E),
        yellow: Color(hex: 0xF2C230), onAccent: .white, onYellow: Color(hex: 0x141414))

    static let dark = Palette(
        paper: Color(hex: 0x121212), paperDeep: Color(hex: 0x2A2A2A), ink: Color(hex: 0xF3EEE3),
        inkSoft: Color(hex: 0xB3AC9E), red: Color(hex: 0xFF5B47), blue: Color(hex: 0x6E9BEA),
        yellow: Color(hex: 0xF2C230), onAccent: Color(hex: 0x121212), onYellow: Color(hex: 0x141414))

    /// visionOS glass: off-white ink over the system material, dark-mode primaries.
    static let glass = Palette(
        paper: .clear, paperDeep: Color.white.opacity(0.12), ink: Color(hex: 0xF7F4EC),
        inkSoft: Color.white.opacity(0.72), red: Color(hex: 0xFF5B47), blue: Color(hex: 0x6E9BEA),
        yellow: Color(hex: 0xF2C230), onAccent: Color(hex: 0x121212), onYellow: Color(hex: 0x141414),
        isGlass: true)

    static func forMode(_ mode: ThemeMode) -> Palette {
        #if os(visionOS)
        return .glass
        #else
        return mode == .dark ? .dark : .light
        #endif
    }
}

private struct PaletteKey: EnvironmentKey {
    static let defaultValue = Palette.dark
}

extension EnvironmentValues {
    var palette: Palette {
        get { self[PaletteKey.self] }
        set { self[PaletteKey.self] = newValue }
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255)
    }
}

enum Space {
    static let xs: CGFloat = 4, sm: CGFloat = 8, md: CGFloat = 12, lg: CGFloat = 16, xl: CGFloat = 24, xxl: CGFloat = 32
}

/// The Bauhaus "thick line" vocabulary.
enum RuleWeight {
    static let hair: CGFloat = 1, mid: CGFloat = 2, thick: CGFloat = 4, heavy: CGFloat = 8
}

/// Minimum hit target: 44 pt on Mac, 60 pt for gaze + pinch on visionOS.
enum Target {
    #if os(visionOS)
    static let min: CGFloat = 60
    #else
    static let min: CGFloat = 44
    #endif
}

enum Jost: String, CaseIterable {
    case regular = "Jost-Regular", medium = "Jost-Medium", bold = "Jost-Bold", heavy = "Jost-ExtraBold", black = "Jost-Black"

    var file: String {
        switch self {
        case .regular: return "Jost_400Regular"
        case .medium: return "Jost_500Medium"
        case .bold: return "Jost_700Bold"
        case .heavy: return "Jost_800ExtraBold"
        case .black: return "Jost_900Black"
        }
    }

    static func register() {
        for f in allCases {
            if let url = Bundle.main.url(forResource: f.file, withExtension: "ttf") {
                CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
            }
        }
    }
}

extension Font {
    static func jost(_ w: Jost, _ size: CGFloat, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom(w.rawValue, size: size, relativeTo: style)
    }
}

/// SF Symbols line glyphs, mapped from the Ionicons outline names in theme.ts.
enum Glyph {
    static let arrow = "arrow.right"
    static let back = "arrow.left"
    static let close = "xmark"
    static let check = "checkmark"
    static let star = "star.fill"
    static let starOpen = "star"
    static let lock = "lock"
    static let unlock = "lock.open"
    static let refresh = "arrow.clockwise"
    static let warning = "exclamationmark"
    static let airplane = "airplane"
    static let radio = "antenna.radiowaves.left.and.right"
    static let exam = "stopwatch"
    static let practice = "pencil.line"
    static let cards = "rectangle.stack"
    static let answers = "list.dash"
    static let home = "house"
    static let about = "info"
    static let book = "book"
    static let document = "doc.text"
    static let shield = "checkmark.shield"
    static let globe = "globe"
    static let moon = "moon"
    static let sun = "sun.max"
    static let trash = "trash"
    static let infinite = "infinity"
    static let calendar = "calendar"
    static let swap = "arrow.left.arrow.right"
    static let help = "questionmark"
    static let mail = "envelope"
    static let focus = "eye"
    static let search = "magnifyingglass"
}

enum Links {
    static let privacy = URL(string: "https://wonmor.github.io/pstar-prep/privacy.html")!
    static let terms = URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!
    static let site = URL(string: "https://wonmor.github.io/pstar-prep/")!
    static let contact = "john@orchestrsim.com"
    static let appName = "PSTAR & ROC-A Trainer"
    static var version: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(v) (\(b))"
    }
}
