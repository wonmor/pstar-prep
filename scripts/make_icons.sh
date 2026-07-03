#!/usr/bin/env bash
# Generates all app icons + splash from an SVG master using rsvg-convert + ImageMagick.
# Design: a top-view aircraft on a navy radar scope (concentric rings + amber sweep)
# — evokes both aviation regulations (PSTAR) and radio / air-traffic control (ROC-A).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=assets
TMP=$(mktemp -d)

NAVY="#0B2545"
NAVY2="#16365F"
WHITE="#FFFFFF"
SKY="#8FB6E6"
AMBER="#F5A623"

# A reusable top-view aircraft mark, centered in a 1024 box. $1 = fuselage/wing fill.
plane_group() {
  local fill="$1"
  cat <<SVG
  <g fill="${fill}">
    <!-- main wings -->
    <path d="M470,430 L150,648 Q138,656 150,690 L470,560 L554,560 L874,690 Q886,656 874,648 L554,430 Z"/>
    <!-- tailplane -->
    <path d="M470,724 L356,800 Q348,806 360,828 L470,792 L554,792 L664,828 Q676,806 668,800 L554,724 Z"/>
    <!-- fuselage -->
    <path d="M512,176 Q556,176 556,250 L556,800 Q556,872 512,872 Q468,872 468,800 L468,250 Q468,176 512,176 Z"/>
    <!-- vertical fin hint -->
    <path d="M512,792 L486,872 L538,872 Z"/>
  </g>
SVG
}

# Radar scope: navy gradient + concentric rings + an amber sweep arc. No plane.
radar_bg() {
  cat <<SVG
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g fill="none" stroke-linecap="round">
    <circle cx="512" cy="512" r="372" stroke="${SKY}" stroke-opacity="0.20" stroke-width="14"/>
    <circle cx="512" cy="512" r="268" stroke="${SKY}" stroke-opacity="0.14" stroke-width="3"/>
    <circle cx="512" cy="512" r="164" stroke="${SKY}" stroke-opacity="0.14" stroke-width="3"/>
    <circle cx="512" cy="512" r="372" stroke="${SKY}" stroke-opacity="0.10" stroke-width="2" stroke-dasharray="2 26"/>
  </g>
  <!-- radar sweep highlight -->
  <path d="M480 142 A372 372 0 0 1 817 299" fill="none" stroke="${AMBER}" stroke-opacity="0.95" stroke-width="14" stroke-linecap="round"/>
SVG
}

DEFS='<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'"$NAVY2"'"/><stop offset="1" stop-color="'"$NAVY"'"/></linearGradient></defs>'

# 1. Master app icon: radar scope background + tilted white plane.
cat > "$TMP/icon.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${DEFS}
  $(radar_bg)
  <g transform="rotate(-18 512 512)">
    $(plane_group "$WHITE")
  </g>
</svg>
SVG

# 2. Android adaptive foreground: transparent, tilted plane scaled into the safe zone.
cat > "$TMP/foreground.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(512,512) scale(0.60) rotate(-18) translate(-512,-512)">
    $(plane_group "$WHITE")
  </g>
</svg>
SVG

# 3. Android adaptive background: the radar scope (rings + sweep) on navy.
cat > "$TMP/background.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${DEFS}
  $(radar_bg)
</svg>
SVG

# 4. Splash mark: transparent bg (navy comes from app.json), ring + tilted white plane.
cat > "$TMP/splash.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="372" fill="none" stroke="${SKY}" stroke-opacity="0.30" stroke-width="12"/>
  <path d="M480 142 A372 372 0 0 1 817 299" fill="none" stroke="${AMBER}" stroke-opacity="0.9" stroke-width="12" stroke-linecap="round"/>
  <g transform="translate(512,512) scale(0.80) rotate(-18) translate(-512,-512)">
    $(plane_group "$WHITE")
  </g>
</svg>
SVG

render() { rsvg-convert -w "$2" -h "$2" "$1" -o "$3"; }

render "$TMP/icon.svg"       1024 "$OUT/icon.png"
render "$TMP/foreground.svg" 1024 "$OUT/android-icon-foreground.png"
render "$TMP/background.svg" 1024 "$OUT/android-icon-background.png"
render "$TMP/splash.svg"     1024 "$OUT/splash-icon.png"
render "$TMP/icon.svg"        196 "$OUT/favicon.png"

# Monochrome: white plane silhouette on transparent (OS tints it).
render "$TMP/foreground.svg" 1024 "$OUT/android-icon-monochrome.png"

# 512 PNG for store listings / web og-image.
render "$TMP/icon.svg" 512 "$OUT/icon-512.png"

# iOS app icons must be opaque (no alpha). Flatten the full-bleed icons onto navy.
magick "$OUT/icon.png"     -background "$NAVY" -alpha remove -alpha off "$OUT/icon.png"
magick "$OUT/icon-512.png" -background "$NAVY" -alpha remove -alpha off "$OUT/icon-512.png"

rm -rf "$TMP"
echo "Icons written to $OUT/"
ls -la "$OUT"/*.png
