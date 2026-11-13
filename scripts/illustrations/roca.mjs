// ROC-A drawings: phonetic alphabet, numbers, radio call structure, distress
// and urgency procedures.
import { P, svg, t, kicker, rect, line, arrow, tag, note } from './lib.mjs';

const ALPHA = [
  ['A', 'Alfa'], ['B', 'Bravo'], ['C', 'Charlie'], ['D', 'Delta'], ['E', 'Echo'], ['F', 'Foxtrot'], ['G', 'Golf'],
  ['H', 'Hotel'], ['I', 'India'], ['J', 'Juliett'], ['K', 'Kilo'], ['L', 'Lima'], ['M', 'Mike'], ['N', 'November'],
  ['O', 'Oscar'], ['P', 'Papa'], ['Q', 'Quebec'], ['R', 'Romeo'], ['S', 'Sierra'], ['T', 'Tango'], ['U', 'Uniform'],
  ['V', 'Victor'], ['W', 'Whiskey'], ['X', 'X-ray'], ['Y', 'Yankee'], ['Z', 'Zulu'],
];
const DIGITS = [['0', 'zero'], ['1', 'wun'], ['2', 'too'], ['3', 'tree'], ['4', 'fower'], ['5', 'fife'], ['6', 'six'], ['7', 'seven'], ['8', 'ait'], ['9', 'niner']];

export function phoneticAlphabet(ill) {
  const parts = [kicker(20, 20, 'ITU phonetic alphabet (RIC-21 section 5.3)')];
  const cols = 4;
  const cw = 140;
  const rh = 34;
  ALPHA.forEach(([l, w], i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = 20 + c * cw;
    const y = 30 + r * rh;
    const odd = ['Alfa', 'Juliett'].includes(w);
    parts.push(rect(x, y, cw - 6, rh - 4, { fill: odd ? P.paperDeep : P.card, stroke: odd ? P.red : P.line, sw: odd ? 1.5 : 1, r: 3 }));
    parts.push(t(x + 10, y + 22, l, { size: 17, weight: 900, fill: P.blue }));
    parts.push(t(x + 36, y + 21, w, { size: 14, weight: 700, fill: odd ? P.red : P.ink }));
  });
  // Spelling note in the empty cells of the last row.
  parts.push(t(300, 262, 'Watch the spellings: Alfa (not Alpha) and Juliett (not Juliet).', { size: 9.5, weight: 700, fill: P.red }));
  // Digits.
  parts.push(kicker(20, 300, 'Numbers'));
  DIGITS.forEach(([d, w], i) => {
    const x = 20 + i * 56;
    parts.push(rect(x, 308, 50, 54, { fill: P.card, stroke: P.line, sw: 1, r: 3 }));
    parts.push(t(x + 25, 334, d, { size: 20, weight: 900, anchor: 'middle', fill: P.blue }));
    parts.push(t(x + 25, 353, w, { size: 11, weight: 700, anchor: 'middle', fill: ['tree', 'fower', 'fife', 'niner'].includes(w) ? P.red : P.ink }));
  });
  parts.push(rect(20, 372, 270, 30, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 3 }));
  parts.push(t(30, 392, 'decimal', { size: 13, weight: 900, fill: P.ink }));
  parts.push(t(100, 392, 'the point: one two one decimal fife', { size: 10.5 }));
  parts.push(rect(300, 372, 280, 30, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 3 }));
  parts.push(t(310, 392, 'thousand', { size: 13, weight: 900, fill: P.ink }));
  parts.push(t(392, 392, 'whole thousands: one one thousand', { size: 10.5 }));
  parts.push(note(300, 426, 'Call signs are always spelled phonetically. The alphabet is the ITU alphabet, not a military or police code.', { anchor: 'middle' }));
  return svg({ title: ill.title, h: 440 }, parts);
}

export function numberTransmission(ill) {
  const rows = [
    ['11,000', 'one one thousand', 'whole thousands use "thousand"'],
    ['5,800', 'five eight zero zero', 'everything else, digit by digit'],
    ['121.5 MHz', 'one two one decimal five', 'frequencies use "decimal"'],
    ['2,700 ft ASL', 'two thousand seven hundred', 'thousands and hundreds'],
    ['heading 090', 'zero niner zero', 'headings: three digits'],
    ['1:45 p.m.', '1345: one three four five', '24-hour clock, four figures, UTC (zulu)'],
  ];
  const parts = [kicker(20, 20, 'Transmitting numbers and time (RIC-21 sections 5.2 and 5.4)')];
  rows.forEach(([v, spoken, why], i) => {
    const y = 34 + i * 48;
    parts.push(rect(20, y, 560, 42, { fill: i % 2 ? P.card : P.paperDeep, stroke: P.line, sw: 1, r: 3 }));
    parts.push(t(32, y + 27, v, { size: 16, weight: 900, fill: P.blue }));
    parts.push(arrow(170, y + 21, 196, y + 21, { stroke: P.inkSoft, sw: 1.5, size: 7 }));
    parts.push(t(206, y + 27, spoken, { size: 15, weight: 700, fill: P.red }));
    parts.push(t(568, y + 27, why, { size: 10, anchor: 'end', fill: P.inkSoft }));
  });
  parts.push(note(300, 348, 'Time is referenced to Coordinated Universal Time. Only the minutes are needed when there is no risk of confusion.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function radioCallStructure(ill) {
  const parts = [kicker(20, 20, 'Structure of a radio call')];
  const blocks = [
    [20, 150, 'Timmins Radio', 'station being called', 'said first', P.blue],
    [176, 70, 'THIS IS', 'link words', '', P.ink],
    [252, 238, 'Cessna Golf Alfa Bravo Charlie', 'your call sign', 'type + last four letters', P.red],
    [496, 84, '[message]', 'your message', '', P.inkSoft],
  ];
  blocks.forEach(([x, w, s, l1, l2, color]) => {
    parts.push(tag(x, 40, w, 40, s, { fill: color, size: w > 200 ? 10 : 11.5, upper: true }));
    parts.push(t(x + w / 2, 98, l1, { size: 10.5, weight: 700, anchor: 'middle' }));
    if (l2) parts.push(t(x + w / 2, 111, l2, { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  });
  parts.push(tag(20, 124, 90, 32, 'OVER', { fill: P.blue, size: 12 }));
  parts.push(t(118, 138, 'my transmission is ended and I expect a reply', { size: 10.5 }));
  parts.push(tag(20, 162, 90, 32, 'OUT', { fill: P.ink, size: 12 }));
  parts.push(t(118, 176, 'conversation ended, no reply expected', { size: 10.5 }));
  // Registration breakdown.
  parts.push(kicker(360, 136, 'Canadian private registration'));
  parts.push(t(360, 174, 'C-', { size: 26, weight: 900, fill: P.inkSoft }));
  parts.push(t(392, 174, 'GABC', { size: 26, weight: 900, fill: P.red, ls: 2 }));
  parts.push(line(392, 180, 470, 180, { stroke: P.red, sw: 2 }));
  parts.push(t(392, 194, 'last four letters, in phonetics', { size: 9.5, fill: P.red, weight: 700 }));
  parts.push(t(360, 194, 'drop', { size: 9, fill: P.inkSoft }));
  // Abbreviation and ground stations.
  parts.push(rect(20, 212, 270, 92, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 4 }));
  parts.push(t(32, 232, 'After contact is established', { size: 11, weight: 700 }));
  parts.push(t(32, 250, 'Golf Bravo Charlie', { size: 14, weight: 900, fill: P.red }));
  parts.push(t(32, 266, 'the first letters may be dropped, but only if', { size: 9.5, fill: P.inkSoft }));
  parts.push(t(32, 278, 'ATS starts it and there is no risk of confusion.', { size: 9.5, fill: P.inkSoft }));
  parts.push(t(32, 294, 'Use the full call sign at the start and the end.', { size: 9.5, weight: 700 }));
  parts.push(rect(310, 212, 270, 92, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 4 }));
  parts.push(t(322, 232, 'Ground stations: location + function', { size: 11, weight: 700 }));
  parts.push(t(322, 252, 'Timmins Radio', { size: 12, weight: 900, fill: P.blue }));
  parts.push(t(430, 252, 'FSS or FIC', { size: 10, fill: P.inkSoft }));
  parts.push(t(322, 270, 'Toronto Tower', { size: 12, weight: 900, fill: P.blue }));
  parts.push(t(430, 270, 'airport control', { size: 10, fill: P.inkSoft }));
  parts.push(t(322, 288, 'Ottawa Ground', { size: 12, weight: 900, fill: P.blue }));
  parts.push(t(430, 288, 'ground control', { size: 10, fill: P.inkSoft }));
  parts.push(t(300, 328, 'Listen before you transmit. In good conditions say each call sign once; "GO AHEAD" invites the message.', { size: 10.5, weight: 700, anchor: 'middle' }));
  parts.push(note(300, 346, 'Unsure a call is for you? Wait until it is repeated and understood. Air carriers use the company name plus flight number.', { anchor: 'middle', size: 9.5 }));
  return svg({ title: ill.title, h: 360 }, parts);
}

export function distressUrgency(ill) {
  const parts = [];
  // Distress column.
  parts.push(t(20, 40, 'DISTRESS', { size: 16, weight: 900, fill: P.red, ls: 2 }));
  parts.push(t(20, 56, 'grave and imminent danger, immediate help needed', { size: 9.5, fill: P.inkSoft }));
  parts.push(tag(20, 66, 270, 44, 'MAYDAY  MAYDAY  MAYDAY', { fill: P.red, size: 14 }));
  const dl = [
    ['THIS IS + call sign x 3', 700],
    ['Message: position, nature of distress, intentions', 500],
    ['Send on the frequency in use; if no reply, 121.5 MHz', 500],
    ['Later transmissions begin with MAYDAY once', 500],
    ['Relaying another station: MAYDAY RELAY x 3', 500],
    ['Acknowledging: ... RECEIVED MAYDAY', 500],
  ];
  dl.forEach(([s, w], i) => parts.push(t(24, 130 + i * 21, s, { size: 10.5, weight: w })));
  parts.push(tag(20, 258, 250, 40, ['SEELONCE MAYDAY', 'imposes radio silence'], { fill: P.ink, size: 11 }));
  parts.push(tag(20, 302, 250, 40, ['SEELONCE FEENEE', 'distress ended'], { fill: P.blue, size: 11 }));
  // Urgency column.
  parts.push(t(310, 40, 'URGENCY', { size: 16, weight: 900, fill: P.yellow, ls: 2 }));
  parts.push(t(310, 56, 'safety of an aircraft or person; no immediate help needed', { size: 9.5, fill: P.inkSoft }));
  parts.push(tag(310, 66, 270, 44, 'PAN PAN  PAN PAN  PAN PAN', { fill: P.yellow, fg: P.ink, size: 13 }));
  const ul = [
    ['Addressed to ALL STATIONS or one station', 700],
    ['Sent on the frequency in use', 500],
    ['Priority over everything except distress', 500],
    ['Stations hearing it keep listening at least 3 minutes', 500],
    ['Sent only on the authority of the person in charge', 500],
  ];
  ul.forEach(([s, w], i) => parts.push(t(314, 130 + i * 21, s, { size: 10.5, weight: w })));
  // Priority ladder.
  parts.push(rect(310, 250, 270, 92, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 4 }));
  parts.push(t(320, 266, 'PRIORITY OF COMMUNICATIONS', { size: 9.5, weight: 700, fill: P.inkSoft, ls: 1.5 }));
  ['1 Distress', '2 Urgency', '3 Direction finding', '4 Flight safety', '5 Meteorological', '6 Flight regularity'].forEach((s, i) =>
    parts.push(t(320 + (i >= 3 ? 135 : 0), 284 + (i % 3) * 18, s, { size: 10, weight: i < 2 ? 700 : 500, fill: i === 0 ? P.red : P.ink })),
  );
  parts.push(note(300, 362, 'Both signals are spoken three times. Knowingly sending a false distress signal is an offence.', { anchor: 'middle' }));
  return svg({ title: ill.title, h: 372 }, parts);
}
