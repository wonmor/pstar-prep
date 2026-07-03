// Registry of the exams the app can study. Each entry bundles its dataset with
// the display copy, pass criteria, source attribution and disclaimer text that
// differ between exams. Pure data — no React here (see exam.tsx for the hook).
import type { Dataset } from './data';
import pstarRaw from '../assets/data/pstar.json';
import rocaRaw from '../assets/data/roca.json';

export type ExamId = 'pstar' | 'roca';

export type ExamMeta = {
  id: ExamId;
  shortName: string; // chip / switch label, e.g. "PSTAR"
  title: string; // hero title, e.g. "PSTAR Prep"
  kicker: string; // small uppercase line above the title
  badge: string; // pill next to the kicker
  subtitle: string; // hero description ({n} fills with question count)
  examSize: number;
  passPct: number;
  source: string; // short attribution shown in copy
  sourceUrl: string;
  sourceLabel: string; // About-screen row label for the official source
  authority: string; // governing body, used in disclaimers
  disclaimer: string[]; // full disclaimer paragraphs (exam-specific)
  dataset: Dataset;
};

export const EXAMS: Record<ExamId, ExamMeta> = {
  pstar: {
    id: 'pstar',
    shortName: 'PSTAR',
    title: 'PSTAR Prep',
    kicker: 'TRANSPORT CANADA · TP 11919E',
    badge: '7th ED · 2022',
    subtitle:
      'Aviation Regulations for the Student Pilot Permit & Private Pilot Licence.',
    examSize: 50,
    passPct: 90,
    source: 'Transport Canada TP 11919E, 7th Edition (Dec 2022)',
    sourceUrl:
      'https://tc.canada.ca/en/aviation/publications/student-pilot-permit-private-pilot-licence-foreign-military-applicants-aviation-regulations-tp-11919',
    sourceLabel: 'Official TC source (TP 11919E)',
    authority: 'Transport Canada',
    disclaimer: [
      'PSTAR & ROC-A Trainer is an independent study aid. It is NOT affiliated with, endorsed by, or sponsored by Transport Canada or the Government of Canada.',
      'The questions, answers, and references are reproduced from Transport Canada publication TP 11919E, 7th Edition (December 2022), for educational use. Reproduction is permitted with acknowledgement to the Department of Transport, Canada.',
      'This material is provided as a study guide only and must not be relied upon as a legal authority. Regulations change. Always verify against the current Canadian Aviation Regulations (CARs) and the Transport Canada Aeronautical Information Manual (TC AIM).',
      'Passing practice quizzes in this app does not guarantee a pass on the official PSTAR examination. No warranty is made as to accuracy or completeness, and the developers accept no liability for any loss arising from use of this app.',
    ],
    dataset: pstarRaw as Dataset,
  },
  roca: {
    id: 'roca',
    shortName: 'ROC-A',
    title: 'ROC-A Prep',
    kicker: 'ISED CANADA · RIC-21',
    badge: 'RADIO LICENCE',
    subtitle:
      'Aeronautical radio operating for the Restricted Operator Certificate (Aeronautical).',
    examSize: 25,
    passPct: 70,
    source: 'Based on ISED RIC-21, Issue 3 (Feb 2010)',
    sourceUrl:
      'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/managing-spectrum/radiocommunication-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-roc',
    sourceLabel: 'ISED study guide (RIC-21)',
    authority: 'Innovation, Science and Economic Development Canada (ISED)',
    disclaimer: [
      'PSTAR & ROC-A Trainer is an independent study aid. It is NOT affiliated with, endorsed by, or sponsored by Innovation, Science and Economic Development Canada (ISED) or the Government of Canada.',
      'The questions are an original practice set based on the topics and procedures in the ISED study guide RIC-21, Issue 3 (February 2010) — Study Guide for the Restricted Operator Certificate (Aeronautical). They are not reproduced from the official examination and are for educational use only.',
      'This material is a study guide only and must not be relied upon as a legal authority. Procedures change. Always verify against the current RIC-21 and the COM section of the Transport Canada Aeronautical Information Manual (TC AIM).',
      'Passing practice quizzes in this app does not guarantee a pass on the official ROC-A examination. No warranty is made as to accuracy or completeness, and the developers accept no liability for any loss arising from use of this app.',
    ],
    dataset: rocaRaw as Dataset,
  },
};

export const EXAM_ORDER: ExamId[] = ['pstar', 'roca'];

export function isExamId(v: unknown): v is ExamId {
  return v === 'pstar' || v === 'roca';
}
