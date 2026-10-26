#if os(visionOS)
import RealityKit
import SwiftUI

/// visionOS: a glass window whose tab bar is the system's leading ornament.
/// A study session takes over the window; its controls move to a bottom
/// ornament, and mock exams can dim the room (Focus mode).
struct VisionRoot: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    @Environment(\.openImmersiveSpace) private var openSpace
    @Environment(\.dismissImmersiveSpace) private var dismissSpace
    @State private var focusOpen = false

    var body: some View {
        Group {
            if let s = model.session {
                SessionView(session: s)
                    .id(s.id + model.examID.rawValue)
                    .ornament(attachmentAnchor: .scene(.top), contentAlignment: .bottom) {
                        sessionOrnament(s)
                    }
            } else {
                TabView(selection: Binding(get: { model.destination ?? .home }, set: { model.destination = $0 })) {
                    ForEach(Destination.allCases) { d in
                        DestinationView(destination: d)
                            .tabItem { Label(d.title, systemImage: d.glyph) }
                            .tag(d)
                    }
                }
            }
        }
        .onChange(of: model.session) { old, new in
            Task {
                if case .quiz(.mock) = new, !focusOpen { await setFocus(true) }
                if new == nil, focusOpen { await setFocus(false) }
            }
        }
    }

    private func sessionOrnament(_ s: StudySession) -> some View {
        HStack(spacing: Space.md) {
            Text(title(s)).font(.jost(.heavy, 15)).tracking(1.2).textCase(.uppercase)
            if case .quiz(.mock) = s {
                Toggle(isOn: Binding(get: { focusOpen }, set: { on in Task { await setFocus(on) } })) {
                    Label("Focus", systemImage: Glyph.focus)
                }
                .toggleStyle(.button)
                .help("Dim your surroundings during the exam")
            }
        }
        .padding(.horizontal, Space.lg)
        .padding(.vertical, Space.sm)
        .glassBackgroundEffect()
    }

    private func title(_ s: StudySession) -> String {
        switch s {
        case .quiz(.mock): return "\(model.meta.shortName) Mock Exam"
        case .quiz(.section(let n)): return model.exam.sectionName(n)
        case .cards: return "\(model.meta.shortName) Flashcards"
        }
    }

    private func setFocus(_ on: Bool) async {
        if on {
            if case .opened = await openSpace(id: FocusSpace.id) { focusOpen = true }
        } else {
            await dismissSpace()
            focusOpen = false
        }
    }
}

/// An empty mixed space whose only job is to dim passthrough, so the exam
/// window is the brightest thing in the room.
struct FocusSpace: View {
    static let id = "focus"
    var body: some View {
        RealityView { _ in }
            .preferredSurroundingsEffect(.systemDark)
    }
}
#endif
