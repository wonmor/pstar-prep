// Per-exam progress, bookmarks and mastery (src/storage.ts). The struct and
// its mutations are pure; ProgressStore in the app persists it.
import Foundation

public struct QStat: Codable, Hashable, Sendable {
    public var seen: Int
    public var correct: Int
    public var lastCorrect: Bool?

    public init(seen: Int = 0, correct: Int = 0, lastCorrect: Bool? = nil) {
        self.seen = seen
        self.correct = correct
        self.lastCorrect = lastCorrect
    }
}

public struct StudyProgress: Codable, Hashable, Sendable {
    public var stats: [String: QStat] = [:]
    public var bookmarks: [String] = []
    /// Flashcards marked "Got it".
    public var known: [String] = []
    public var bestExamPct: Int?
    public var examsTaken = 0

    public init() {}

    // Tolerant decoding: missing keys fall back to empty (as `{...EMPTY, ...JSON}`).
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        stats = try c.decodeIfPresent([String: QStat].self, forKey: .stats) ?? [:]
        bookmarks = try c.decodeIfPresent([String].self, forKey: .bookmarks) ?? []
        known = try c.decodeIfPresent([String].self, forKey: .known) ?? []
        bestExamPct = try c.decodeIfPresent(Int.self, forKey: .bestExamPct)
        examsTaken = try c.decodeIfPresent(Int.self, forKey: .examsTaken) ?? 0
    }

    public mutating func recordAnswer(id: String, correct: Bool) {
        var s = stats[id] ?? QStat()
        s.seen += 1
        if correct { s.correct += 1 }
        s.lastCorrect = correct
        stats[id] = s
    }

    public mutating func recordExam(pct: Int) {
        examsTaken += 1
        bestExamPct = max(bestExamPct ?? pct, pct)
    }

    public mutating func toggleBookmark(_ id: String) {
        if let i = bookmarks.firstIndex(of: id) { bookmarks.remove(at: i) } else { bookmarks.append(id) }
    }

    public mutating func setKnown(_ id: String, _ isKnown: Bool) {
        let has = known.contains(id)
        if isKnown == has { return }
        if isKnown { known.append(id) } else { known.removeAll { $0 == id } }
    }

    public func isBookmarked(_ id: String) -> Bool { bookmarks.contains(id) }
    public func isKnown(_ id: String) -> Bool { known.contains(id) }

    // MARK: Derived stats (HomeScreen / SectionList)

    public var seenCount: Int { stats.count }

    /// Share of seen questions whose last answer was right, 0-100.
    public var accuracy: Int {
        let seen = stats.count
        guard seen > 0 else { return 0 }
        let right = stats.values.filter { $0.lastCorrect == true }.count
        return Scoring.percent(correct: right, total: seen)
    }

    public func coverage(of total: Int) -> Double {
        total > 0 ? Double(stats.count) / Double(total) : 0
    }

    /// Mastery of a set of questions: share whose last answer was right.
    public func mastery(_ questions: [Question]) -> Double {
        guard !questions.isEmpty else { return 0 }
        let right = questions.filter { stats[$0.id]?.lastCorrect == true }.count
        return Double(right) / Double(questions.count)
    }
}
