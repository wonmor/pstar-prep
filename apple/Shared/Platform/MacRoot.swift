#if os(macOS)
import SwiftUI

/// macOS: sidebar + detail. While a session runs the sidebar is locked so a
/// mock exam can't be lost by a stray click.
struct MacRoot: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    @Environment(\.palette) private var c
    #if DEBUG
    @State private var columns: NavigationSplitViewVisibility = UserDefaults.standard.bool(forKey: "QADetailOnly") ? .detailOnly : .automatic
    #else
    @State private var columns: NavigationSplitViewVisibility = .automatic
    #endif

    var body: some View {
        NavigationSplitView(columnVisibility: $columns) {
            List(selection: $model.destination) {
                Section("Study") {
                    ForEach(Destination.allCases) { d in
                        Label(d.title, systemImage: d.glyph).tag(d)
                    }
                }
                Section("Exam") {
                    Picker("Exam", selection: $model.examID) {
                        ForEach(ExamID.allCases) { id in
                            Label(ExamMeta.of(id).shortName, systemImage: id == .pstar ? Glyph.airplane : Glyph.radio).tag(id)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }
                if !store.isPro {
                    Section {
                        Button { model.paywall = .banner } label: {
                            Label("Unlock Pro", systemImage: Glyph.unlock)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .listStyle(.sidebar)
            .scrollContentBackground(.hidden)
            .background(c.paper)
            .disabled(model.session != nil)
            .navigationSplitViewColumnWidth(min: 190, ideal: 220, max: 280)
        } detail: {
            Group {
                if let s = model.session {
                    SessionView(session: s).id(s.id + model.examID.rawValue)
                } else {
                    DestinationView(destination: model.destination ?? .home)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(c.paper)
            .navigationTitle(title)
        }
    }

    private var title: String {
        if let s = model.session {
            switch s {
            case .quiz(.mock): return "\(model.meta.shortName) Mock Exam"
            case .quiz(.section(let n)): return model.exam.sectionName(n)
            case .cards: return "Flashcards"
            }
        }
        return "\(model.meta.shortName) | \((model.destination ?? .home).title)"
    }
}

/// Menu bar commands. Answer keys: 1-4 (menu) and A-D (in QuizView),
/// Return for next, Left Arrow for previous (mock exams), Space to flip a card.
struct AppCommands: Commands {
    @ObservedObject var model: AppModel
    @ObservedObject var store: ProStore
    @FocusedValue(\.studyActions) private var actions
    @Environment(\.openURL) private var openURL

    var body: some Commands {
        CommandGroup(replacing: .newItem) {}
        CommandGroup(after: .appInfo) {
            Button(store.isPro ? "Pro Is Active" : "Unlock Pro\u{2026}") { model.paywall = .banner }
            Button("Restore Purchases") { Task { _ = await store.restore() } }
        }
        CommandMenu("Study") {
            ForEach(Array(Destination.allCases.enumerated()), id: \.element) { i, d in
                Button(d.title) { model.session = nil; model.destination = d }
                    .keyboardShortcut(KeyEquivalent(Character("\(i + 1)")), modifiers: .command)
                    .disabled(model.session != nil)
            }
            Divider()
            Button("Start Mock Exam") { model.start(.quiz(.mock), isPro: store.isPro) }
                .keyboardShortcut("e", modifiers: [.command, .shift])
                .disabled(model.session != nil)
            Divider()
            Picker("Exam", selection: $model.examID) {
                ForEach(ExamID.allCases) { id in Text(ExamMeta.of(id).shortName).tag(id) }
            }
            .disabled(model.session != nil)
        }
        CommandMenu("Answer") {
            ForEach(0..<4, id: \.self) { i in
                Button("Option \(i + 1)") { actions?.answer?(i) }
                    .keyboardShortcut(KeyEquivalent(Character("\(i + 1)")), modifiers: [])
                    .disabled(actions?.answer == nil)
            }
            Divider()
            Button(actions?.gotIt != nil ? "Got It" : "Next Question") {
                if let g = actions?.gotIt { g() } else { actions?.next?() }
            }
            .keyboardShortcut(.return, modifiers: [])
            .disabled(actions?.next == nil && actions?.gotIt == nil)
            Button("Previous Question") { actions?.previous?() }
                .keyboardShortcut(.leftArrow, modifiers: [])
                .disabled(actions?.previous == nil)
            Divider()
            Button("Flip Card") { actions?.flip?() }
                .keyboardShortcut(.space, modifiers: [])
                .disabled(actions?.flip == nil)
            Button("Again") { actions?.again?() }
                .keyboardShortcut(.delete, modifiers: [])
                .disabled(actions?.again == nil)
            Divider()
            Button("Toggle Bookmark") { actions?.bookmark?() }
                .keyboardShortcut("d", modifiers: .command)
                .disabled(actions?.bookmark == nil)
            Button("End Session") { actions?.close?() }
                .keyboardShortcut("w", modifiers: [.command, .shift])
                .disabled(actions?.close == nil)
        }
        CommandGroup(replacing: .help) {
            Button("Disclaimer") { model.showDisclaimer = true }
            Button("Privacy Policy") { openURL(Links.privacy) }
            Button("Terms of Use (EULA)") { openURL(Links.terms) }
        }
    }
}
#endif
