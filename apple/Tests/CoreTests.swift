// Unit tests for the ported rules: gating (mirrors tests/gating.test.ts),
// quiz scoring, progress and deck / answer-key filtering. The Core sources are
// compiled straight into this bundle, so no app host is needed.
import XCTest

/// Deterministic RNG (SplitMix64) for reproducible shuffles.
struct SeededRNG: RandomNumberGenerator {
    var state: UInt64
    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

private let bundle = Bundle(for: GatingTests.self)
private func exam(_ id: ExamID) -> Exam { try! Catalog.load(id, bundle: bundle) }

private func sections(_ ids: [Int]) -> [ExamSection] { ids.map { ExamSection(id: $0, name: "S\($0)") } }
private func q(_ id: String, _ section: Int, answer: Int = 1) -> Question {
    Question(id: id, section: section, sectionName: "S\(section)", question: "Q\(id)", options: ["a", "b", "c", "d"], answer: answer, reference: "ref")
}

final class DatasetTests: XCTestCase {
    func testDatasetsLoadAndAreValid() {
        let p = exam(.pstar), r = exam(.roca)
        XCTAssertEqual(p.questions.count, 185)
        XCTAssertEqual(p.sections.count, 14)
        XCTAssertEqual(r.sections.count, 10)
        XCTAssertEqual(r.questions.count, 90)
        for e in [p, r] {
            for question in e.questions {
                XCTAssertEqual(question.options.count, 4, question.id)
                XCTAssertTrue((1...4).contains(question.answer), question.id)
                XCTAssertTrue(e.sections.contains { $0.id == question.section }, question.id)
            }
            XCTAssertEqual(Set(e.questions.map(\.id)).count, e.questions.count, "unique ids")
        }
    }

    func testExamRules() {
        XCTAssertEqual(exam(.pstar).examSize, 50)
        XCTAssertEqual(exam(.pstar).passPct, 90)
        XCTAssertEqual(exam(.roca).examSize, 25)
        XCTAssertEqual(exam(.roca).passPct, 70)
    }

    func testNoForbiddenSeparatorsInCopy() {
        for id in ExamID.allCases {
            let m = ExamMeta.of(id)
            for s in [m.kicker, m.badge, m.subtitle, m.title] + m.disclaimer {
                XCTAssertFalse(s.contains("\u{00B7}"), s)
                XCTAssertFalse(s.contains("\u{2022}"), s)
            }
        }
    }
}

final class GatingTests: XCTestCase {
    let secs = sections([1, 2, 3, 4, 5])

    func testFreeSectionsAreTheFirstThreeInDisplayOrder() {
        XCTAssertEqual(Gating.freeSectionIDs(secs), [1, 2, 3])
        XCTAssertEqual(Gating.freeSectionIDs(sections([9, 4, 7, 1])), [9, 4, 7])
        XCTAssertEqual(Gating.freeSectionIDs(sections([2])), [2])
    }

    func testSectionAccess() {
        XCTAssertTrue(Gating.canAccessSection(isPro: false, sections: secs, sectionID: 3))
        XCTAssertFalse(Gating.canAccessSection(isPro: false, sections: secs, sectionID: 4))
        XCTAssertTrue(Gating.canAccessSection(isPro: true, sections: secs, sectionID: 5))
        XCTAssertTrue(Gating.canAccessQuestion(isPro: false, sections: secs, question: q("1.1", 1)))
        XCTAssertFalse(Gating.canAccessQuestion(isPro: false, sections: secs, question: q("5.1", 5)))
    }

    func testAccessibleQuestions() {
        let qs = [q("1", 1), q("4", 4), q("2", 2), q("5", 5)]
        XCTAssertEqual(Gating.accessibleQuestions(isPro: false, sections: secs, questions: qs).map(\.id), ["1", "2"])
        XCTAssertEqual(Gating.accessibleQuestions(isPro: true, sections: secs, questions: qs).count, 4)
    }

    func testLockedCount() {
        XCTAssertEqual(Gating.lockedSectionCount(isPro: false, sections: secs), 2)
        XCTAssertEqual(Gating.lockedSectionCount(isPro: true, sections: secs), 0)
        XCTAssertEqual(Gating.lockedSectionCount(isPro: false, sections: sections([1, 2])), 0)
        XCTAssertEqual(Gating.lockedSectionCount(isPro: false, sections: exam(.pstar).sections), 11)
        XCTAssertEqual(Gating.lockedSectionCount(isPro: false, sections: exam(.roca).sections), 7)
    }

    func testDayKeyIsLocalAndZeroPadded() {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "America/Toronto")!
        let d = cal.date(from: DateComponents(year: 2026, month: 3, day: 7, hour: 23, minute: 30))!
        XCTAssertEqual(Gating.dayKey(d, calendar: cal), "2026-03-07")
    }

    func testDailyMockMeter() {
        XCTAssertEqual(Gating.mocksRemaining(isPro: false, startedDays: [], today: "2026-10-20"), 1)
        XCTAssertEqual(Gating.mocksRemaining(isPro: false, startedDays: ["2026-10-20"], today: "2026-10-20"), 0)
        XCTAssertEqual(Gating.mocksRemaining(isPro: false, startedDays: ["2026-10-19"], today: "2026-10-20"), 1, "resets next day")
        XCTAssertEqual(Gating.mocksRemaining(isPro: true, startedDays: ["2026-10-20", "2026-10-20"], today: "2026-10-20"), Int.max)
        XCTAssertFalse(Gating.canStartMock(isPro: false, startedDays: ["2026-10-20"], today: "2026-10-20"))
        XCTAssertTrue(Gating.canStartMock(isPro: true, startedDays: ["2026-10-20"], today: "2026-10-20"))
    }

    func testMockLogKeepsLastEntries() {
        var log: [String] = []
        for i in 1...20 { log = Gating.logMockStart(log, today: "d\(i)") }
        XCTAssertEqual(log.count, 14)
        XCTAssertEqual(log.first, "d7")
        XCTAssertEqual(log.last, "d20")
    }

    func testRouteGuards() {
        XCTAssertTrue(Gating.quizAllowed(isPro: false, sections: secs, scope: .mock), "mocks are metered at start, not here")
        XCTAssertTrue(Gating.quizAllowed(isPro: false, sections: secs, scope: .section(2)))
        XCTAssertFalse(Gating.quizAllowed(isPro: false, sections: secs, scope: .section(4)))
        XCTAssertTrue(Gating.quizAllowed(isPro: true, sections: secs, scope: .section(4)))
        XCTAssertTrue(Gating.deckAllowed(isPro: false, sections: secs, scope: .all))
        XCTAssertTrue(Gating.deckAllowed(isPro: false, sections: secs, scope: .bookmarks))
        XCTAssertFalse(Gating.deckAllowed(isPro: false, sections: secs, scope: .section(5)))
    }

    func testResolveIsPro() {
        XCTAssertFalse(Gating.resolveIsPro(entitled: false, forcePro: false))
        XCTAssertTrue(Gating.resolveIsPro(entitled: true, forcePro: false))
        XCTAssertTrue(Gating.resolveIsPro(entitled: false, forcePro: true))
    }
}

final class QuizTests: XCTestCase {
    func testScoringRoundsLikeMathRound() {
        XCTAssertEqual(Scoring.percent(correct: 45, total: 50), 90)
        XCTAssertEqual(Scoring.percent(correct: 1, total: 8), 13) // 12.5 rounds up
        XCTAssertEqual(Scoring.percent(correct: 2, total: 3), 67)
        XCTAssertEqual(Scoring.percent(correct: 0, total: 0), 0)
    }

    func testPassMarkBoundary() {
        XCTAssertTrue(QuizResult(correct: 45, total: 50, isMock: true, passPct: 90, wrongIDs: []).passed)
        XCTAssertFalse(QuizResult(correct: 44, total: 50, isMock: true, passPct: 90, wrongIDs: []).passed)
        XCTAssertTrue(QuizResult(correct: 18, total: 25, isMock: true, passPct: 70, wrongIDs: []).passed) // 72
        XCTAssertFalse(QuizResult(correct: 17, total: 25, isMock: true, passPct: 70, wrongIDs: []).passed) // 68
    }

    func testMockDrawsExamSizeUniqueQuestions() {
        var rng = SeededRNG(state: 42)
        for id in ExamID.allCases {
            let e = exam(id)
            let s = QuizSession(exam: e, scope: .mock, using: &rng)
            XCTAssertEqual(s.total, e.examSize)
            XCTAssertEqual(Set(s.items.map(\.question.id)).count, e.examSize)
        }
    }

    func testSectionQuizHasEveryQuestionOfThatSection() {
        var rng = SeededRNG(state: 7)
        let e = exam(.pstar)
        let s = QuizSession(exam: e, scope: .section(3), using: &rng)
        XCTAssertEqual(Set(s.items.map(\.question.id)), Set(e.questions(inSection: 3).map(\.id)))
    }

    func testShuffledOptionsTrackTheCorrectAnswer() {
        var rng = SeededRNG(state: 1)
        for question in exam(.pstar).questions {
            let o = ShuffledOptions(question, using: &rng)
            XCTAssertEqual(o.labels[o.correctIndex], question.correctOption)
            XCTAssertEqual(Set(o.labels), Set(question.options))
        }
    }

    func testPracticeRevealsAndLocks() {
        let items = [q("1", 1, answer: 2), q("2", 1, answer: 1)].map { QuizItem(question: $0, options: shuffled($0)) }
        var s = QuizSession(scope: .section(1), passPct: 90, items: items)
        XCTAssertFalse(s.canAdvance)
        XCTAssertFalse(s.next(), "can't skip unanswered in practice")
        let right1 = s.current.options.correctIndex
        let wrong1 = (right1 + 1) % 4
        XCTAssertEqual(s.choose(wrong1), .revealed(questionID: "1", correct: false))
        XCTAssertEqual(s.optionState(right1), .correct)
        XCTAssertEqual(s.optionState(wrong1), .wrong)
        XCTAssertEqual(s.optionState((right1 + 2) % 4), .idle)
        XCTAssertEqual(s.choose(right1), .ignored, "locked after reveal")
        XCTAssertTrue(s.next())
        XCTAssertFalse(s.revealed)
        XCTAssertEqual(s.choose(s.current.options.correctIndex), .revealed(questionID: "2", correct: true))
        XCTAssertFalse(s.next(), "last question: caller finishes")
        let (r, answers) = s.finish()
        XCTAssertEqual(r.correct, 1)
        XCTAssertEqual(r.pct, 50)
        XCTAssertEqual(r.wrongIDs, ["1"])
        XCTAssertTrue(answers.isEmpty, "practice records on reveal, not on finish")
    }

    func testMockHidesAnswersAllowsChangesAndScoresUnansweredAsWrong() {
        let items = (1...4).map { q("\($0)", 1, answer: 1) }.map { QuizItem(question: $0, options: shuffled($0)) }
        var s = QuizSession(scope: .mock, passPct: 70, items: items)
        let right = { (s: QuizSession) in s.current.options.correctIndex }
        let wrong = { (s: QuizSession) in (s.current.options.correctIndex + 1) % 4 }
        XCTAssertEqual(s.choose(wrong(s)), .selected)
        XCTAssertEqual(s.optionState(wrong(s)), .selected, "no reveal during a mock")
        XCTAssertEqual(s.optionState(right(s)), .idle)
        XCTAssertEqual(s.choose(right(s)), .selected, "answers stay editable")
        XCTAssertTrue(s.next())
        s.choose(right(s))
        XCTAssertTrue(s.next())
        s.back()
        XCTAssertEqual(s.index, 1)
        s.jump(to: 3)
        s.choose(wrong(s))
        XCTAssertFalse(s.next(), "last question")
        XCTAssertEqual(s.answeredCount, 3)
        let (r, answers) = s.finish()
        XCTAssertEqual(r.correct, 2)
        XCTAssertEqual(r.total, 4)
        XCTAssertEqual(r.pct, 50)
        XCTAssertFalse(r.passed)
        XCTAssertEqual(Set(r.wrongIDs), ["3", "4"], "unanswered (3) and wrong (4)")
        XCTAssertEqual(answers.count, 4, "mock records every question on submit")
    }

    /// Shuffled options from a seeded generator; the tests only rely on
    /// `correctIndex` tracking the answer, whatever the order.
    private func shuffled(_ q: Question) -> ShuffledOptions {
        var g = SeededRNG(state: q.id.utf8.reduce(0) { $0 &* 31 &+ UInt64($1) })
        return ShuffledOptions(q, using: &g)
    }
}

final class ProgressTests: XCTestCase {
    func testRecordAnswerAndExam() {
        var p = StudyProgress()
        p.recordAnswer(id: "1", correct: true)
        p.recordAnswer(id: "1", correct: false)
        p.recordAnswer(id: "2", correct: true)
        XCTAssertEqual(p.stats["1"], QStat(seen: 2, correct: 1, lastCorrect: false))
        XCTAssertEqual(p.seenCount, 2)
        XCTAssertEqual(p.accuracy, 50)
        p.recordExam(pct: 80)
        p.recordExam(pct: 92)
        p.recordExam(pct: 70)
        XCTAssertEqual(p.bestExamPct, 92)
        XCTAssertEqual(p.examsTaken, 3)
    }

    func testBookmarksAndKnown() {
        var p = StudyProgress()
        p.toggleBookmark("a")
        p.toggleBookmark("b")
        p.toggleBookmark("a")
        XCTAssertEqual(p.bookmarks, ["b"])
        p.setKnown("x", true)
        p.setKnown("x", true)
        XCTAssertEqual(p.known, ["x"])
        p.setKnown("x", false)
        XCTAssertEqual(p.known, [])
    }

    func testMastery() {
        var p = StudyProgress()
        let qs = [q("1", 1), q("2", 1), q("3", 1), q("4", 1)]
        p.recordAnswer(id: "1", correct: true)
        p.recordAnswer(id: "2", correct: false)
        p.recordAnswer(id: "3", correct: true)
        XCTAssertEqual(p.mastery(qs), 0.5)
        XCTAssertEqual(p.coverage(of: 4), 0.75)
    }

    func testDecodesExpoShapeAndPartialJSON() throws {
        let json = #"{"stats":{"1.01":{"seen":3,"correct":2,"lastCorrect":true}},"bookmarks":["1.02"],"known":[],"bestExamPct":null,"examsTaken":1}"#
        let p = try JSONDecoder().decode(StudyProgress.self, from: Data(json.utf8))
        XCTAssertEqual(p.stats["1.01"]?.correct, 2)
        XCTAssertEqual(p.bookmarks, ["1.02"])
        XCTAssertNil(p.bestExamPct)
        let partial = try JSONDecoder().decode(StudyProgress.self, from: Data(#"{"bookmarks":["x"]}"#.utf8))
        XCTAssertEqual(partial.bookmarks, ["x"])
        XCTAssertEqual(partial.examsTaken, 0)
        let round = try JSONDecoder().decode(StudyProgress.self, from: JSONEncoder().encode(p))
        XCTAssertEqual(round, p)
    }
}

final class DeckTests: XCTestCase {
    func testFreeDecksOnlyDrawFromFreeSections() {
        let e = exam(.pstar)
        var p = StudyProgress()
        let locked = e.questions.first { $0.section == 10 }!
        let free = e.questions.first { $0.section == 1 }!
        p.toggleBookmark(locked.id)
        p.toggleBookmark(free.id)

        let all = Decks.cards(exam: e, scope: .all, progress: p, isPro: false)
        XCTAssertTrue(all.allSatisfy { [1, 2, 3].contains($0.section) })
        XCTAssertEqual(all.count, e.questions.filter { $0.section <= 3 }.count)
        XCTAssertEqual(Decks.cards(exam: e, scope: .all, progress: p, isPro: true).count, 185)

        XCTAssertEqual(Decks.cards(exam: e, scope: .bookmarks, progress: p, isPro: false).map(\.id), [free.id],
                       "bookmarks are kept but locked ones stay hidden")
        XCTAssertEqual(Decks.cards(exam: e, scope: .bookmarks, progress: p, isPro: true).count, 2)
        XCTAssertTrue(Decks.cards(exam: e, scope: .section(10), progress: p, isPro: false).isEmpty)
        XCTAssertFalse(Decks.cards(exam: e, scope: .section(10), progress: p, isPro: true).isEmpty)
    }

    func testAnswerKeyFilterCountsHidden() {
        let e = exam(.pstar)
        let p = StudyProgress()
        let all = AnswerKey.filter(exam: e, filter: .all, query: "", progress: p, isPro: false)
        XCTAssertEqual(all.visible.count + all.hidden, 185)
        XCTAssertGreaterThan(all.hidden, 0)
        let pro = AnswerKey.filter(exam: e, filter: .all, query: "", progress: p, isPro: true)
        XCTAssertEqual(pro.hidden, 0)
        let search = AnswerKey.filter(exam: e, filter: .all, query: "  RIGHT OF WAY ", progress: p, isPro: true)
        XCTAssertFalse(search.visible.isEmpty)
        XCTAssertTrue(search.visible.allSatisfy { q in
            q.question.lowercased().contains("right of way") || q.options.contains { $0.lowercased().contains("right of way") }
        })
        let byID = AnswerKey.filter(exam: e, filter: .all, query: "1.01", progress: p, isPro: false)
        XCTAssertTrue(byID.visible.contains { $0.id == "1.01" })
    }
}
