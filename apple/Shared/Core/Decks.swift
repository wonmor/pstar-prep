// Flashcard decks and answer-key filtering (FlashcardsScreen / ReviewScreen).
import Foundation

public enum Decks {
    /// Free tier: "all" and "bookmarks" decks only draw from free sections; a
    /// section deck is only reachable when that section is open (Gating).
    public static func cards(exam: Exam, scope: DeckScope, progress: StudyProgress, isPro: Bool) -> [Question] {
        switch scope {
        case .all:
            return Gating.accessibleQuestions(isPro: isPro, sections: exam.sections, questions: exam.questions)
        case .bookmarks:
            let saved = exam.questions.filter { progress.isBookmarked($0.id) }
            return Gating.accessibleQuestions(isPro: isPro, sections: exam.sections, questions: saved)
        case .section(let id):
            guard Gating.canAccessSection(isPro: isPro, sections: exam.sections, sectionID: id) else { return [] }
            return exam.questions(inSection: id)
        }
    }

    public static func title(exam: Exam, scope: DeckScope) -> String {
        switch scope {
        case .all: return "All cards"
        case .bookmarks: return "Bookmarked"
        case .section(let id): return exam.sectionName(id)
        }
    }
}

public enum AnswerKeyFilter: Hashable, Sendable {
    case all
    case bookmarks
    case section(Int)
}

public enum AnswerKey {
    /// Returns the visible questions and how many matching ones are hidden in
    /// locked sections.
    public static func filter(
        exam: Exam, filter: AnswerKeyFilter, query: String, progress: StudyProgress, isPro: Bool
    ) -> (visible: [Question], hidden: Int) {
        var list = exam.questions
        switch filter {
        case .all: break
        case .bookmarks: list = list.filter { progress.isBookmarked($0.id) }
        case .section(let id): list = list.filter { $0.section == id }
        }
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !term.isEmpty {
            list = list.filter { q in
                q.question.lowercased().contains(term)
                    || q.options.contains { $0.lowercased().contains(term) }
                    || q.id.contains(term)
            }
        }
        let visible = Gating.accessibleQuestions(isPro: isPro, sections: exam.sections, questions: list)
        return (visible, list.count - visible.count)
    }
}
