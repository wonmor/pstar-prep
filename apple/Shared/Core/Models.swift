// Data model for the two exams. Mirrors src/data.ts and src/exams.ts in the
// Expo app; the JSON files in assets/data are shared, not copied.
import Foundation

public struct Question: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let section: Int
    public let sectionName: String
    public let question: String
    public let options: [String]
    /// 1-based index of the correct option (as in the JSON).
    public let answer: Int
    public let reference: String

    public var correctOption: String { options[answer - 1] }
}

public struct ExamSection: Codable, Identifiable, Hashable, Sendable {
    public let id: Int
    public let name: String
}

public struct Dataset: Codable, Sendable {
    public let title: String
    public let source: String
    public let sections: [ExamSection]
    public let questions: [Question]
}

public enum ExamID: String, CaseIterable, Codable, Identifiable, Sendable {
    case pstar, roca
    public var id: String { rawValue }
}

/// Display copy, pass criteria and attribution per exam (src/exams.ts).
public struct ExamMeta: Sendable {
    public let id: ExamID
    public let shortName: String
    public let title: String
    public let kicker: String
    public let badge: String
    public let subtitle: String
    public let examSize: Int
    public let passPct: Int
    public let source: String
    public let sourceURL: URL
    public let sourceLabel: String
    public let authority: String
    public let disclaimer: [String]

    public static func of(_ id: ExamID) -> ExamMeta {
        switch id {
        case .pstar: return .pstar
        case .roca: return .roca
        }
    }

    public static let pstar = ExamMeta(
        id: .pstar,
        shortName: "PSTAR",
        title: "PSTAR Prep",
        kicker: "TRANSPORT CANADA | TP 11919E",
        badge: "7th ED 2022",
        subtitle: "Aviation Regulations for the Student Pilot Permit & Private Pilot Licence.",
        examSize: 50,
        passPct: 90,
        source: "Transport Canada TP 11919E, 7th Edition (Dec 2022)",
        sourceURL: URL(string: "https://tc.canada.ca/en/aviation/publications/student-pilot-permit-private-pilot-licence-foreign-military-applicants-aviation-regulations-tp-11919")!,
        sourceLabel: "Official TC source (TP 11919E)",
        authority: "Transport Canada",
        disclaimer: [
            "PSTAR & ROC-A Trainer is an independent study aid. It is NOT affiliated with, endorsed by, or sponsored by Transport Canada or the Government of Canada.",
            "The questions, answers, and references are reproduced from Transport Canada publication TP 11919E, 7th Edition (December 2022), for educational use. Reproduction is permitted with acknowledgement to the Department of Transport, Canada.",
            "This material is provided as a study guide only and must not be relied upon as a legal authority. Regulations change. Always verify against the current Canadian Aviation Regulations (CARs) and the Transport Canada Aeronautical Information Manual (TC AIM).",
            "Passing practice quizzes in this app does not guarantee a pass on the official PSTAR examination. No warranty is made as to accuracy or completeness, and the developers accept no liability for any loss arising from use of this app.",
        ]
    )

    public static let roca = ExamMeta(
        id: .roca,
        shortName: "ROC-A",
        title: "ROC-A Prep",
        kicker: "ISED CANADA | RIC-21",
        badge: "RADIO LICENCE",
        subtitle: "Aeronautical radio operating for the Restricted Operator Certificate (Aeronautical).",
        examSize: 25,
        passPct: 70,
        source: "Based on ISED RIC-21, Issue 3 (Feb 2010)",
        sourceURL: URL(string: "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/managing-spectrum/radiocommunication-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-roc")!,
        sourceLabel: "ISED study guide (RIC-21)",
        authority: "Innovation, Science and Economic Development Canada (ISED)",
        disclaimer: [
            "PSTAR & ROC-A Trainer is an independent study aid. It is NOT affiliated with, endorsed by, or sponsored by Innovation, Science and Economic Development Canada (ISED) or the Government of Canada.",
            "The questions are an original practice set based on the topics and procedures in the ISED study guide RIC-21, Issue 3 (February 2010) \u{2014} Study Guide for the Restricted Operator Certificate (Aeronautical). They are not reproduced from the official examination and are for educational use only.",
            "This material is a study guide only and must not be relied upon as a legal authority. Procedures change. Always verify against the current RIC-21 and the COM section of the Transport Canada Aeronautical Information Manual (TC AIM).",
            "Passing practice quizzes in this app does not guarantee a pass on the official ROC-A examination. No warranty is made as to accuracy or completeness, and the developers accept no liability for any loss arising from use of this app.",
        ]
    )
}

/// One exam's dataset bound to its rules (makeExamApi in data.ts).
public struct Exam: Sendable {
    public let meta: ExamMeta
    public let dataset: Dataset

    public init(meta: ExamMeta, dataset: Dataset) {
        self.meta = meta
        self.dataset = dataset
    }

    public var id: ExamID { meta.id }
    public var questions: [Question] { dataset.questions }
    public var sections: [ExamSection] { dataset.sections }
    public var examSize: Int { meta.examSize }
    public var passPct: Int { meta.passPct }

    public func sectionName(_ id: Int) -> String {
        sections.first { $0.id == id }?.name ?? "Section \(id)"
    }

    public func questions(inSection id: Int) -> [Question] {
        questions.filter { $0.section == id }
    }

    public func question(id: String) -> Question? {
        questions.first { $0.id == id }
    }

    /// `.mock` draws `examSize` random questions across all sections;
    /// `.section(n)` is every question in that section, shuffled.
    public func buildQuiz<R: RandomNumberGenerator>(_ scope: QuizScope, using rng: inout R) -> [Question] {
        switch scope {
        case .mock: return Array(questions.shuffled(using: &rng).prefix(examSize))
        case .section(let id): return questions(inSection: id).shuffled(using: &rng)
        }
    }

    public func buildQuiz(_ scope: QuizScope) -> [Question] {
        var g = SystemRandomNumberGenerator()
        return buildQuiz(scope, using: &g)
    }
}

public enum QuizScope: Hashable, Sendable {
    case mock
    case section(Int)

    public var isMock: Bool { if case .mock = self { return true } else { return false } }
}

public enum DeckScope: Hashable, Sendable {
    case all
    case bookmarks
    case section(Int)
}

public enum CatalogError: Error {
    case missing(String)
}

public enum Catalog {
    /// Loads `pstar.json` / `roca.json` from the given bundle.
    public static func load(_ id: ExamID, bundle: Bundle) throws -> Exam {
        guard let url = bundle.url(forResource: id.rawValue, withExtension: "json") else {
            throw CatalogError.missing("\(id.rawValue).json")
        }
        let data = try Data(contentsOf: url)
        let dataset = try JSONDecoder().decode(Dataset.self, from: data)
        return Exam(meta: .of(id), dataset: dataset)
    }
}
