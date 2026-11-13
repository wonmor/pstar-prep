// PSTAR drawings, part A: right of way, light signals, aerodrome markings,
// signs and lighting. Coordinates match the spot-it target rectangles in the
// manifest, so keep both in step when moving things.
import { P, svg, t, kicker, rect, line, pathD, circle, arrow, curve, dim, tag, plane, glider, heli, balloon, airship, planeSide, lamp, hatch, note } from './lib.mjs';

export function rightOfWayConverging(ill) {
  return svg({ title: ill.title }, [
    kicker(20, 28, 'Converging at the same altitude'),
    // Tracks converge on a point ahead.
    line(145, 225, 285, 110, { stroke: P.line, sw: 1.5, dash: '4 6' }),
    line(455, 225, 315, 110, { stroke: P.line, sw: 1.5, dash: '4 6' }),
    circle(300, 98, 5, { fill: P.red, stroke: P.red }),
    t(300, 86, 'collision point', { size: 10, anchor: 'middle', fill: P.red, weight: 700 }),
    // Left aeroplane: has the other on its right, so it gives way (turns away, right or behind).
    plane(145, 225, 50, 1.25, P.red),
    curve(175, 200, 230, 165, 215, 240, { stroke: P.red, sw: 2.5 }),
    tag(70, 275, 150, 30, 'Gives way', { fill: P.red }),
    t(145, 325, 'sees the other on its right', { size: 11, anchor: 'middle', fill: P.inkSoft }),
    // Right aeroplane: carries on.
    plane(455, 225, -50, 1.25, P.blue),
    arrow(430, 195, 365, 142, { stroke: P.blue, sw: 2.5 }),
    tag(380, 275, 150, 30, 'Right of way', { fill: P.blue }),
    t(455, 325, 'the aircraft on the right', { size: 11, anchor: 'middle', fill: P.inkSoft }),
    // Right-hand side marker on the left plane.
    note(300, 352, 'CARs 602.19: the aircraft that has the other on its right shall give way.', { anchor: 'middle' }),
  ]);
}

export function rightOfWayHeadOn(ill) {
  return svg({ title: ill.title }, [
    kicker(20, 28, 'Head-on'),
    kicker(320, 28, 'Overtaking'),
    line(300, 20, 300, 340, { stroke: P.line, sw: 1 }),
    // Head-on: both on the same line, both break right.
    line(150, 60, 150, 300, { stroke: P.line, sw: 1.5, dash: '4 6' }),
    plane(150, 290, 0, 1.1, P.ink),
    plane(150, 70, 180, 1.1, P.ink),
    curve(150, 258, 160, 200, 195, 172, { stroke: P.red, sw: 2.5 }),
    curve(150, 102, 140, 160, 105, 188, { stroke: P.red, sw: 2.5 }),
    t(205, 200, 'right', { size: 10, weight: 700, fill: P.red }),
    t(95, 170, 'right', { size: 10, weight: 700, fill: P.red, anchor: 'end' }),
    tag(45, 318, 210, 28, 'Both alter heading right', { fill: P.red, size: 11 }),
    // Overtaking: the faster aircraft passes on the right of the slower one.
    line(450, 60, 450, 320, { stroke: P.line, sw: 1.5, dash: '4 6' }),
    plane(450, 130, 0, 1.0, P.blue),
    plane(450, 300, 0, 1.15, P.ink),
    curve(450, 268, 470, 200, 510, 110, { stroke: P.red, sw: 2.5 }),
    t(590, 100, 'pass on the right', { size: 10, weight: 700, fill: P.red, anchor: 'end' }),
    t(414, 128, 'right of way', { size: 10, weight: 700, fill: P.blue, anchor: 'end' }),
    t(414, 141, 'being overtaken', { size: 10, fill: P.inkSoft, anchor: 'end' }),
    tag(330, 318, 240, 28, 'Overtake on the right', { fill: P.red, size: 11 }),
    note(300, 356, 'Do not climb or descend to avoid: alter heading to the right (CARs 602.19).', { anchor: 'middle' }),
  ]);
}

export function rightOfWayCategories(ill) {
  const rows = [
    ['Balloons', 'have the right of way over everything', (x, y) => balloon(x, y + 4, 0.75)],
    ['Gliders', 'give way to balloons only', (x, y) => glider(x, y, 0, 0.75)],
    ['Airships', 'give way to gliders and balloons', (x, y) => airship(x, y, 0.75)],
    ['Power-driven aircraft towing', 'give way to all three above', (x, y) => plane(x, y, 0, 0.75) + line(x, y + 17, x, y + 34, { stroke: P.ink, sw: 1.5 }) + glider(x, y + 44, 0, 0.42)],
    ['Power-driven heavier-than-air', 'aeroplanes and helicopters give way to all of the above', (x, y) => plane(x - 22, y, 0, 0.8) + heli(x + 26, y, 0, 0.7)],
  ];
  const parts = [kicker(20, 28, 'Who gives way to whom (CARs 602.19)')];
  const top = 48;
  const rh = 56;
  rows.forEach(([name, desc, draw], i) => {
    const y = top + i * rh;
    parts.push(rect(20, y, 470, rh - 6, { fill: i === 0 ? P.paperDeep : P.card, stroke: P.line, sw: 1, r: 4 }));
    parts.push(t(36, y + 32, String(i + 1), { size: 26, weight: 900, fill: i === 0 ? P.blue : P.inkSoft }));
    parts.push(draw(100, y + 25));
    parts.push(t(160, y + 23, name, { size: 15, weight: 700 }));
    parts.push(t(160, y + 41, desc, { size: 11, fill: P.inkSoft }));
  });
  parts.push(arrow(540, top + rows.length * rh - 14, 540, top + 6, { stroke: P.red, sw: 3, size: 14 }));
  parts.push(`<g transform="translate(560 ${top + 150}) rotate(-90)">${t(0, 0, 'GIVES WAY TO EVERYTHING ABOVE', { size: 11, weight: 700, anchor: 'middle', fill: P.red, ls: 1.5 })}</g>`);
  parts.push(note(300, 350, 'Every power-driven aircraft also gives way to any aircraft seen to be towing.', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function rightOfWayLanding(ill) {
  return svg({ title: ill.title }, [
    kicker(20, 28, 'Two aircraft on approach'),
    // Ground and runway.
    line(20, 300, 580, 300, { stroke: P.ink, sw: 2 }),
    rect(400, 292, 170, 8, { fill: P.inkSoft, stroke: P.inkSoft }),
    t(485, 326, 'RUNWAY', { size: 11, weight: 700, anchor: 'middle', fill: P.inkSoft, ls: 2 }),
    // Approach path.
    line(60, 110, 408, 292, { stroke: P.line, sw: 1.5, dash: '5 6' }),
    // Lower aircraft, closer to the threshold.
    planeSide(300, 236, 1.3, P.blue, false, 25),
    tag(240, 258, 130, 26, 'Right of way', { fill: P.blue, size: 11 }),
    t(305, 299, 'lower, ahead', { size: 10, fill: P.inkSoft, anchor: 'middle' }),
    // Higher aircraft behind.
    planeSide(120, 148, 1.3, P.red, false, 25),
    tag(50, 170, 130, 26, 'Gives way', { fill: P.red, size: 11 }),
    t(115, 212, 'higher, behind', { size: 10, fill: P.inkSoft, anchor: 'middle' }),
    note(300, 352, 'The lower aircraft may not use the rule to cut in front of, or overtake, another aircraft on final.', { anchor: 'middle' }),
  ]);
}

export function lightGunSignals(ill) {
  const rows = [
    ['Steady green', P.green, false, 'Cleared to land', 'Cleared for take-off'],
    ['Flashing green', P.green, true, 'Return for landing', 'Cleared to taxi'],
    ['Steady red', P.red, false, 'Give way to other aircraft and continue circling', 'Stop'],
    ['Flashing red', P.red, true, 'Airport unsafe, do not land', 'Taxi clear of landing area in use'],
    ['Flashing white', P.card, true, '(no meaning in flight)', 'Return to starting point on airport'],
  ];
  const parts = [
    kicker(20, 28, 'ATC light gun signals'),
    rect(20, 44, 560, 22, { fill: P.ink, stroke: P.ink, r: 3 }),
    t(95, 59, 'SIGNAL', { size: 10, weight: 700, anchor: 'middle', fill: P.card, ls: 1.5 }),
    t(282, 59, 'IN FLIGHT', { size: 10, weight: 700, anchor: 'middle', fill: P.card, ls: 1.5 }),
    t(490, 59, 'ON THE GROUND', { size: 10, weight: 700, anchor: 'middle', fill: P.card, ls: 1.5 }),
  ];
  rows.forEach(([name, color, flashing, fly, gnd], i) => {
    const y = 70 + i * 48;
    parts.push(rect(20, y, 560, 46, { fill: i % 2 ? P.card : P.paperDeep, stroke: P.line, sw: 1, r: 3 }));
    parts.push(lamp(46, y + 23, 10, color, flashing));
    parts.push(t(68, y + 27, name, { size: 12, weight: 700 }));
    const wrap = (s, x) => {
      const words = s.split(' ');
      if (s.length <= 24) return t(x, y + 27, s, { size: 12 });
      const half = Math.ceil(words.length / 2);
      return t(x, y + 20, words.slice(0, half).join(' '), { size: 12 }) + t(x, y + 35, words.slice(half).join(' '), { size: 12 });
    };
    parts.push(wrap(fly, 180));
    parts.push(wrap(gnd, 395));
  });
  // Blinking runway lights row.
  const y = 70 + rows.length * 48;
  parts.push(rect(20, y, 560, 34, { fill: P.card, stroke: P.line, sw: 1, r: 3 }));
  for (let k = 0; k < 4; k++) parts.push(circle(32 + k * 11, y + 17, 3.2, { fill: P.card, stroke: P.ink, sw: 1.2 }));
  parts.push(t(84, y + 21, 'Blinking runway lights', { size: 12, weight: 700 }));
  parts.push(t(240, y + 21, 'Vehicles and pedestrians: vacate the runway immediately', { size: 11.5 }));
  parts.push(note(300, 357, 'Acknowledge in flight by rocking the wings (day) or flashing the landing light (night).', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}

export function windIndicator(ill) {
  const sock = (x, groundY, angleDeg, label, speed, color) => {
    const top = groundY - 170;
    const a = (angleDeg * Math.PI) / 180; // 0 = hanging straight down, 90 = horizontal
    const L = 110;
    const ex = x + Math.sin(a) * L;
    const ey = top + Math.cos(a) * L;
    // Cone: wide at the pole, narrow at the tail.
    const px = Math.cos(a) * 14;
    const py = -Math.sin(a) * 14;
    const qx = Math.cos(a) * 7;
    const qy = -Math.sin(a) * 7;
    return [
      line(x, groundY, x, top - 10, { stroke: P.ink, sw: 3 }),
      pathD(`M${x + px} ${top + py} L${ex + qx} ${ey + qy} L${ex - qx} ${ey - qy} L${x - px} ${top - py} Z`, { fill: color, stroke: P.ink, sw: 1.5 }),
      circle(x, top, 4, { fill: P.ink, stroke: P.ink }),
      t(x, groundY + 26, label, { size: 13, weight: 700, anchor: 'middle' }),
      t(x, groundY + 44, speed, { size: 11, anchor: 'middle', fill: P.inkSoft }),
    ].join('');
  };
  return svg({ title: ill.title }, [
    kicker(20, 28, 'Standard wind direction indicator (dry)'),
    line(20, 280, 580, 280, { stroke: P.ink, sw: 2 }),
    sock(100, 280, 8, 'Hanging', 'calm', P.card),
    sock(300, 280, 50, 'Drooping', 'less than 15 kt', P.yellow),
    sock(470, 280, 90, 'Horizontal', '15 kt or more', P.red),
    arrow(420, 60, 560, 60, { stroke: P.blue, sw: 2.5 }),
    t(490, 50, 'WIND', { size: 10, weight: 700, anchor: 'middle', fill: P.blue, ls: 2 }),
    t(490, 78, 'tail points downwind', { size: 10, anchor: 'middle', fill: P.inkSoft }),
    note(300, 350, 'Take off and land toward the open end of the sock, into wind.', { anchor: 'middle' }),
  ]);
}

export function runwayMarkings(ill) {
  const parts = [
    hatch('closedHatch', P.line, 7),
    kicker(20, 20, 'Runway and taxiway markings (plan view, north up)'),
    // Closed cross runway (north stub), white X.
    rect(455, 24, 70, 116, { fill: P.inkSoft, stroke: P.inkSoft }),
    line(462, 36, 518, 116, { stroke: P.card, sw: 6 }),
    line(518, 36, 462, 116, { stroke: P.card, sw: 6 }),
    t(532, 60, 'white X', { size: 10, weight: 700, fill: P.ink }),
    t(532, 73, 'closed', { size: 10, fill: P.inkSoft }),
    t(532, 85, 'runway', { size: 10, fill: P.inkSoft }),
    // Main runway 09/27.
    rect(40, 140, 520, 100, { fill: P.inkSoft, stroke: P.inkSoft }),
    // Threshold stripes.
    ...[0, 1, 2, 3].map((k) => rect(56, 150 + k * 22, 26, 14, { fill: P.card, stroke: P.card })),
    ...[0, 1, 2, 3].map((k) => rect(518, 150 + k * 22, 26, 14, { fill: P.card, stroke: P.card })),
    // Numbers (read by a landing pilot, so they face the approach).
    t(118, 199, '09', { size: 26, weight: 900, anchor: 'middle', fill: P.card }),
    t(482, 199, '27', { size: 26, weight: 900, anchor: 'middle', fill: P.card }),
    // Centreline dashes.
    ...Array.from({ length: 9 }, (_, k) => line(150 + k * 34, 190, 170 + k * 34, 190, { stroke: P.card, sw: 3, cap: 'butt' })),
    // Aiming point bars.
    rect(160, 160, 30, 8, { fill: P.card, stroke: P.card }),
    rect(160, 212, 30, 8, { fill: P.card, stroke: P.card }),
    rect(410, 160, 30, 8, { fill: P.card, stroke: P.card }),
    rect(410, 212, 30, 8, { fill: P.card, stroke: P.card }),
    // Taxiway from the south with hold line.
    rect(160, 240, 60, 120, { fill: P.paperDeep, stroke: P.paperDeep }),
    line(190, 360, 190, 262, { stroke: P.yellow, sw: 3 }),
    // Hold position: dashed pair on the runway side, solid pair on the taxiway side.
    line(160, 262, 220, 262, { stroke: P.yellow, sw: 3, dash: '6 5', cap: 'butt' }),
    line(160, 268, 220, 268, { stroke: P.yellow, sw: 3, dash: '6 5', cap: 'butt' }),
    line(160, 276, 220, 276, { stroke: P.yellow, sw: 3, cap: 'butt' }),
    line(160, 282, 220, 282, { stroke: P.yellow, sw: 3, cap: 'butt' }),
    plane(190, 318, 0, 0.75, P.blue),
    t(232, 274, 'hold here:', { size: 10, weight: 700 }),
    t(232, 286, 'solid lines on your side', { size: 10, fill: P.inkSoft }),
    t(232, 262, 'dashed lines face the runway', { size: 10, fill: P.inkSoft }),
    // Closed taxiway stub with yellow X.
    rect(420, 240, 70, 100, { fill: P.paperDeep, stroke: P.paperDeep }),
    line(430, 268, 480, 334, { stroke: P.yellow, sw: 6 }),
    line(480, 268, 430, 334, { stroke: P.yellow, sw: 6 }),
    t(455, 352, 'yellow X: closed taxiway', { size: 10, anchor: 'middle', fill: P.inkSoft }),
    // 200 ft hold distance where no hold line exists.
    plane(100, 330, 0, 0.7, P.ink),
    dim(70, 240, 70, 310, '', { stroke: P.red }),
    t(62, 280, '200 ft', { size: 10, weight: 700, fill: P.red, anchor: 'end' }),
    t(62, 292, 'min. with', { size: 9, fill: P.inkSoft, anchor: 'end' }),
    t(62, 302, 'no hold line', { size: 9, fill: P.inkSoft, anchor: 'end' }),
    // Runway heading hint.
    t(40, 130, 'heading 090 from the west end (09), 270 from the east end (27)', { size: 10, fill: P.inkSoft }),
    t(232, 312, 'manoeuvring area =', { size: 10, fill: P.inkSoft }),
    t(232, 324, 'runways + taxiways', { size: 10, fill: P.inkSoft }),
    t(232, 336, '(not the apron)', { size: 10, fill: P.inkSoft }),
  ];
  return svg({ title: ill.title }, parts);
}

export function airportSigns(ill) {
  const sign = (x, y, w, h, bg, fg, lines, border, label, labelSub) => [
    rect(x, y, w, h, { fill: bg, stroke: border ?? bg, sw: border ? 4 : 1.5, r: 4 }),
    ...lines.map((l, i) => t(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 30 + 10, l, { size: lines.length > 1 ? 22 : 28, weight: 900, anchor: 'middle', fill: fg })),
    t(x + w / 2, y + h + 18, label, { size: 11, weight: 700, anchor: 'middle' }),
    t(x + w / 2, y + h + 32, labelSub, { size: 10, anchor: 'middle', fill: P.inkSoft }),
  ].join('');
  return svg({ title: ill.title }, [
    kicker(20, 28, 'Airport signs'),
    sign(30, 70, 160, 90, P.red, P.card, ['04-22'], null, 'Mandatory: runway holding position', 'stop here unless cleared'),
    sign(220, 70, 110, 90, P.ink, P.yellow, ['A'], P.yellow, 'Location', 'the taxiway you are on'),
    sign(360, 70, 120, 90, P.yellow, P.ink, ['B →'], null, 'Direction', 'turn here for taxiway B'),
    sign(30, 200, 160, 90, P.red, P.card, ['NO', 'ENTRY'], null, 'Mandatory: no entry', 'do not taxi in'),
    sign(360, 200, 170, 90, P.yellow, P.ink, ['APRON →'], null, 'Destination', 'route to the apron'),
    t(275, 236, 'Red + white', { size: 12, weight: 700, anchor: 'middle', fill: P.red }),
    t(275, 252, 'never pass without', { size: 10, anchor: 'middle', fill: P.inkSoft }),
    t(275, 264, 'a clearance', { size: 10, anchor: 'middle', fill: P.inkSoft }),
    note(300, 352, 'Read back a hold short instruction in full: "Hold short of 04".', { anchor: 'middle' }),
  ]);
}

export function airportLighting(ill) {
  const parts = [kicker(20, 20, 'Runway lighting seen from the approach, at night')];
  // Perspective runway.
  parts.push(pathD('M120 200 L480 200 L340 44 L260 44 Z', { fill: P.ink, stroke: P.ink }));
  parts.push(pathD('M300 196 L300 50', { stroke: P.inkSoft, sw: 1.5, dash: '6 7' }));
  const dot = (x, y, r, c) => circle(x, y, r, { fill: c, stroke: c });
  // Threshold lights (green, near edge) and runway end lights (red, far edge).
  for (let k = 0; k < 9; k++) parts.push(dot(128 + k * 44, 206, 4, P.green));
  for (let k = 0; k < 5; k++) parts.push(dot(262 + k * 19, 40, 2.6, P.red));
  // Edge lights, white, along both sides.
  for (let k = 0; k < 7; k++) {
    const f = k / 6;
    const lx = 118 - 0 + (258 - 118) * f;
    const rx = 482 + (342 - 482) * f;
    const y = 196 + (48 - 196) * f;
    const r = 3.6 - f * 1.8;
    parts.push(dot(lx - 6, y, r, P.card));
    parts.push(dot(rx + 6, y, r, P.card));
  }
  // Taxiway edge lights, blue, to the right.
  for (let k = 0; k < 6; k++) parts.push(dot(520 - k * 22, 200 - k * 26, 3.2 - k * 0.3, P.blue));
  parts.push(t(545, 110, 'blue', { size: 10, weight: 700, fill: P.blue }));
  parts.push(t(545, 122, 'taxiway edge', { size: 9, fill: P.inkSoft }));
  parts.push(t(20, 216, 'green threshold', { size: 10, weight: 700, fill: P.green }));
  parts.push(t(20, 150, 'white edge lights', { size: 10, weight: 700, fill: P.inkSoft }));
  parts.push(t(360, 36, 'red runway end', { size: 10, weight: 700, fill: P.red }));
  // PAPI states.
  const states = [
    ['WWWW', 'too high'],
    ['WWWR', 'slightly high'],
    ['WWRR', 'on slope'],
    ['WRRR', 'slightly low'],
    ['RRRR', 'too low'],
  ];
  parts.push(kicker(20, 250, 'PAPI'));
  states.forEach(([s, label], i) => {
    const x = 20 + i * 102;
    const on = s === 'WWRR';
    parts.push(rect(x, 258, 100, 60, { fill: on ? P.paperDeep : P.card, stroke: on ? P.blue : P.line, sw: on ? 2 : 1, r: 4 }));
    parts.push(rect(x + 10, 272, 80, 16, { fill: P.ink, stroke: P.ink, r: 2 }));
    [...s].forEach((c, k) => parts.push(dot(x + 20 + k * 20, 280, 5.5, c === 'W' ? P.card : P.red)));
    parts.push(t(x + 50, 308, label, { size: 10.5, weight: on ? 700 : 500, anchor: 'middle', fill: on ? P.blue : P.ink }));
  });
  // VASI two-bar.
  parts.push(kicker(532, 250, 'VASI'));
  parts.push(rect(532, 258, 58, 60, { fill: P.card, stroke: P.line, sw: 1, r: 4 }));
  parts.push(rect(545, 268, 32, 10, { fill: P.red, stroke: P.red, r: 2 }));
  parts.push(rect(545, 286, 32, 10, { fill: P.card, stroke: P.ink, r: 2 }));
  parts.push(t(561, 311, 'red over white', { size: 8.5, anchor: 'middle', fill: P.blue, weight: 700 }));
  parts.push(note(300, 346, 'Night take-off or landing requires an aerodrome lighted as prescribed (CARs 602.14 series).', { anchor: 'middle' }));
  return svg({ title: ill.title }, parts);
}
