#!/bin/bash
# Regenerates .github/media/resend-header.png (the README header card).
#
# Prerequisites:
#   - ImageMagick 7 (`magick`) with SVG support
#   - The Red Hat Display and Red Hat Text families (https://github.com/RedHatOfficial/RedHatFont)
#       Fedora/RHEL:  sudo dnf install redhat-display-fonts redhat-text-fonts
#       Elsewhere:    no distro package exists; download the .otf files from the
#                     upstream repo into ~/.local/share/fonts (Linux) or
#                     ~/Library/Fonts (macOS), then run `fc-cache -f` on Linux
#     Or skip the fonts entirely and point FONT_TITLE and FONT_SUBTITLE at any
#     font files you like.
#
# ImageMagick only warns and falls back to a default face when a font is
# missing, so the fonts are resolved and verified up front instead.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v magick >/dev/null 2>&1 || {
  echo "error: ImageMagick 7 (\`magick\`) is required but was not found." >&2
  exit 1
}

# resolve_font <family> <style> <candidate path>...
# Prints the path to a matching font file, or fails if none is installed.
# fc-match substitutes an unrelated font rather than failing, so its result is
# only accepted when the family it reports is the one that was asked for.
resolve_font() {
  local family=$1 style=$2
  shift 2

  local candidate
  for candidate in "$@"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  if command -v fc-match >/dev/null 2>&1; then
    local matched
    matched="$(fc-match -f '%{family}|%{file}' "${family}:style=${style}" 2>/dev/null || true)"
    local matched_family="${matched%%|*}" matched_file="${matched#*|}"
    if [[ -n "$matched_file" && -f "$matched_file" ]] &&
      [[ ",${matched_family}," == *",${family},"* || "$matched_family" == "$family" ]]; then
      printf '%s\n' "$matched_file"
      return 0
    fi
  fi

  echo "error: font '${family} ${style}' was not found." >&2
  echo "       Install the Red Hat font families, or set FONT_TITLE and FONT_SUBTITLE" >&2
  echo "       to font files of your choice. See the prerequisites in $(basename "${BASH_SOURCE[0]}")." >&2
  return 1
}

TITLE="${TITLE:-Resend for n8n}"
SUBTITLE="${SUBTITLE:-The official node for email, contacts, and webhooks}"
ICON="${ICON:-$HERE/../../nodes/Resend/resend-icon-white.svg}"
FONT_TITLE="${FONT_TITLE:-$(resolve_font 'Red Hat Display' Bold \
  /usr/share/fonts/redhat/RedHatDisplay-Bold.otf \
  "$HOME/.local/share/fonts/RedHatDisplay-Bold.otf" \
  "$HOME/Library/Fonts/RedHatDisplay-Bold.otf" \
  /Library/Fonts/RedHatDisplay-Bold.otf)}"
FONT_SUBTITLE="${FONT_SUBTITLE:-$(resolve_font 'Red Hat Text' Regular \
  /usr/share/fonts/redhat/RedHatText-Regular.otf \
  "$HOME/.local/share/fonts/RedHatText-Regular.otf" \
  "$HOME/Library/Fonts/RedHatText-Regular.otf" \
  /Library/Fonts/RedHatText-Regular.otf)}"
for font_var in FONT_TITLE FONT_SUBTITLE; do
  if [[ ! -f "${!font_var}" ]]; then
    echo "error: \$${font_var} points at '${!font_var}', which is not a file." >&2
    exit 1
  fi
done

ACCENT="${ACCENT:-#ffffff}"
TITLE_COLOR="${TITLE_COLOR:-#ffffff}"
SUBTITLE_COLOR="${SUBTITLE_COLOR:-#9a9a9a}"
OUT="${OUT:-$HERE/resend-header.png}"
SEED="${SEED:-42}"

WIDTH=1800
HEIGHT=440
CORNER_RADIUS=28

BASE_COLOR='#0f0f0f'
HALO_A_PEAK='#232323'
HALO_A_RX=1300
HALO_A_RY=340
HALO_B_PEAK='#151515'
HALO_B_RX=620
HALO_B_RY=560
HALO_B_CY=260
GRAIN=0.78

ICON_SIZE=200
ICON_X=150
ACCENT_X=400
ACCENT_TOP=150
ACCENT_BOTTOM=290

if [[ -n "$ICON" && -f "$ICON" ]]; then
  TEXT_X=450
else
  TEXT_X=150
fi

TITLE_SIZE=112
TITLE_Y=-28
SUBTITLE_SIZE=42
SUBTITLE_Y=56

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

halo() {
  local cx=$1 cy=$2 rx=$3 ry=$4 peak=$5 out=$6
  magick -size $((2 * rx))x$((2 * rx)) radial-gradient:"$peak"-'#000000' \
    -resize $((2 * rx))x$((2 * ry))\! "$WORK/halo-source.png"
  magick -size ${WIDTH}x${HEIGHT} xc:black "$WORK/halo-source.png" \
    -geometry +$((cx - rx))+$((cy - ry)) -compose Screen -composite "$out"
}

halo 0 0 "$HALO_A_RX" "$HALO_A_RY" "$HALO_A_PEAK" "$WORK/halo-a.png"
halo "$WIDTH" "$HALO_B_CY" "$HALO_B_RX" "$HALO_B_RY" "$HALO_B_PEAK" "$WORK/halo-b.png"

magick -size ${WIDTH}x${HEIGHT} xc:"$BASE_COLOR" \
  "$WORK/halo-a.png" -compose Screen -composite \
  "$WORK/halo-b.png" -compose Screen -composite \
  -colorspace Gray -type Grayscale \
  -seed "$SEED" -attenuate "$GRAIN" +noise Gaussian \
  -colorspace sRGB -type TrueColor "$WORK/background.png"

build=(magick "$WORK/background.png" -type TrueColor)

if [[ -n "$ICON" && -f "$ICON" ]]; then
  magick -background none -density 1200 "$ICON" \
    -resize ${ICON_SIZE}x${ICON_SIZE} "$WORK/icon.png"
  build+=("$WORK/icon.png"
          -gravity west -geometry +${ICON_X}+0 -compose over -composite)
  build+=(-fill "$ACCENT"
          -draw "roundrectangle ${ACCENT_X},${ACCENT_TOP} $((ACCENT_X + 7)),${ACCENT_BOTTOM} 4,4")
fi

[[ -n "$FONT_TITLE" ]] && build+=(-font "$FONT_TITLE")
build+=(-pointsize "$TITLE_SIZE" -fill "$TITLE_COLOR"
        -gravity west -annotate +${TEXT_X}${TITLE_Y} "$TITLE")

if [[ -n "$SUBTITLE" ]]; then
  [[ -n "$FONT_SUBTITLE" ]] && build+=(-font "$FONT_SUBTITLE")
  build+=(-pointsize "$SUBTITLE_SIZE" -fill "$SUBTITLE_COLOR"
          -gravity west -annotate +$((TEXT_X + 6))+${SUBTITLE_Y} "$SUBTITLE")
fi

build+=("$WORK/card.png")
"${build[@]}"

magick -size ${WIDTH}x${HEIGHT} xc:black -fill white \
  -draw "roundrectangle 0,0 $((WIDTH - 1)),$((HEIGHT - 1)) ${CORNER_RADIUS},${CORNER_RADIUS}" \
  -alpha off "$WORK/corner-mask.png"

magick "$WORK/card.png" "$WORK/corner-mask.png" \
  -alpha off -compose CopyOpacity -composite \
  -depth 8 -strip -define png:compression-level=9 "$OUT"

echo "wrote $OUT"
