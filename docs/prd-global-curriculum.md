# PRD: Global Language & Curriculum Controls

**Project:** Tiny Story World
**Date:** April 2, 2026
**Status:** In Progress

---

## 1. Overview

Make **language** and **active curriculum (wordlist)** first-class global settings that every module respects. The platform's instructional UI stays in English; the global language controls what language content is generated/filtered in, and the global curriculum controls which vocabulary words are prioritized across all modules.

---

## 2. Global State

**Store:** Extended `languageStore.ts` (Zustand + localStorage persist)

```
{
  language: 'en' | 'fr' | 'zh-Hans',
  setLanguage(lang),

  profileReadingStage: ReadingStage,       // from student profile, default 'beginner'
  loadProfileReadingStage(),

  activeWordlistId: string | null,         // null = use default pool
  setActiveWordlistId(id),

  activeWords: Word[],                     // cached from DB or default pool
  activeWordlistName: string | null,       // display name for UI badges

  wordlistSource: 'teacher' | 'student' | 'default',
  isTeacherLocked: boolean,
  curriculumLoading: boolean,
}
```

**Persistence:** localStorage key `tsw-language`. Only `language` and `activeWordlistId` are persisted. Words are re-fetched on hydration.

---

## 3. Language <-> Curriculum Sync Rules

| Event | Behavior |
|---|---|
| Student switches language | Auto-switch to a same-language wordlist if one exists (check teacher-assigned first, then student's own). If none exists for that language, clear to `null` (use default pool). |
| Teacher assigns a wordlist to student | Overrides student's choice. Store `wordlistSource: 'teacher'`. Student sees the curriculum but cannot change it. |
| No teacher assignment exists | Student can freely pick from their own wordlists + teacher's shared class lists. `wordlistSource: 'student'`. |
| No curriculum selected (`null`) | All modules use their built-in default word pools. This is the "default curriculum." `wordlistSource: 'default'`. |
| Active wordlist is deleted by teacher | On next hydration, detect missing list, fall back to default, show a toast notification. |

---

## 4. POS Tagging Strategy

Curriculum wordlists may lack POS tags. Resolution:

1. **Match against default pool first.** For each curriculum word, look it up in the built-in word pool for that language (e.g., `en.ts`, `fr.ts`, `zh.ts`). If found, inherit that pool entry's POS tag.
2. **Unmatched words.** Words not in the default pool get no POS tag and are treated as "wildcard" — they can appear in any slot but are deprioritized vs. POS-tagged words in grammar-sensitive modules (Silly Sentences).
3. **The default pool's POS is always authoritative.** If a curriculum word has a POS tag that conflicts with the default pool, the default pool wins.

---

## 5. Module Behaviors

### 5A. Book Library

| Concern | Behavior |
|---|---|
| Book filtering | Filter by global language (already works). |
| Coverage scoring | Auto-use `activeWordlistId` for coverage badges. |
| No curriculum | Show all books for the active language, no coverage badges. |
| Stretch books | Respect `student_curriculum_configs.showStretchBooks` threshold. |

### 5B. Silly Sentences

| Concern | Behavior |
|---|---|
| Word sourcing | **Prioritize curriculum words**, pad with built-in pool words to fill the 20-word round. |
| POS enforcement | Only use curriculum words that have a resolved POS tag (matched from default pool). Unmatched curriculum words can fill "any" slots but won't be placed in POS-specific slots. |
| Round composition | Draw as many POS-tagged curriculum words as possible for the required slots (4 nouns, 3 verbs, 2 adjectives, etc.), then fill remaining slots from the default pool. Include standard anchor words (articles, prepositions) from the default pool to guarantee valid sentences. |
| Small wordlists | If curriculum has < 20 usable words, pad with default pool. Curriculum words are still weighted higher to appear more frequently. |
| No curriculum | Use default built-in pools exactly as today. |
| Usage tracking | Existing `usageCounts` logic continues — curriculum words that haven't been seen are prioritized over ones already practiced. |

### 5C. Battle Stories

| Concern | Behavior |
|---|---|
| Story generation (Claude API) | Add to system prompt: "The student is learning these vocabulary words: [words]. Weave them naturally into the story where they fit — do not force them." (Soft prompt, not a hard coverage requirement.) |
| Story generation (Mock) | No change to mock templates — curriculum integration is best-effort via Claude. |
| Post-generation vocab review | **New UI section** below the story: "Vocabulary Spotlight" showing which curriculum words appeared in the story, highlighted. Words that didn't appear are listed as "words to look for next time." |
| Reading stage | Pulled from student profile as default, with an override dropdown selector. |
| No curriculum | Generate stories as today, no vocab review section. |

### 5D. AI Stories

| Concern | Behavior |
|---|---|
| Wordlist param | Auto-populate from global `activeWordlistId` instead of manual selection. |
| Coverage prompt | Keep existing behavior: "Use as MANY of these words as possible, aim for 70% coverage." |
| Post-generation display | Show coverage percentage (already exists) + add the same "Vocabulary Spotlight" UI as Battle Stories. |
| Reading stage | Pulled from student profile as default, with an override dropdown selector. |
| No curriculum | Generate stories as today, no wordlist injected. |

### 5E. Quizzes (Book Reader)

| Concern | Behavior |
|---|---|
| Quiz generation | If curriculum is active, add to quiz prompt: "Focus questions on these vocabulary words when they appear in the text: [words]." |
| Quiz display | Highlight quiz answers that are curriculum words with a small book badge. |
| No curriculum | Generate quizzes as today. |

---

## 6. UI Changes

### 6A. Sidebar (Protected Layout)

Below the existing language selector:
- **CURRICULUM** dropdown showing wordlists filtered to current language
- Locked with icon when teacher-assigned
- "Default word pool" is always the first option
- Shows word count below the select

### 6B. Module Headers

Each module page shows a small pill when a curriculum is active (CurriculumBadge component).

### 6C. Vocabulary Spotlight (Battle Stories & AI Stories)

New component shown after a story is generated, showing matched/unmatched curriculum words with a coverage count.

---

## 7. Reading Stage

- Pulled from `studentProfiles.readingStage` via `/api/student/stats` on app mount
- Stored in global store as `profileReadingStage`, defaults to `'beginner'`
- Each module (Battle Stories, AI Stories) has a Reading Level dropdown defaulting to the profile stage
- Student can override per-generation
- Dropdown labels the profile stage with "(your level)"

---

## 8. Teacher Assignment Flow

### API: `PUT /api/students/:id/curriculum`
- Validates caller is teacher/admin
- Upserts into `studentCurriculumConfigs`
- When student logs in, teacher assignment takes priority

### API: `GET /api/curriculum/active?language=fr`
- Returns resolved active wordlist for current student
- Teacher-assigned takes priority, then falls back to default

---

## 9. Implementation Status

### Completed
- [x] Extended `languageStore.ts` with curriculum state + reading stage
- [x] Created `/api/curriculum/active` endpoint
- [x] Created `/api/students/[id]/curriculum` endpoint
- [x] Created POS tagging utility (`posTagging.ts`)
- [x] Created `VocabularySpotlight` component
- [x] Created `CurriculumBadge` component
- [x] Created `CurriculumSelector` component
- [x] Added CurriculumSelector to sidebar layout
- [x] Updated Silly Sentences with `selectRoundWordsWithCurriculum`
- [x] Updated Silly Sentences gameStore to use curriculum words
- [x] Added reading stage selector to Battle Stories
- [x] Updated AI Stories to default reading stage from profile
- [x] Updated AI Stories to auto-populate wordlist from global store

### Completed (cont.)
- [x] Update Battle Stories API to accept curriculum words in prompt
- [x] Add VocabularySpotlight to Battle Stories detail page
- [x] Add VocabularySpotlight to AI Stories detail page
- [x] Update Book Library to auto-use global wordlist for coverage scoring
- [x] Update Quizzes to focus on curriculum words (server + client wired)
- [x] Add CurriculumBadge to each module header
- [x] Teacher dashboard: student curriculum assignment view (in Classes page)
- [x] POS auto-detection for CSV uploads without POS column (`posLookup.ts`)
- [x] Class-level word list assignment (`classCurriculumConfigs` table, `/api/classes/[id]/curriculum`)
- [x] Curriculum resolution priority: student → class (merged) → default
- [x] Class Word Lists UI in teacher classes page (add/remove chips, combined word count)
- [x] Bonus word indicator in Silly Sentences (dashed border + "+" badge for non-curriculum pool words)

### Remaining
- [ ] Testing all module integrations end-to-end
