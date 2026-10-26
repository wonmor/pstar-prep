// Free vs Pro rules, ported one-to-one from src/gating.ts. Pure functions only.
//
// Free tier (per exam):
//   - the first `freeSectionCount` sections in practice, flashcards and the answer key
//   - `freeMocksPerDay` full mock exam(s) per calendar day
// Pro (one entitlement, covers both PSTAR and ROC-A):
//   - every section, unlimited mock exams
//
// Bookmarks and progress are never gated: a free user keeps everything they saved.
import Foundation

public enum Gating {
    public static let freeSectionCount = 3
    public static let freeMocksPerDay = 1

    /// Section ids that are free, in the dataset's own display order.
    public static func freeSectionIDs(_ sections: [ExamSection]) -> Set<Int> {
        Set(sections.prefix(freeSectionCount).map(\.id))
    }

    public static func canAccessSection(isPro: Bool, sections: [ExamSection], sectionID: Int) -> Bool {
        isPro || freeSectionIDs(sections).contains(sectionID)
    }

    public static func canAccessQuestion(isPro: Bool, sections: [ExamSection], question: Question) -> Bool {
        canAccessSection(isPro: isPro, sections: sections, sectionID: question.section)
    }

    public static func accessibleQuestions(isPro: Bool, sections: [ExamSection], questions: [Question]) -> [Question] {
        if isPro { return questions }
        let free = freeSectionIDs(sections)
        return questions.filter { free.contains($0.section) }
    }

    public static func lockedSectionCount(isPro: Bool, sections: [ExamSection]) -> Int {
        isPro ? 0 : max(0, sections.count - freeSectionCount)
    }

    /// Local calendar day, e.g. "2026-10-20", so the daily mock resets at the
    /// user's midnight.
    public static func dayKey(_ date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// Mock exams the user can still start today (`Int.max` for Pro).
    public static func mocksRemaining(isPro: Bool, startedDays: [String], today: String) -> Int {
        if isPro { return Int.max }
        let used = startedDays.filter { $0 == today }.count
        return max(0, freeMocksPerDay - used)
    }

    public static func canStartMock(isPro: Bool, startedDays: [String], today: String) -> Bool {
        mocksRemaining(isPro: isPro, startedDays: startedDays, today: today) > 0
    }

    /// Record a mock start, keeping only the last few entries so storage stays tiny.
    public static func logMockStart(_ startedDays: [String], today: String, keep: Int = 14) -> [String] {
        Array((startedDays + [today]).suffix(keep))
    }

    /// Is a quiz viewable right now? Mock exams are metered at start time
    /// (canStartMock), so only section-scoped sessions are checked here.
    public static func quizAllowed(isPro: Bool, sections: [ExamSection], scope: QuizScope) -> Bool {
        if case .section(let id) = scope { return canAccessSection(isPro: isPro, sections: sections, sectionID: id) }
        return true
    }

    public static func deckAllowed(isPro: Bool, sections: [ExamSection], scope: DeckScope) -> Bool {
        if case .section(let id) = scope { return canAccessSection(isPro: isPro, sections: sections, sectionID: id) }
        return true
    }

    /// Which tier applies. There is no free web build on these platforms, so
    /// Pro comes from the store entitlement, or from a debug-only QA override.
    public static func resolveIsPro(entitled: Bool, forcePro: Bool) -> Bool {
        forcePro || entitled
    }
}
