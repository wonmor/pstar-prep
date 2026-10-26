import SwiftUI

@main
struct PSTARApp: App {
    @StateObject private var model = AppModel()
    @StateObject private var store = ProStore()

    init() {
        Jost.register()
        #if DEBUG && os(macOS)
        QASnapshot.scheduleIfRequested()
        #endif
    }

    var body: some Scene {
        #if os(macOS)
        Window(Links.appName, id: "main") {
            RootView()
                .environmentObject(model)
                .environmentObject(store)
                .frame(minWidth: 880, minHeight: 620)
        }
        .defaultSize(width: 1180, height: 820)
        .commands { AppCommands(model: model, store: store) }
        #else
        WindowGroup {
            RootView()
                .environmentObject(model)
                .environmentObject(store)
        }
        .defaultSize(width: 1180, height: 860)

        ImmersiveSpace(id: FocusSpace.id) {
            FocusSpace()
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
        #endif
    }
}

struct RootView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore

    var body: some View {
        let palette = Palette.forMode(model.theme)
        content
            .environment(\.palette, palette)
            .tint(palette.blue)
            #if os(macOS)
            .preferredColorScheme(model.theme == .dark ? .dark : .light)
            #endif
            .sheet(item: $model.paywall) { reason in
                PaywallView(reason: reason)
                    .environment(\.palette, palette)
                    #if os(macOS)
                    .frame(width: 560, height: 760)
                    #else
                    .frame(width: 640, height: 820)
                    #endif
            }
            .sheet(isPresented: Binding(
                get: { model.showDisclaimer || !model.disclaimerAccepted },
                set: { if !$0 { model.showDisclaimer = false } })) {
                DisclaimerView(gate: !model.disclaimerAccepted)
                    .environment(\.palette, palette)
            }
            .onChange(of: store.isPro) { _, pro in
                // Close the paywall once Pro arrives (purchase or restore).
                if pro, model.paywall != nil {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { model.paywall = nil }
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        #if os(macOS)
        MacRoot()
        #else
        VisionRoot()
        #endif
    }
}

/// Renders the running session (quiz or flashcards) for the active exam.
struct SessionView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var store: ProStore
    let session: StudySession

    var body: some View {
        switch session {
        case .quiz(let scope):
            QuizView(exam: model.exam, scope: scope)
        case .cards(let scope):
            FlashcardsView(deck: Decks.cards(exam: model.exam, scope: scope, progress: model.progress, isPro: store.isPro), scope: scope)
        }
    }
}

struct DestinationView: View {
    let destination: Destination
    var body: some View {
        switch destination {
        case .home: HomeView()
        case .practice: PracticeView()
        case .cards: CardsSetupView()
        case .answers: AnswerKeyView()
        case .about: AboutView()
        }
    }
}
