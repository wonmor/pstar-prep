// Illustration catalogue: the platform-neutral manifest (assets/illustrations/
// manifest.json) joined with the bundled SVG markup. Lookups are by exam +
// question id, by topic, and for the interactive "spot it" mode.
import manifestRaw from '../../assets/illustrations/manifest.json';
import { SVG } from './svg.generated';
import type { ExamId } from '../exams';
import { colors, themeMode } from '../theme';

export type SpotTarget = { id: string; label: string; rect: [number, number, number, number]; correct: boolean };
export type Spot = { prompt: string; targets: SpotTarget[]; questions: string[] };

export type Illustration = {
  id: string;
  file: string;
  topic: string;
  title: string;
  alt: string;
  caption: string;
  explanation: string;
  exams: ExamId[];
  questions: string[]; // "<exam>:<question id>"
  spot?: Spot;
  width: number;
  height: number;
};

type ManifestShape = {
  palette: Record<string, string>;
  illustrations: Omit<Illustration, 'width' | 'height'>[];
};

const manifest = manifestRaw as unknown as ManifestShape;

export const ILLUSTRATIONS: Illustration[] = manifest.illustrations.map((m) => {
  const svg = SVG[m.id];
  return { ...m, width: svg?.w ?? 600, height: svg?.h ?? 360 };
});

const byId = new Map(ILLUSTRATIONS.map((i) => [i.id, i]));
const byQuestion = new Map<string, Illustration>();
for (const ill of ILLUSTRATIONS) {
  for (const q of ill.questions) if (!byQuestion.has(q)) byQuestion.set(q, ill);
}

export function illustrationById(id: string): Illustration | undefined {
  return byId.get(id);
}

// The diagram attached to a question, if any.
export function illustrationFor(exam: ExamId, questionId: string): Illustration | undefined {
  return byQuestion.get(`${exam}:${questionId}`);
}

// Diagrams relevant to one exam (visual flashcard deck), in manifest order.
export function illustrationsForExam(exam: ExamId): Illustration[] {
  return ILLUSTRATIONS.filter((i) => i.exams.includes(exam));
}

// Question ids (for the given exam) that an illustration is attached to.
export function questionIdsFor(ill: Illustration, exam: ExamId): string[] {
  const prefix = `${exam}:`;
  return ill.questions.filter((q) => q.startsWith(prefix)).map((q) => q.slice(prefix.length));
}

// Diagrams with a spot-it interaction for an exam.
export function spotsForExam(exam: ExamId): Illustration[] {
  return ILLUSTRATIONS.filter((i) => i.spot && i.exams.includes(exam));
}

// Raw SVG markup recoloured for the active theme. The files are authored in
// the light palette; in "Night paper" each palette hex is swapped for the
// matching theme colour. Fonts: the SVGs name the Jost family generically,
// and here it is mapped onto the font families expo-font registers so the
// diagrams use the same type as the rest of the app.
const FONT_RE = /font-family="[^"]*" font-size="([\d.]+)" font-weight="(\d+)"/g;
const WEIGHT_FAMILY: Record<string, string> = {
  '900': 'Jost_900Black',
  '800': 'Jost_800ExtraBold',
  '700': 'Jost_700Bold',
  '500': 'Jost_500Medium',
  '400': 'Jost_400Regular',
};

const cache = new Map<string, string>();

export function themedSvg(id: string): string | null {
  const entry = SVG[id];
  if (!entry) return null;
  const mode = themeMode();
  const key = `${mode}:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let xml = entry.xml.replace(FONT_RE, (_m, size, weight) => {
    const fam = WEIGHT_FAMILY[weight] ?? 'Jost_500Medium';
    return `font-family="${fam}" font-size="${size}" font-weight="${weight}"`;
  });
  if (mode === 'dark') {
    const map: Record<string, string> = {
      paper: colors.paper,
      paperDeep: colors.paperDeep,
      card: colors.card,
      line: colors.line,
      lineStrong: colors.lineStrong,
      ink: colors.ink,
      inkSoft: colors.inkSoft,
      red: colors.red,
      blue: colors.blue,
      yellow: colors.yellow,
      green: colors.green,
    };
    for (const [name, lightHex] of Object.entries(manifest.palette)) {
      const dark = map[name];
      if (dark) xml = xml.split(lightHex).join(dark);
    }
  }
  cache.set(key, xml);
  return xml;
}

export const ILLUSTRATION_PALETTE = manifest.palette;
