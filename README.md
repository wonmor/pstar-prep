# ✈️ PSTAR Prep

A cross‑platform (**iOS · Android · Web**) study app for Canada's **PSTAR** exam —
*Student Pilot Permit or Private Pilot Licence for Foreign and Military Applicants,
Aviation Regulations* — built with **Expo / React Native**.

**🌐 Live web app:** https://wonmor.github.io/pstar-prep/ · **Privacy:** https://wonmor.github.io/pstar-prep/privacy.html

All **185 official questions** across **14 sections** are sourced directly from
Transport Canada **TP 11919E, 7th Edition (Dec 2022)** and its answer key, each with
the verified correct answer and the original CARs / TC AIM study reference.

## Study modes

| Mode | What it does |
|------|--------------|
| 📝 **Mock Exam** | 50 random questions, **90 % pass mark** — just like the real PSTAR. Answers revealed at the end with a full miss‑review. |
| 🎯 **Practice Quiz** | Drill any single section with **instant** correct/incorrect feedback and the reference. |
| 🗂️ **Flashcards** | Tap to flip — front shows the question, back reveals the answer (green) + reference. Mark cards as *mastered*. Decks: all, bookmarked, or per‑section. |
| ✅ **Answer Key** | Browse **every** question with the correct option shown in a **green circle**. Full‑text search + section filters. |

Progress, per‑section accuracy, bookmarks (★) and best exam score persist locally
(`AsyncStorage`).

## Run it

```bash
cd pstar-prep
npm install

npm run web       # browser  → http://localhost:8081
npm run ios       # iOS simulator (needs Xcode)
npm run android   # Android emulator (needs Android Studio)
npm start         # dev server → scan the QR with Expo Go on a real device
```

### Native builds

`app.json` is configured with bundle id **`com.orchestrsim.pstar_prep`** (iOS &
Android). To produce store binaries:

```bash
npm install -g eas-cli
eas build --platform ios      # or android / all
```

## Project layout

```
App.tsx                  navigator (per‑tab stacks) + tab bar
src/
  data.ts                typed dataset + quiz/shuffle helpers
  storage.ts             AsyncStorage progress, bookmarks, mastery
  nav.tsx                lightweight stack navigator (no nav dependency)
  theme.ts               design tokens
  components/            Button, OptionRow (green‑circle), SectionList…
  screens/               Home, QuizSetup, Quiz, Results, CardsSetup, Flashcards, Review
assets/data/pstar.json   the parsed question bank
scripts/parse_pstar.py   regenerates pstar.json from the TC PDFs (see below)
```

## Regenerating the question bank

The dataset was extracted from the two official PDFs:

```bash
pdftotext -layout tp11919e_-_7th_edition_dec2022.pdf       questions.txt
pdftotext -layout tp11919e_-_pstar_answer_key_english_dec2022.pdf answers.txt
python3 scripts/parse_pstar.py            # → pstar.json (185 Qs, all validated)
```

The parser merges questions, options, the answer key, and the study‑reference
appendix, and validates that every question has 4 options and an in‑range answer.

## Disclaimer

Study material is reproduced from Transport Canada **TP 11919E (Dec 2022)** for
educational use. Always verify against the current **CARs** and **TC AIM**. This app
is **not affiliated with or endorsed by Transport Canada**.
