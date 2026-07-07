#!/usr/bin/env bash
# Generates the Google Play feature graphic (1024x500) for PSTAR & ROC-A Trainer.
# Matches the app icon: aircraft on a navy radar scope, with two-exam messaging.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=store-assets/graphics/play-feature-graphic.png
TMP=$(mktemp -d)

NAVY="#0B2545"; NAVY2="#16365F"; WHITE="#FFFFFF"; SKY="#8FB6E6"; SKYB="#3DA5FF"; AMBER="#F5A623"; MUTE="#B9CBE3"

# Aircraft mark (top view), centered in a 1024 box — same paths as the app icon.
plane='<g fill="'"$WHITE"'">
  <path d="M470,430 L150,648 Q138,656 150,690 L470,560 L554,560 L874,690 Q886,656 874,648 L554,430 Z"/>
  <path d="M470,724 L356,800 Q348,806 360,828 L470,792 L554,792 L664,828 Q676,806 668,800 L554,724 Z"/>
  <path d="M512,176 Q556,176 556,250 L556,800 Q556,872 512,872 Q468,872 468,800 L468,250 Q468,176 512,176 Z"/>
  <path d="M512,792 L486,872 L538,872 Z"/>
</g>'

cat > "$TMP/feat.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>

  <!-- radar badge + aircraft on the left -->
  <g transform="translate(230,250) scale(0.40) translate(-512,-512)">
    <g fill="none" stroke-linecap="round">
      <circle cx="512" cy="512" r="372" stroke="${SKY}" stroke-opacity="0.22" stroke-width="16"/>
      <circle cx="512" cy="512" r="268" stroke="${SKY}" stroke-opacity="0.14" stroke-width="4"/>
      <circle cx="512" cy="512" r="164" stroke="${SKY}" stroke-opacity="0.14" stroke-width="4"/>
    </g>
    <path d="M480 142 A372 372 0 0 1 817 299" fill="none" stroke="${AMBER}" stroke-opacity="0.95" stroke-width="16" stroke-linecap="round"/>
    <g transform="rotate(-18 512 512)">${plane}</g>
  </g>

  <!-- text block on the right -->
  <text x="452" y="150" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="${SKYB}">TRANSPORT CANADA · ISED CANADA</text>
  <text x="450" y="228" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" fill="${WHITE}">PSTAR &amp; ROC-A</text>
  <text x="452" y="292" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="${SKYB}">Trainer</text>
  <rect x="454" y="322" width="486" height="2.5" fill="${SKY}" fill-opacity="0.35"/>
  <text x="452" y="368" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" fill="${WHITE}">275 practice questions · 2 exams</text>
  <text x="452" y="404" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="400" fill="${MUTE}">Mock exams · flashcards · offline &amp; free</text>
</svg>
SVG

rsvg-convert -w 1024 -h 500 "$TMP/feat.svg" -o "$OUT"
# Feature graphic must be opaque (no alpha).
magick "$OUT" -background "$NAVY" -alpha remove -alpha off -strip "$OUT"
rm -rf "$TMP"
echo "Wrote $OUT"; magick identify -format "%f  %wx%h  %[channels]\n" "$OUT"
