// PSTAR drawings, part B: circuit, transponder, wake turbulence, blast,
// airspace, weather minima, cruising altitudes, wind, NOTAM, METAR/TAF,
// frequencies, traffic clock, readability.
import { P, svg, t, kicker, rect, line, pathD, circle, arrow, curve, dim, tag, plane, planeSide, cloud, vortex, hatch, note } from './lib.mjs';

export function circuitPattern(ill) {
  const parts = [kicker(20, 20, 'Standard left-hand circuit, 1,000 ft AAE')];
  // Runway (heading to the right).
  parts.push(rect(230, 268, 230, 22, { fill: P.inkSoft, stroke: P.inkSoft }));
  parts.push(line(250, 279, 440, 279, { stroke: P.card, sw: 2, dash: '8 8', cap: 'butt' }));
  // Circuit path: upwind -> crosswind -> downwind -> base -> final (counter-clockwise on screen).
  const path = 'M235 279 L505 279 Q515 279 515 269 L515 75 Q515 65 505 65 L110 65 Q100 65 100 75 L100 269 Q100 279 110 279 L228 279';
  parts.push(pathD(path, { stroke: P.blue, sw: 2.5 }));
  // Direction arrows along each leg.
  parts.push(arrow(380, 279, 400, 279, { stroke: P.blue, sw: 2.5 }));
  parts.push(arrow(515, 200, 515, 180, { stroke: P.blue, sw: 2.5 }));
  parts.push(arrow(320, 65, 300, 65, { stroke: P.blue, sw: 2.5 }));
  parts.push(arrow(100, 150, 100, 170, { stroke: P.blue, sw: 2.5 }));
  parts.push(arrow(170, 279, 190, 279, { stroke: P.blue, sw: 2.5 }));
  parts.push(plane(200, 65, -90, 0.8, P.blue));
  // Leg labels.
  parts.push(t(345, 258, 'UPWIND', { size: 11, weight: 700, anchor: 'middle', fill: P.blue, ls: 1.5 }));
  parts.push(`<g transform="translate(533 170) rotate(90)">${t(0, 0, 'CROSSWIND', { size: 11, weight: 700, anchor: 'middle', fill: P.blue, ls: 1.5 })}</g>`);
  parts.push(t(300, 50, 'DOWNWIND', { size: 12, weight: 700, anchor: 'middle', fill: P.blue, ls: 1.5 }));
  parts.push(t(300, 88, '1,000 ft AAE, parallel to the runway', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  parts.push(`<g transform="translate(84 170) rotate(-90)">${t(0, 0, 'BASE', { size: 11, weight: 700, anchor: 'middle', fill: P.blue, ls: 1.5 })}</g>`);
  parts.push(t(165, 300, 'FINAL', { size: 11, weight: 700, anchor: 'middle', fill: P.blue, ls: 1.5 }));
  // Joins after "cleared to the circuit".
  parts.push(curve(400, 345, 400, 90, 362, 65, { stroke: P.red, sw: 2, dash: '5 5' }));
  parts.push(t(410, 318, 'cross mid-field at', { size: 9.5, fill: P.red, weight: 700 }));
  parts.push(t(410, 330, 'circuit height, partial', { size: 9.5, fill: P.red }));
  parts.push(t(410, 342, 'right turn onto downwind', { size: 9.5, fill: P.red }));
  parts.push(curve(590, 340, 560, 300, 522, 250, { stroke: P.red, sw: 2, dash: '5 5' }));
  parts.push(t(585, 325, 'or turn right to', { size: 9.5, fill: P.red, weight: 700, anchor: 'end' }));
  parts.push(t(585, 337, 'join crosswind', { size: 9.5, fill: P.red, anchor: 'end' }));
  parts.push(t(20, 330, 'Cleared to the circuit = join the', { size: 10.5, weight: 700 }));
  parts.push(t(20, 343, 'downwind leg at circuit height.', { size: 10.5, weight: 700 }));
  parts.push(t(20, 356, 'All other turns are to the left.', { size: 10, fill: P.inkSoft }));
  return svg({ title: ill.title }, parts);
}

export function circuitHeightCeiling(ill) {
  // Scale: ground (400 ASL) at y=300, 0.21 px per foot.
  const yOf = (asl) => 300 - (asl - 400) * 0.21;
  const parts = [
    hatch('cloudHatch', P.lineStrong, 6),
    kicker(20, 20, 'Low ceiling vs. NOTAM circuit height'),
    // Ground and airport.
    line(20, 300, 580, 300, { stroke: P.ink, sw: 2 }),
    rect(200, 294, 200, 6, { fill: P.inkSoft, stroke: P.inkSoft }),
    t(300, 322, 'Airport elevation 400 ft ASL', { size: 11, weight: 700, anchor: 'middle' }),
    // Cloud layer: base 1,000 AGL = 1,400 ASL.
    rect(20, 36, 420, yOf(1400) - 36, { fill: 'url(#cloudHatch)', stroke: P.lineStrong, sw: 1 }),
    cloud(230, yOf(1400) - 2, 190, { fill: P.card }),
    t(28, 52, 'OVERCAST', { size: 11, weight: 900 }),
    t(28, 65, 'base 1,000 ft AGL = 1,400 ft ASL', { size: 10, weight: 700 }),
    // NOTAM circuit height (in cloud).
    line(20, yOf(1500), 440, yOf(1500), { stroke: P.red, sw: 1.5, dash: '6 5' }),
    t(448, yOf(1500) - 2, 'NOTAM circuit 1,500 ft ASL', { size: 9.5, weight: 700, fill: P.red }),
    t(448, yOf(1500) + 10, 'is in cloud: unusable', { size: 9.5, fill: P.red }),
    // Flown circuit: 500 below base = 900 ASL.
    line(20, yOf(900), 440, yOf(900), { stroke: P.blue, sw: 2.5 }),
    planeSide(400, yOf(900) - 2, 1.1, P.blue, true),
    t(30, yOf(900) - 8, 'Fly the circuit 500 ft below the base: 900 ft ASL (500 ft above the airport)', { size: 10, weight: 700, fill: P.blue }),
    // Dimensions on the right scale.
    dim(500, yOf(1400), 500, yOf(900), '500 ft', { stroke: P.blue, fill: P.blue, offset: 22 }),
    dim(548, yOf(1400), 548, 300, '', { stroke: P.inkSoft }),
    t(556, (yOf(1400) + 300) / 2, '1,000 ft', { size: 11, weight: 700, fill: P.inkSoft }),
    t(556, (yOf(1400) + 300) / 2 + 13, 'ceiling', { size: 9, fill: P.inkSoft }),
    note(300, 352, 'Controlled airspace VFR: 500 ft vertically from cloud, visibility 3 miles (CARs 602.114).', { anchor: 'middle' }),
  ];
  return svg({ title: ill.title }, parts);
}

export function transponderCodes(ill) {
  const parts = [kicker(20, 20, 'VFR transponder codes')];
  // Altitude column.
  parts.push(rect(60, 40, 220, 110, { fill: P.paperDeep, stroke: P.line, sw: 1 }));
  parts.push(rect(60, 150, 220, 170, { fill: P.card, stroke: P.line, sw: 1 }));
  parts.push(line(60, 150, 280, 150, { stroke: P.ink, sw: 2 }));
  parts.push(t(290, 154, '12,500 ft ASL', { size: 12, weight: 700 }));
  parts.push(t(170, 85, '1400', { size: 40, weight: 900, anchor: 'middle', fill: P.blue }));
  parts.push(t(170, 108, 'above 12,500 ft ASL', { size: 11, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(170, 225, '1200', { size: 40, weight: 900, anchor: 'middle', fill: P.red }));
  parts.push(t(170, 248, 'at or below 12,500 ft ASL', { size: 11, anchor: 'middle', fill: P.inkSoft }));
  parts.push(line(20, 320, 580, 320, { stroke: P.ink, sw: 2 }));
  parts.push(t(170, 338, 'surface', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  parts.push(plane(258, 70, 0, 0.6, P.blue));
  parts.push(plane(258, 300, 0, 0.6, P.red));
  // Transponder face.
  parts.push(rect(340, 180, 240, 90, { fill: P.ink, stroke: P.ink, r: 6 }));
  parts.push(rect(356, 198, 110, 40, { fill: P.paperDeep, stroke: P.lineStrong, r: 3 }));
  parts.push(t(411, 227, '1200', { size: 26, weight: 900, anchor: 'middle', fill: P.ink }));
  parts.push(circle(500, 218, 14, { fill: P.yellow, stroke: P.yellow }));
  parts.push(t(500, 250, 'IDENT', { size: 9, weight: 700, anchor: 'middle', fill: P.card, ls: 1.5 }));
  parts.push(t(545, 213, 'ALT', { size: 10, weight: 700, anchor: 'middle', fill: P.card }));
  parts.push(t(545, 226, 'mode C', { size: 8, anchor: 'middle', fill: P.line }));
  parts.push(t(460, 290, 'Press IDENT only when ATC asks', { size: 11, weight: 700, anchor: 'middle' }));
  parts.push(t(460, 305, 'ATC may assign a discrete code instead', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(460, 60, 'Unless ATC instructs otherwise:', { size: 12, weight: 700, anchor: 'middle' }));
  parts.push(t(460, 80, 'code 1200 at or below 12,500 ft ASL,', { size: 11, anchor: 'middle' }));
  parts.push(t(460, 96, 'code 1400 above 12,500 ft ASL.', { size: 11, anchor: 'middle' }));
  parts.push(note(300, 352, 'TC AIM COM: VFR operations. Transponders are required in Class A, B and C airspace.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function wakeTurbulence(ill) {
  const parts = [kicker(20, 20, 'Landing behind a heavy aeroplane')];
  // Landing panel: ground at y=150.
  parts.push(line(20, 150, 580, 150, { stroke: P.ink, sw: 2 }));
  parts.push(rect(200, 144, 370, 6, { fill: P.inkSoft, stroke: P.inkSoft }));
  // Heavy's path and touchdown.
  parts.push(line(60, 48, 270, 148, { stroke: P.red, sw: 1.5, dash: '5 5' }));
  parts.push(planeSide(120, 76, 1.6, P.red, false, 18));
  for (let k = 0; k < 4; k++) parts.push(vortex(95 + k * 40, 70 + k * 26 + 6, 2, 5, P.red));
  parts.push(circle(270, 148, 4, { fill: P.red, stroke: P.red }));
  parts.push(t(270, 170, "heavy's touchdown", { size: 10, weight: 700, anchor: 'middle', fill: P.red }));
  parts.push(t(270, 182, 'vortices stop here', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  // Light aircraft: above the heavy's path, touching down beyond.
  parts.push(line(60, 28, 430, 148, { stroke: P.blue, sw: 2 }));
  parts.push(planeSide(300, 104, 1.0, P.blue, false, 18));
  parts.push(circle(430, 148, 4, { fill: P.blue, stroke: P.blue }));
  parts.push(t(430, 170, 'land beyond it', { size: 10, weight: 700, anchor: 'middle', fill: P.blue }));
  parts.push(t(430, 182, 'stay at or above its approach path', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(440, 48, 'vortices sink and drift downwind;', { size: 10, fill: P.inkSoft }));
  parts.push(t(440, 60, 'a light crosswind can hold one', { size: 10, fill: P.inkSoft }));
  parts.push(t(440, 72, 'over the runway', { size: 10, fill: P.inkSoft }));
  // Departure panel: ground at y=330.
  parts.push(kicker(20, 212, 'Departing behind a heavy aeroplane'));
  parts.push(line(20, 330, 580, 330, { stroke: P.ink, sw: 2 }));
  parts.push(rect(30, 324, 380, 6, { fill: P.inkSoft, stroke: P.inkSoft }));
  parts.push(circle(300, 328, 4, { fill: P.red, stroke: P.red }));
  parts.push(line(300, 328, 560, 236, { stroke: P.red, sw: 1.5, dash: '5 5' }));
  parts.push(planeSide(470, 268, 1.6, P.red, false, -18));
  for (let k = 0; k < 4; k++) parts.push(vortex(330 + k * 36, 318 - k * 13, 2, 5, P.red));
  parts.push(t(300, 346, "heavy's rotation point: vortices begin", { size: 10, weight: 700, anchor: 'middle', fill: P.red }));
  parts.push(circle(160, 328, 4, { fill: P.blue, stroke: P.blue }));
  parts.push(line(160, 328, 560, 214, { stroke: P.blue, sw: 2 }));
  parts.push(planeSide(330, 280, 1.0, P.blue, false, -15));
  parts.push(t(160, 346, 'rotate before it', { size: 10, weight: 700, anchor: 'middle', fill: P.blue }));
  parts.push(t(560, 206, 'climb above and upwind of its path', { size: 10, weight: 700, anchor: 'end', fill: P.blue }));
  parts.push(t(60, 232, 'Strongest: heavy, clean, slow.', { size: 11, weight: 700 }));
  parts.push(t(60, 246, 'Persist 5 min or more in still air.', { size: 10.5, fill: P.inkSoft }));
  return svg({ title: ill.title }, parts);
}

export function blastDanger(ill) {
  const x0 = 170; // tail position
  const px = 400 / 1200; // 1,200 ft = 400 px
  const rows = [
    ['Executive jet', 'ground idle', 200, P.inkSoft],
    ['Medium jet', 'ground idle', 450, P.inkSoft],
    ['Jumbo jet', 'ground idle', 600, P.inkSoft],
    ['Medium jet', 'take-off thrust', 1200, P.red],
  ];
  const parts = [kicker(20, 20, 'Blast danger areas behind the tail')];
  rows.forEach(([name, mode, ft, color], i) => {
    const y = 48 + i * 52;
    parts.push(planeSide(x0 - 30, y + 18, 1.1 + (ft === 600 ? 0.5 : ft === 200 ? -0.2 : 0.2), P.ink, true));
    parts.push(rect(x0, y + 10, ft * px, 16, { fill: color, stroke: color, r: 2 }));
    parts.push(ft >= 1000 ? t(x0 + ft * px - 8, y + 23, `${ft.toLocaleString('en-CA')} ft`, { size: 13, weight: 900, fill: P.card, anchor: 'end' }) : t(x0 + ft * px + 8, y + 23, `${ft.toLocaleString('en-CA')} ft`, { size: 13, weight: 900, fill: P.ink }));
    parts.push(t(20, y + 16, name, { size: 11.5, weight: 700 }));
    parts.push(t(20, y + 29, mode, { size: 10, fill: P.inkSoft }));
  });
  // Turboprop row.
  const y = 48 + rows.length * 52 + 6;
  parts.push(planeSide(x0 - 30, y + 18, 1.2, P.ink, true));
  parts.push(rect(x0, y + 10, 60 * px * 3, 16, { fill: P.yellow, stroke: P.yellow, r: 2 }));
  parts.push(t(x0 + 60 * px * 3 + 8, y + 23, '60 ft: 45 kt blast', { size: 13, weight: 900 }));
  parts.push(t(20, y + 16, 'Large turboprop', { size: 11.5, weight: 700 }));
  parts.push(t(20, y + 29, 'taxiing (behind the props)', { size: 10, fill: P.inkSoft }));
  parts.push(t(x0, y + 48, 'turboprop bar drawn at 3x scale', { size: 8.5, fill: P.inkSoft }));
  // Scale ruler.
  const ry = 320;
  parts.push(line(x0, ry, x0 + 400, ry, { stroke: P.ink, sw: 1.5 }));
  [0, 300, 600, 900, 1200].forEach((ft) => {
    parts.push(line(x0 + ft * px, ry - 4, x0 + ft * px, ry + 4, { stroke: P.ink, sw: 1.5 }));
    parts.push(t(x0 + ft * px, ry + 18, ft.toLocaleString('en-CA'), { size: 10, anchor: 'middle', fill: P.inkSoft }));
  });
  parts.push(t(x0 + 400 + 10, ry + 4, 'ft', { size: 10, fill: P.inkSoft }));
  parts.push(note(300, 352, 'TC AIM AIR: jet and propeller blast danger. Hold well outside these distances.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function airspaceClasses(ill) {
  const parts = [hatch('fHatch', P.red, 6), kicker(20, 14, 'Canadian airspace, vertical cross-section (not to scale)')];
  // Ground.
  parts.push(line(20, 320, 580, 320, { stroke: P.ink, sw: 2 }));
  // Class A.
  parts.push(rect(40, 20, 420, 60, { fill: P.blue, stroke: P.blue, r: 2 }));
  parts.push(t(52, 44, 'CLASS A', { size: 15, weight: 900, fill: P.card, ls: 1 }));
  parts.push(t(52, 62, 'High level controlled airspace, 18,000 ft ASL to FL 600. IFR only.', { size: 10.5, fill: P.card }));
  // Class B.
  parts.push(rect(40, 92, 420, 52, { fill: P.paperDeep, stroke: P.blue, sw: 1.5, r: 2 }));
  parts.push(t(52, 112, 'CLASS B', { size: 15, weight: 900, fill: P.blue, ls: 1 }));
  parts.push(t(52, 130, 'Low level controlled airspace, 12,500 ft ASL (or MEA) up to 18,000 ft. VFR only with an ATC clearance.', { size: 10, fill: P.ink }));
  // Class E airway.
  parts.push(rect(60, 180, 180, 60, { fill: P.card, stroke: P.blue, sw: 1.5, dash: '5 4', r: 2 }));
  parts.push(t(70, 200, 'CLASS E', { size: 13, weight: 900, fill: P.blue, ls: 1 }));
  parts.push(t(70, 216, 'low level airway, base 2,200 ft AGL', { size: 9.5 }));
  parts.push(t(70, 230, 'no clearance needed for VFR', { size: 9.5, fill: P.inkSoft }));
  // Class C TCA (inverted wedding cake) and control zone.
  parts.push(pathD('M280 190 L520 190 L520 230 L480 230 L480 270 L440 270 L440 320 L360 320 L360 270 L320 270 L320 230 L280 230 Z', { fill: P.paperDeep, stroke: P.blue, sw: 1.5 }));
  parts.push(t(400, 210, 'CLASS C terminal control area', { size: 11, weight: 900, fill: P.blue, anchor: 'middle' }));
  parts.push(t(400, 224, 'clearance required to enter', { size: 9.5, anchor: 'middle' }));
  parts.push(rect(360, 262, 80, 58, { fill: P.card, stroke: P.blue, sw: 1.5 }));
  parts.push(t(400, 284, 'CONTROL', { size: 9, weight: 900, fill: P.blue, anchor: 'middle', ls: 1 }));
  parts.push(t(400, 296, 'ZONE', { size: 9, weight: 900, fill: P.blue, anchor: 'middle', ls: 1 }));
  parts.push(t(400, 310, 'C or D, to 3,000 AAE', { size: 8.5, anchor: 'middle', fill: P.inkSoft }));
  parts.push(rect(392, 314, 16, 6, { fill: P.ink, stroke: P.ink }));
  // Class F.
  parts.push(rect(60, 262, 70, 58, { fill: 'url(#fHatch)', stroke: P.red, sw: 1.5 }));
  parts.push(t(95, 285, 'CLASS F', { size: 11, weight: 900, fill: P.red, anchor: 'middle' }));
  parts.push(t(95, 299, 'CYR restricted', { size: 8.5, anchor: 'middle', fill: P.red }));
  parts.push(t(95, 311, 'CYA advisory', { size: 8.5, anchor: 'middle', fill: P.red }));
  // Class G.
  parts.push(t(210, 300, 'CLASS G', { size: 13, weight: 900, fill: P.inkSoft, anchor: 'middle' }));
  parts.push(t(210, 313, 'uncontrolled', { size: 9.5, fill: P.inkSoft, anchor: 'middle' }));
  parts.push(t(150, 165, 'CLASS G uncontrolled', { size: 10, weight: 700, fill: P.inkSoft, anchor: 'middle' }));
  // Altitude scale on the right.
  const scale = [
    [20, 'FL 600'],
    [86, '18,000 ft ASL'],
    [144, '12,500 ft ASL'],
    [320, 'surface'],
  ];
  scale.forEach(([y, label]) => {
    parts.push(line(470, y, 480, y, { stroke: P.ink, sw: 1.5 }));
    parts.push(t(486, y + 4, label, { size: 10, weight: 700 }));
  });
  parts.push(line(470, 20, 470, 320, { stroke: P.line, sw: 1 }));
  parts.push(line(40, 86, 460, 86, { stroke: P.ink, sw: 1.5, dash: '3 4' }));
  parts.push(dim(560, 88, 560, 318, '', { stroke: P.inkSoft }));
  parts.push(`<g transform="translate(575 203) rotate(-90)">${t(0, 0, 'LOW LEVEL AIRSPACE', { size: 9, weight: 700, anchor: 'middle', fill: P.inkSoft, ls: 1 })}</g>`);
  parts.push(`<g transform="translate(575 50) rotate(-90)">${t(0, 0, 'HIGH LEVEL', { size: 9, weight: 700, anchor: 'middle', fill: P.inkSoft, ls: 1 })}</g>`);
  parts.push(note(300, 346, 'Controlled airspace: airspace within which an ATC service is provided. Class D needs two-way radio contact before entry.', { anchor: 'middle', size: 10 }));
  return svg({ title: ill.title }, parts);
}

export function controlZoneTca(ill) {
  const parts = [kicker(20, 20, 'Control zone under a terminal control area (side view)')];
  parts.push(line(20, 300, 580, 300, { stroke: P.ink, sw: 2 }));
  // TCA steps.
  parts.push(rect(110, 60, 380, 60, { fill: P.paperDeep, stroke: P.blue, sw: 1.5, dash: '6 4' }));
  parts.push(rect(170, 120, 260, 60, { fill: P.paperDeep, stroke: P.blue, sw: 1.5, dash: '6 4' }));
  parts.push(t(300, 84, 'CLASS C TERMINAL CONTROL AREA', { size: 11, weight: 900, anchor: 'middle', fill: P.blue, ls: 1 }));
  parts.push(t(300, 100, 'clearance required; establish and maintain two-way radio contact', { size: 9.5, anchor: 'middle' }));
  parts.push(t(300, 140, 'inverted wedding cake: wider as you go up', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  // Control zone.
  parts.push(rect(230, 180, 140, 120, { fill: P.card, stroke: P.blue, sw: 2.5 }));
  parts.push(t(300, 205, 'CONTROL ZONE', { size: 12, weight: 900, anchor: 'middle', fill: P.blue, ls: 1 }));
  parts.push(t(300, 222, 'surface to 3,000 ft AAE', { size: 10.5, anchor: 'middle' }));
  parts.push(t(300, 238, 'normally 5 NM radius', { size: 10.5, anchor: 'middle' }));
  parts.push(t(300, 258, 'Special VFR only exists here', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  parts.push(rect(285, 292, 30, 8, { fill: P.ink, stroke: P.ink }));
  parts.push(t(300, 318, 'tower', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  parts.push(dim(230, 170, 300, 170, '5 NM', { stroke: P.inkSoft, offset: 8 }));
  parts.push(dim(385, 180, 385, 300, '3,000 ft', { stroke: P.inkSoft, offset: 24 }));
  // Arriving VFR aircraft.
  parts.push(planeSide(70, 236, 1.2, P.red));
  parts.push(arrow(100, 236, 200, 236, { stroke: P.red, sw: 2, dash: '5 5' }));
  parts.push(t(20, 262, 'Call the tower BEFORE', { size: 10.5, weight: 700, fill: P.red }));
  parts.push(t(20, 276, 'entering the control zone', { size: 10.5, weight: 700, fill: P.red }));
  parts.push(t(20, 290, 'with ATIS, position, altitude, intentions', { size: 9, fill: P.inkSoft }));
  // Transit note.
  parts.push(t(440, 236, 'Crossing a Class C zone?', { size: 10.5, weight: 700 }));
  parts.push(t(440, 250, 'Advise ATC of your intentions', { size: 10, fill: P.inkSoft }));
  parts.push(t(440, 263, 'and obtain a clearance.', { size: 10, fill: P.inkSoft }));
  parts.push(note(300, 346, 'CARs 101.01 and 601.08; TC AIM RAC: control zones, Class C airspace, arrival procedures.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function vfrWeatherMinima(ill) {
  const rows = [
    ['Controlled airspace', 'incl. low level airways', '3 mi', '500 ft vert.', '1 mi horiz.'],
    ['Control zone', 'ground vis 3 mi if reported; not below 500 ft AGL', '3 mi', '500 ft vert.', '1 mi horiz.'],
    ['Uncontrolled, 1,000 ft AGL or above', 'night: 3 mi', '1 mi day', '500 ft vert.', '2,000 ft horiz.'],
    ['Uncontrolled, below 1,000 ft AGL', 'helicopter: 1 mi', '2 mi day', 'clear of cloud', ''],
    ['Special VFR in a control zone', 'ATC authorization; helicopter: 1/2 mi', '1 mi', 'clear of cloud', ''],
  ];
  const parts = [kicker(20, 20, 'VFR weather minima (CARs 602.114, 602.115, 602.117)')];
  parts.push(rect(20, 32, 400, 22, { fill: P.ink, stroke: P.ink, r: 3 }));
  parts.push(t(28, 47, 'AIRSPACE', { size: 9.5, weight: 700, fill: P.card, ls: 1.5 }));
  parts.push(t(262, 47, 'FLIGHT VIS', { size: 9.5, weight: 700, fill: P.card, ls: 1.5, anchor: 'middle' }));
  parts.push(t(360, 47, 'FROM CLOUD', { size: 9.5, weight: 700, fill: P.card, ls: 1.5, anchor: 'middle' }));
  rows.forEach(([name, sub, vis, v1, v2], i) => {
    const y = 58 + i * 58;
    parts.push(rect(20, y, 400, 54, { fill: i % 2 ? P.card : P.paperDeep, stroke: P.line, sw: 1, r: 3 }));
    parts.push(t(28, y + 22, name, { size: 11.5, weight: 700 }));
    parts.push(t(28, y + 38, sub, { size: 9, fill: P.inkSoft }));
    parts.push(t(262, y + 33, vis, { size: 16, weight: 900, anchor: 'middle', fill: P.blue }));
    parts.push(t(360, y + (v2 ? 26 : 33), v1, { size: 11, weight: 700, anchor: 'middle' }));
    if (v2) parts.push(t(360, y + 42, v2, { size: 11, weight: 700, anchor: 'middle' }));
  });
  // Cloud clearance sketch.
  parts.push(kicker(436, 70, 'Distance from cloud'));
  parts.push(cloud(450, 150, 130, { fill: P.card }));
  parts.push(plane(515, 232, 0, 0.9, P.blue));
  parts.push(dim(462, 152, 462, 222, '500 ft', { stroke: P.blue, fill: P.blue, offset: -22 }));
  parts.push(t(515, 262, 'below the cloud', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(436, 290, 'Beside the cloud:', { size: 10, weight: 700 }));
  parts.push(t(436, 305, '1 mi in controlled airspace', { size: 9.5, fill: P.blue, weight: 700 }));
  parts.push(t(436, 319, '2,000 ft in uncontrolled', { size: 9.5, fill: P.blue, weight: 700 }));
  parts.push(t(436, 333, 'airspace at 1,000 ft AGL or above', { size: 9.5, fill: P.inkSoft }));
  parts.push(note(300, 388, 'Below 1,000 ft AGL and in Special VFR, the only cloud rule is: stay clear of it.', { anchor: 'middle' }));
  return svg({ title: ill.title, h: 400 }, parts);
}

export function cruisingAltitudes(ill) {
  const cx = 180;
  const cy = 180;
  const r = 128;
  const parts = [kicker(20, 20, 'Cruising altitudes above 3,000 ft AGL (VFR)')];
  // Halves of the rose.
  parts.push(pathD(`M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} Z`, { fill: P.paperDeep, stroke: P.ink, sw: 2 }));
  parts.push(pathD(`M${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx} ${cy + r} Z`, { fill: P.card, stroke: P.ink, sw: 2 }));
  parts.push(line(cx, cy - r, cx, cy + r, { stroke: P.ink, sw: 2 }));
  // Cardinal ticks.
  [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([l, deg]) => {
    const a = (deg * Math.PI) / 180;
    parts.push(t(cx + Math.sin(a) * (r + 16), cy - Math.cos(a) * (r + 16) + 4, l, { size: 12, weight: 900, anchor: 'middle' }));
  });
  for (let deg = 0; deg < 360; deg += 30) {
    const a = (deg * Math.PI) / 180;
    parts.push(line(cx + Math.sin(a) * (r - 8), cy - Math.cos(a) * (r - 8), cx + Math.sin(a) * r, cy - Math.cos(a) * r, { stroke: P.ink, sw: 1.5 }));
  }
  // East half: 000-179.
  parts.push(t(cx + 66, cy - 40, '000 to 179', { size: 11, weight: 700, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(cx + 66, cy - 18, 'ODD', { size: 20, weight: 900, anchor: 'middle', fill: P.blue }));
  parts.push(t(cx + 66, cy + 2, '+ 500', { size: 14, weight: 900, anchor: 'middle', fill: P.blue }));
  parts.push(t(cx + 66, cy + 24, '3,500  5,500', { size: 10, anchor: 'middle' }));
  parts.push(t(cx + 66, cy + 38, '7,500  9,500', { size: 10, anchor: 'middle' }));
  // West half: 180-359.
  parts.push(t(cx - 66, cy - 40, '180 to 359', { size: 11, weight: 700, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(cx - 66, cy - 18, 'EVEN', { size: 20, weight: 900, anchor: 'middle', fill: P.red }));
  parts.push(t(cx - 66, cy + 2, '+ 500', { size: 14, weight: 900, anchor: 'middle', fill: P.red }));
  parts.push(t(cx - 66, cy + 24, '4,500  6,500', { size: 10, anchor: 'middle' }));
  parts.push(t(cx - 66, cy + 38, '8,500  10,500', { size: 10, anchor: 'middle' }));
  parts.push(t(cx, 338, 'by MAGNETIC track in the Southern Domestic Airspace (true track in the north)', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  // Altimeter regions.
  parts.push(kicker(350, 52, 'Altimeter setting'));
  parts.push(rect(350, 60, 230, 90, { fill: P.paperDeep, stroke: P.line, sw: 1 }));
  parts.push(rect(350, 150, 230, 130, { fill: P.card, stroke: P.line, sw: 1 }));
  parts.push(line(350, 150, 580, 150, { stroke: P.ink, sw: 2 }));
  parts.push(t(465, 85, 'STANDARD PRESSURE REGION', { size: 10, weight: 900, anchor: 'middle', fill: P.blue, ls: 1 }));
  parts.push(t(465, 110, '29.92', { size: 24, weight: 900, anchor: 'middle' }));
  parts.push(t(465, 130, 'at and above 18,000 ft ASL', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(465, 165, '18,000 ft ASL', { size: 10, weight: 700, anchor: 'middle' }));
  parts.push(t(465, 195, 'ALTIMETER SETTING REGION', { size: 10, weight: 900, anchor: 'middle', fill: P.red, ls: 1 }));
  parts.push(t(465, 222, 'current setting of the', { size: 11, anchor: 'middle' }));
  parts.push(t(465, 238, 'nearest station', { size: 11, anchor: 'middle' }));
  parts.push(t(465, 262, 'reset en route as you pass stations', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  parts.push(line(350, 280, 580, 280, { stroke: P.ink, sw: 2 }));
  parts.push(t(465, 296, 'surface', { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  parts.push(note(300, 356, 'CARs 602.34: the rule applies in level cruising flight more than 3,000 ft above ground.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function windComponents(ill) {
  const parts = [kicker(20, 20, 'Wind 300 degrees at 20 kt, landing runway 27 (30 degrees off)')];
  // Runway 27, aircraft landing westward (to the left).
  parts.push(rect(60, 190, 360, 36, { fill: P.inkSoft, stroke: P.inkSoft }));
  parts.push(line(80, 208, 400, 208, { stroke: P.card, sw: 2, dash: '10 10', cap: 'butt' }));
  parts.push(`<g transform="translate(395 208) rotate(-90)">${t(0, 6, '27', { size: 18, weight: 900, anchor: 'middle', fill: P.card })}</g>`);
  parts.push(plane(300, 208, -90, 0.8, P.card));
  parts.push(t(240, 246, 'runway heading 270', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  // Wind triangle (10 px per knot). Wind from 300 blows toward 120.
  const ox = 150;
  const oy = 50;
  const wx = ox + 173;
  const wy = oy + 100;
  parts.push(arrow(ox, oy, wx, wy, { stroke: P.ink, sw: 3, size: 12 }));
  parts.push(`<g transform="translate(${ox + 60} ${oy + 56}) rotate(30)">${t(0, 0, 'WIND 300 / 20 kt', { size: 12, weight: 900 })}</g>`);
  parts.push(arrow(ox, oy, wx, oy, { stroke: P.blue, sw: 2.5, dash: '6 4' }));
  parts.push(t((ox + wx) / 2, oy - 8, 'headwind 17 kt (20 x cos 30)', { size: 10.5, weight: 700, anchor: 'middle', fill: P.blue }));
  parts.push(arrow(wx, oy, wx, wy, { stroke: P.red, sw: 2.5, dash: '6 4' }));
  parts.push(t(wx + 8, (oy + wy) / 2 + 4, 'crosswind 10 kt', { size: 10.5, weight: 700, fill: P.red }));
  parts.push(t(wx + 8, (oy + wy) / 2 + 17, '20 x sin 30', { size: 9.5, fill: P.inkSoft }));
  parts.push(t(wx + 8, (oy + wy) / 2 + 29, 'from the right', { size: 9.5, fill: P.inkSoft }));
  parts.push(pathD(`M${ox + 40} ${oy} A40 40 0 0 1 ${ox + 34.6} ${oy + 20}`, { stroke: P.inkSoft, sw: 1 }));
  parts.push(t(ox + 50, oy + 24, '30°', { size: 10, fill: P.inkSoft }));
  // Rules of thumb.
  parts.push(kicker(440, 60, 'Rule of thumb'));
  const rules = [['30°', '1/2'], ['45°', '0.7'], ['60°', '0.9'], ['90°', 'all']];
  rules.forEach(([a, f], i) => {
    const y = 72 + i * 30;
    parts.push(rect(440, y, 140, 26, { fill: i % 2 ? P.card : P.paperDeep, stroke: P.line, sw: 1, r: 3 }));
    parts.push(t(452, y + 18, a + ' off', { size: 11.5, weight: 700 }));
    parts.push(t(568, y + 18, f + ' of wind', { size: 11.5, weight: 700, anchor: 'end', fill: P.red }));
  });
  parts.push(t(510, 210, 'is crosswind', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  parts.push(t(300, 290, 'Crosswind beyond your limit? Overshoot and request an into-wind runway.', { size: 11.5, weight: 700, anchor: 'middle' }));
  parts.push(note(300, 350, 'crosswind = wind speed x sine of the angle between wind and runway; headwind uses the cosine.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function notamDecoding(ill) {
  const mono = (x, y, s, o = {}) => t(x, y, s, { size: 12.5, weight: 700, ...o });
  const parts = [kicker(20, 20, 'Reading a NOTAM')];
  parts.push(rect(24, 34, 340, 196, { fill: P.card, stroke: P.lineStrong, sw: 1.5, r: 4 }));
  parts.push(mono(40, 62, 'V1234/25  NOTAMN'));
  parts.push(mono(40, 92, 'Q) CZYZ/QMRLC/IV/NBO/A/000/999/'));
  parts.push(mono(40, 108, '   4302N08109W005', { fill: P.inkSoft }));
  parts.push(mono(40, 138, 'A) CYXU'));
  parts.push(mono(40, 164, 'B) 2511131400'));
  parts.push(mono(40, 190, 'C) 2511152200 EST', { fill: P.red }));
  parts.push(mono(40, 216, 'E) RWY 09/27 CLSD'));
  // Callouts.
  const call = (x1, y1, x2, y2, lines, color = P.ink) => [
    line(x1, y1, x2, y2, { stroke: P.lineStrong, sw: 1 }),
    circle(x1, y1, 2.5, { fill: P.lineStrong, stroke: P.lineStrong }),
    ...lines.map((l, i) => t(x2 + 6, y2 + 4 + i * 13, l, { size: i === 0 ? 11 : 10, weight: i === 0 ? 700 : 500, fill: i === 0 ? color : P.inkSoft })),
  ].join('');
  parts.push(call(190, 58, 380, 50, ['Type: N new, R replacing, C cancelling', 'NOTAMR replaces an earlier NOTAM']));
  parts.push(call(100, 134, 380, 110, ['A) Location', 'aerodrome or FIR affected']));
  parts.push(call(150, 160, 380, 150, ['B) Start, UTC', 'year month day hour minute']));
  parts.push(call(205, 186, 380, 190, ['C) End, UTC', 'without EST: expires at this time'], P.red));
  parts.push(call(160, 212, 380, 222, ['E) Plain text', 'runway 09/27 closed']));
  parts.push(rect(24, 256, 556, 60, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 4 }));
  parts.push(t(36, 278, 'EST = estimated end time.', { size: 12, weight: 900, fill: P.red }));
  parts.push(t(36, 295, 'The NOTAM stays valid until a replacing (NOTAMR) or cancelling (NOTAMC) NOTAM is issued.', { size: 10.5 }));
  parts.push(t(36, 309, 'PERM = permanent change, to be published in the AIP Canada supplements and CFS.', { size: 10.5, fill: P.inkSoft }));
  parts.push(note(300, 346, 'NOTAMs are available from every Flight Information Centre (FIC) and the NAV CANADA NOTAM service.', { anchor: 'middle', size: 10 }));
  return svg({ title: ill.title }, parts);
}

export function metarTafDecoding(ill) {
  const strip = (y, tokens, color) => {
    const parts = [];
    let x = 24;
    tokens.forEach(([tok, label, sub]) => {
      const w = Math.max(tok.length * 8.2 + 12, label.length * 5.2 + 8);
      parts.push(rect(x, y, w, 26, { fill: P.card, stroke: color, sw: 1.5, r: 3 }));
      parts.push(t(x + w / 2, y + 18, tok, { size: 13, weight: 900, anchor: 'middle', fill: color }));
      parts.push(t(x + w / 2, y + 40, label, { size: 9, weight: 700, anchor: 'middle' }));
      if (sub) parts.push(t(x + w / 2, y + 51, sub, { size: 8.5, anchor: 'middle', fill: P.inkSoft }));
      x += w + 6;
    });
    return parts;
  };
  const parts = [kicker(20, 20, 'METAR: observed weather')];
  parts.push(...strip(30, [
    ['METAR', 'report type', ''],
    ['CYOW', 'station', 'Ottawa'],
    ['131800Z', 'day + time', '13th, 1800 UTC'],
    ['27012G18KT', 'wind', '270 at 12, gusts 18 kt'],
    ['15SM', 'visibility', 'statute miles'],
  ], P.blue));
  parts.push(...strip(96, [
    ['FEW040', 'few cloud', '4,000 ft AGL'],
    ['OVC010', 'overcast = ceiling', '1,000 ft AGL'],
    ['22/10', 'temp / dew point', 'degrees C'],
    ['A2992', 'altimeter', '29.92 in Hg'],
    ['RMK SLP131', 'remarks', 'sea level pressure'],
  ], P.blue));
  parts.push(kicker(20, 182, 'TAF: forecast'));
  parts.push(...strip(192, [
    ['TAF', 'forecast', ''],
    ['CYOW', 'station', ''],
    ['131740Z', 'issued', '13th 1740 UTC'],
    ['1318/1418', 'valid period', '13th 18Z to 14th 18Z'],
    ['27012KT', 'wind', ''],
    ['P6SM', 'visibility', 'more than 6 SM'],
    ['BKN040', 'broken', '4,000 ft'],
  ], P.red));
  parts.push(...strip(258, [
    ['TEMPO 1320/1323', 'temporary change', 'between 20Z and 23Z'],
    ['3SM -SHRA OVC015', 'in those periods', 'light rain showers, ceiling 1,500'],
    ['FM140200', 'from', '14th at 0200 UTC onward'],
    ['32008KT P6SM SCT030', 'new prevailing weather', ''],
  ], P.red));
  parts.push(t(24, 336, 'Cloud heights are hundreds of feet AGL; the lowest BKN or OVC layer is the ceiling.', { size: 10 }));
  parts.push(t(24, 350, 'Wind is true direction in degrees and speed in knots; G marks gusts.', { size: 10 }));
  parts.push(note(24, 364, 'OVC010 with 3SM in a control zone means a circuit flown 500 ft below the cloud base.'));
  return svg({ title: ill.title, h: 376 }, parts);
}

export function radioFrequencies(ill) {
  const x0 = 40;
  const pxPer = 520 / 18.975;
  const X = (f) => x0 + (f - 118) * pxPer;
  const ry = 230;
  const parts = [kicker(20, 20, 'Aeronautical VHF band 118.0 to 136.975 MHz')];
  parts.push(rect(x0, ry - 10, 520, 20, { fill: P.paperDeep, stroke: P.ink, sw: 1.5, r: 3 }));
  for (let f = 118; f <= 136; f += 2) {
    parts.push(line(X(f), ry + 10, X(f), ry + 16, { stroke: P.ink, sw: 1 }));
    parts.push(t(X(f), ry + 30, f.toFixed(0), { size: 9.5, anchor: 'middle', fill: P.inkSoft }));
  }
  // General aviation band.
  parts.push(rect(X(121.9825), ry - 10, X(123.5875) - X(121.9825), 20, { fill: P.yellow, stroke: P.yellow }));
  parts.push(line(X(121.9825), ry + 44, X(123.5875), ry + 44, { stroke: P.yellow, sw: 2 }));
  parts.push(t(X(122.78), ry + 62, '121.9825 to 123.5875: general aviation communications', { size: 10, weight: 700, fill: P.ink }));
  // Callouts, staggered.
  const call = (f, h, name, desc, color) => [
    line(X(f), ry - 10, X(f), ry - h, { stroke: color, sw: 2 }),
    circle(X(f), ry - 10, 3.5, { fill: color, stroke: color }),
    t(X(f) + 6, ry - h + 2, f.toFixed(1), { size: 14, weight: 900, fill: color }),
    t(X(f) + 6, ry - h + 15, name, { size: 10.5, weight: 700 }),
    t(X(f) + 6, ry - h + 27, desc, { size: 9.5, fill: P.inkSoft }),
  ].join('');
  parts.push(call(121.5, 180, 'Emergency', 'distress, ELTs', P.red));
  parts.push(call(122.2, 135, 'FIC (FISE)', 'flight information centre', P.inkSoft));
  parts.push(call(122.8, 90, 'UNICOM', 'private advisory', P.inkSoft));
  parts.push(call(123.2, 45, 'ATF default', 'where there is no UNICOM', P.inkSoft));
  parts.push(call(126.7, 180, 'En route VFR', 'uncontrolled airspace: broadcast and monitor', P.blue));
  parts.push(t(300, 316, 'En route in uncontrolled airspace, monitor 126.7 and 121.5 when practical and not on an MF or ATF.', { size: 10.5, weight: 700, anchor: 'middle' }));
  parts.push(note(300, 334, 'ATC frequencies vary by unit (tower, ground, terminal): read them from the CFS. 243.0 MHz is the UHF emergency frequency.', { anchor: 'middle', size: 9.5 }));
  return svg({ title: ill.title, h: 350 }, parts);
}

export function trafficClock(ill) {
  const cx = 200;
  const cy = 160;
  const r = 115;
  const parts = [kicker(20, 20, 'Traffic by the clock: 12 o\'clock is your nose')];
  parts.push(circle(cx, cy, r, { fill: P.card, stroke: P.ink, sw: 2 }));
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const hx = cx + Math.sin(a) * (r - 18);
    const hy = cy - Math.cos(a) * (r - 18);
    parts.push(t(hx, hy + 5, String(h), { size: 13, weight: h === 2 ? 900 : 700, anchor: 'middle', fill: h === 2 ? P.red : P.inkSoft }));
    parts.push(line(cx + Math.sin(a) * (r - 6), cy - Math.cos(a) * (r - 6), cx + Math.sin(a) * r, cy - Math.cos(a) * r, { stroke: P.ink, sw: 1.5 }));
  }
  parts.push(plane(cx, cy, 0, 1.1, P.blue));
  // Traffic at 2 o'clock.
  const a2 = (2 / 12) * Math.PI * 2;
  const tx = cx + Math.sin(a2) * (r + 32);
  const ty = cy - Math.cos(a2) * (r + 32);
  parts.push(line(cx, cy, cx + Math.sin(a2) * (r + 10), cy - Math.cos(a2) * (r + 10), { stroke: P.red, sw: 2, dash: '5 4' }));
  parts.push(plane(tx, ty, 90, 0.8, P.red));
  parts.push(pathD(`M${cx} ${cy - 60} A60 60 0 0 1 ${cx + Math.sin(a2) * 60} ${cy - Math.cos(a2) * 60}`, { stroke: P.red, sw: 1.5 }));
  parts.push(t(cx + 22, cy - 66, '60°', { size: 11, weight: 900, fill: P.red }));
  parts.push(t(cx, cy + r + 32, 'each hour = 30 degrees; 3 and 9 o\'clock are abeam', { size: 10, anchor: 'middle', fill: P.inkSoft }));
  // Example text.
  parts.push(kicker(400, 60, 'Example'));
  parts.push(rect(400, 70, 180, 100, { fill: P.paperDeep, stroke: P.line, sw: 1, r: 4 }));
  parts.push(t(410, 92, 'You: heading 270.', { size: 11.5, weight: 700 }));
  parts.push(t(410, 110, 'ATC: "Traffic 2 o\'clock,', { size: 11, fill: P.ink }));
  parts.push(t(410, 124, '5 miles, eastbound."', { size: 11, fill: P.ink }));
  parts.push(t(410, 146, '= 60 degrees right of the nose,', { size: 10.5, weight: 700, fill: P.red }));
  parts.push(t(410, 160, 'altitude unknown.', { size: 10.5, weight: 700, fill: P.red }));
  parts.push(t(400, 200, 'Altitude is only known when', { size: 10.5 }));
  parts.push(t(400, 214, 'ATC states it. Reply with', { size: 10.5 }));
  parts.push(t(400, 228, '"traffic in sight" or "negative', { size: 10.5 }));
  parts.push(t(400, 242, 'contact".', { size: 10.5 }));
  parts.push(note(300, 346, 'TC AIM RAC: radar traffic information is given relative to your track, using the 12-hour clock.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function readabilityScale(ill) {
  const rows = [
    ['1', 'Unreadable', 'bad'],
    ['2', 'Readable now and then', 'poor'],
    ['3', 'Readable with difficulty', 'fair'],
    ['4', 'Readable', 'good'],
    ['5', 'Perfectly readable', 'excellent'],
  ];
  const parts = [kicker(20, 20, 'Readability scale for radio checks')];
  rows.forEach(([n, label, q], i) => {
    const x = 40 + i * 108;
    const h = 36 + i * 30;
    const good = i >= 3;
    parts.push(rect(x, 210 - h, 88, h, { fill: good ? P.blue : i === 2 ? P.yellow : P.red, stroke: P.ink, sw: 1.5, r: 3 }));
    parts.push(t(x + 44, 210 - h - 10, n, { size: 26, weight: 900, anchor: 'middle' }));
    parts.push(t(x + 44, 232, label.split(' ').slice(0, 2).join(' '), { size: 10.5, weight: 700, anchor: 'middle' }));
    if (label.split(' ').length > 2) parts.push(t(x + 44, 245, label.split(' ').slice(2).join(' '), { size: 10.5, weight: 700, anchor: 'middle' }));
    parts.push(t(x + 44, 262, q, { size: 9.5, anchor: 'middle', fill: P.inkSoft, upper: true, ls: 1 }));
  });
  parts.push(line(40, 210, 580, 210, { stroke: P.ink, sw: 2 }));
  parts.push(t(300, 296, 'A radio check transmission lasts no more than 10 seconds. A check made before departure is a preflight check.', { size: 10.5, weight: 700, anchor: 'middle' }));
  parts.push(note(300, 314, '"Readability three" means your transmissions are readable with difficulty.', { anchor: 'middle' }));
  return svg({ title: ill.title, h: 330 }, parts);
}
