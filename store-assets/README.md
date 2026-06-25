# Store assets

Screenshots and listing copy for the App Store and Google Play.

## Screenshots

Captured from the production web build (identical react-native-web UI) with
Playwright at exact store pixel sizes. Regenerate any time:

```bash
# 1. export + stage the web build under a /pstar-prep path, then serve it
npx expo export --platform web
mkdir -p /tmp/site && cp -R dist /tmp/site/pstar-prep
( cd /tmp/site && python3 -m http.server 8799 --bind 127.0.0.1 & )

# 2. run the capture (needs: npm i playwright && npx playwright install chromium)
OUT_DIR=$PWD/store-assets/screenshots node scripts/capture_screenshots.js
```

Each folder has 6 shots: `01-home`, `02-practice`, `03-exam`, `04-feedback`
(green ✓ + reference), `05-flashcard` (answer side), `06-answers` (answer key).

| Folder | Pixels | Where it goes |
|--------|--------|---------------|
| `ios-6.9/`       | 1320 × 2868 | **App Store — required.** iPhone 6.9" display set. |
| `ios-6.7/`       | 1290 × 2796 | App Store — 6.7" set (older iPhones; also widely accepted as the primary). |
| `ipad-12.9/`     | 2048 × 2732 | App Store — required **only** because `supportsTablet: true`. |
| `android-phone/` | 1080 × 2400 | **Google Play — phone screenshots** (2–8, this gives 6). |

> Apple requires at least the 6.9" (or 6.7") iPhone set, plus a 13" iPad set if the
> app supports iPad. Upload 3–6 per device. Google Play needs 2–8 phone shots, min
> 320 px, max 3840 px — these qualify.

## Suggested listing copy

**App name:** PSTAR Prep — Aviation Exam
**Subtitle (iOS, ≤30):** Canada PSTAR quiz & flashcards
**Promo / short description:** Master Canada's PSTAR aviation regulations exam — 185
official questions, mock exams, flashcards and a searchable answer key. Works
offline.

**Keywords (iOS, ≤100 chars):**
`pstar,pilot,aviation,canada,cars,transport,flight,exam,quiz,flashcards,regulations,private pilot`

**Description:**
```
Preparing for Canada's PSTAR (Student Pilot Permit / Private Pilot Licence
aviation regulations exam)? PSTAR Prep has all 185 official questions from
Transport Canada TP 11919E (7th Edition, Dec 2022), each with the verified
answer and the exact CARs / TC AIM reference.

• MOCK EXAM — 50 random questions, 90% pass mark, just like the real test
• PRACTICE BY SECTION — instant feedback with the regulation reference
• FLASHCARDS — flip to reveal the answer and study reference; track mastery
• ANSWER KEY — browse every question with the correct answer, search & filter
• OFFLINE & PRIVATE — works without a connection; nothing leaves your device

PSTAR Prep is an independent study aid and is not affiliated with, endorsed by,
or sponsored by Transport Canada. Always verify against the current Canadian
Aviation Regulations (CARs) and the TC AIM.
```

**Category:** Education (secondary: Reference)
**Age rating:** 4+ / Everyone
**Privacy:** No data collected — https://wonmor.github.io/pstar-prep/privacy.html
**Support URL:** https://wonmor.github.io/pstar-prep/

## Graphics
- `graphics/play-feature-graphic.png` — 1024 × 500 Google Play feature graphic. ✅
- App icon (1024) lives at `../assets/icon.png`; regenerate with `scripts/make_icons.sh`.

## Still required before submitting
- Confirm **Transport Canada reproduction terms** allow app-store distribution
  (keep the app free). This is the main rejection/takedown risk.
