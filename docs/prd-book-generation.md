# Mini-PRD: Batch-Generate Leveled Readers from a Word List

**Project:** Tiny Story World
**Date:** April 14, 2026
**Status:** Draft
**Author:** Product

---

## 1. Overview

Let a teacher select one of their word lists and ask the platform to **generate 1–5 leveled reader books** in one batch. All N books in a batch share the same reading level, language, curriculum word list, emphasized words/phrases, and "has pictures" setting — but each book is a distinct story with a distinct title. Generated books land in `/dashboard/books` as **drafts**, invisible to students until the teacher explicitly publishes them.

---

## 2. Problem

Teachers today can import books via the 4-step wizard on `/dashboard/books`, but sourcing age-, level-, and curriculum-appropriate leveled readers is time consuming. Most teachers don't have time to write 5 custom `A Tiger in the Garden`-style readers for Week 5 vocabulary. The platform already has Claude integration and a book data model — the missing piece is a purpose-built generator that respects sight-word density, sentence complexity by level, and the teacher's specific curriculum.

---

## 3. Goals

- A teacher can start a batch from `/dashboard/books` → **Generate Books** button.
- The teacher picks one word list they own, a reading level, optional emphasized words/phrases (subset of the list), a "has pictures" flag, and a batch count (1–5).
- The system generates N distinct stories in one Claude call batch; each page respects level-appropriate word count and sentence structure.
- A blocking progress modal shows per-book progress bars while the teacher waits.
- Books land as drafts in `/dashboard/books` with a "Draft" badge; students never see drafts.
- The teacher reviews each draft (text, page breaks, upload images if "has pictures" was on) and clicks **Publish** to make it visible.

### Non-goals

- Image generation (teachers upload images post-generation for v1; see §8).
- Audio / word-alignment generation (existing book import also lacks this; separate feature).
- Editing individual words in a draft's text (v1 = accept or regenerate the whole book).
- Translation backfill during generation (teachers can run the existing `/api/books/translate` after publishing).
- Per-book parameter variation within a batch (all books share one parameter set).
- Scheduled or background generation (blocking modal only).
- Cost quotas or rate limiting (v1 trusts the small teacher cohort).

---

## 4. User Flow

1. Teacher clicks **Generate Books** on `/dashboard/books`.
2. Modal opens with one parameter form:
   - **Source word list** — dropdown of teacher's own lists
   - **Reading level** — emergent | beginner | in_transition | competent | experienced
   - **Number of books** — 1–5 (slider or buttons)
   - **Emphasized words/phrases** — multi-select chip picker over the word list; default empty
   - **Each page has a picture** — checkbox; default off
   - *(Derived, read-only:)* language (from word list), page count (from level)
3. Teacher clicks **Generate**. Modal switches to progress view with N progress bars ("Book 1/5 — writing page 4 of 8…").
4. On completion, modal shows a list of generated drafts with preview links and a **Review all** button.
5. Teacher opens each draft at `/dashboard/books/preview?bookId=…` (existing route), uploads illustrations if needed, then clicks **Publish**.
6. Published books appear in `/portal/library` for enrolled students.

---

## 5. Data Model Changes

### `books` table (`packages/db/src/schema/books.ts`)

Add three columns:

```ts
creatorId: uuid('creator_id').references(() => users.id),         // nullable for legacy imports
isDraft: boolean('is_draft').notNull().default(false),
sourceWordlistId: uuid('source_wordlist_id')
  .references(() => curriculumWordLists.id),                      // nullable; tracks provenance
```

Notes:
- Existing rows: `creatorId = NULL`, `isDraft = false`, `sourceWordlistId = NULL`. No backfill needed.
- Drafts are excluded from `GET /api/books` for non-owners (students + other teachers see only `isDraft = false`).
- A creator can always see and edit/delete their own drafts regardless of `isDraft`.

No new tables. Generated page rows go into the existing `book_pages` table exactly like imported books.

---

## 6. API Changes

### `POST /api/books/generate` (new)

Body:
```ts
{
  wordlistId: string,
  level: 'emergent' | 'beginner' | 'in_transition' | 'competent' | 'experienced',
  count: number,                // 1–5
  emphasizedWords?: string[],   // subset of the word list; default []
  hasPictures: boolean,         // affects draft page scaffolding only (v1)
}
```

Behavior:
- Auth: teacher or admin only.
- Validates the teacher owns the word list (or list is public).
- Builds one Claude prompt per book using the template in §7, calls Claude sequentially with `Promise.all` using a concurrency cap of 2 to stay under rate limits.
- For streaming progress to the UI: response is an SSE (`text/event-stream`) or chunked JSON emitting `{ bookIndex, stage: 'writing' | 'saving' | 'done', pagesComplete, totalPages }` events so the modal can render per-book progress bars.
- On completion, inserts the `books` row (`isDraft: true`, `creatorId: session.user.id`, `sourceWordlistId: wordlistId`) and N `book_pages` rows per book.

### `PATCH /api/books/[id]` (extend existing)

Already accepts DELETE. Add PATCH for `{ isDraft: false }` (publish). Teacher/admin-only, creator-owned. Also allow `{ isDraft: true }` to unpublish.

### `GET /api/books` (update filter)

Add `WHERE (isDraft = false) OR (creatorId = session.user.id)` so drafts only surface to their creator (plus admins). No change to query shape for non-teachers.

---

## 7. Prompt Design (Leveled Reader Template)

Single system prompt + one user prompt per book. Parameters interpolated:

```
You are an expert children's literacy author writing a level-{level} reader
in {language} for the Tiny Story World platform. Produce a complete short
book as strict JSON with this shape:

{
  "title": "...",
  "themes": ["..."],
  "pages": [{ "pageNumber": 1, "textContent": "...", "vocabWords": ["..."] }, ...]
}

Constraints:
- Page count: {pageCount}  (derived — see table below)
- Total unique words: {uniqueWordTarget}
- Words per page range: {wordsPerPageMin}–{wordsPerPageMax}
- Use words from this curriculum list wherever possible: {wordListJson}
- These words/phrases MUST appear at least once, preferably repeated: {emphasizedWords}
- Structure: beginning → small problem → resolution. Predictable sentence
  pattern at emergent/beginner (repetition of 2–3 stems). Rising complexity
  across pages at higher levels.
- No meta-commentary, no lists of facts, no dialogue tags beyond "said".
- Title must be unique and distinct from any other book in this batch; the
  caller will send a list of sibling titles to avoid.
- Return JSON only.
```

### Level → page/word targets

| Level | Pages | Words / page | Unique words |
|-------|-------|--------------|--------------|
| emergent | 6 | 3–6 | 20–35 |
| beginner | 8 | 8–15 | 50–80 |
| in_transition | 10 | 15–25 | 100–150 |
| competent | 12 | 25–40 | 180–250 |
| experienced | 14 | 40–60 | 300–400 |

### Distinctness within a batch

To avoid 5 near-identical stories: pass the already-generated sibling titles (after each book completes) into the next book's prompt as `"avoidTitles": [...]`. Generation is sequential, not parallel, so this is free to implement.

### Image handling when `hasPictures = true`

v1: each `bookPages.illustrationUrl` stays `null`. The draft review UI shows a "📸 Upload image" placeholder on each page, and the teacher uses the existing `POST /api/books/upload-image` flow. v2 could generate images via an external API (separate PRD).

---

## 8. UI Changes

### `/dashboard/books` — new entry point

Add a **Generate Books** button next to the existing **+ Import Books** button. Clicking opens a modal (new component: `BookGenerateWizard.tsx`, sibling to `BookImportWizard.tsx`).

### Book Generate modal

Single-page form per §4, with these fields and inline validation:

- Word list dropdown — disabled option placeholder: *"Select a word list"*
- Level — radio group with human-readable labels (Emergent, Beginner, In Transition, Competent, Experienced)
- Number of books — 1 / 2 / 3 / 4 / 5 pill buttons
- Emphasized words — chip multi-select populated from the selected list; empty-state hint: *"Leave empty to let the AI pick from the full list"*
- Has pictures — checkbox with subtitle *"Turns on image upload slots on each page after generation"*
- Language and page count shown read-only as they're derived

Primary button: **Generate** (disabled until word list + level chosen).

### Progress state

After submit, the modal switches to a progress view:

```
Generating 3 books from "Semaine 5 - Les Animaux"

Book 1 — Le chat perdu            ████████░░  80% · writing page 6 of 8
Book 2 — (pending)                ░░░░░░░░░░   0%
Book 3 — (pending)                ░░░░░░░░░░   0%
```

Each book fills in its title as soon as Claude returns it. Progress comes from the SSE stream. Cancel button aborts the fetch and discards any books not yet saved.

### Draft badge on `/dashboard/books` list

Books where `isDraft = true` render a small gray pill: `Draft — visible only to you`. Clicking the book title still routes to the existing preview page. Add a **Publish** action next to the existing Delete button for drafts.

### Student side

No UI changes. Drafts are filtered out server-side.

---

## 9. Permissions Summary

| Role    | Can generate? | Sees drafts? | Can publish? |
|---------|---------------|--------------|--------------|
| Teacher | Yes, own lists + any public list | Own drafts only | Own drafts |
| Admin   | Yes, any list | All drafts | Any draft |
| Parent  | No (v1) | No | No |
| Student | No | No | No |

---

## 10. Metrics

- Count of books generated per week, grouped by teacher.
- Draft → Publish conversion rate and time-to-publish.
- Average emphasized-word coverage on published vs. discarded drafts.
- Claude token spend per book (capture in response metadata, log to a simple counter).

---

## 11. Open Questions / Deferred

- **Image generation (v2).** The most-requested follow-up once teachers hit the "upload image × 8 pages × 5 books = 40 uploads" wall. Likely integrate an image API (OpenAI / Imagen) with a per-teacher daily cap.
- **Regenerate one book.** If the teacher doesn't like draft #3, should there be a "Regenerate this one" button in the review UI? Probably yes in v1.1 — cheap to add, improves trust.
- **Partial-batch failure handling.** If book #4 of 5 fails mid-generation, do we save the first 3 and report the failure, or abort all? Current proposal: save successes, flag the failed slot red in the progress UI, teacher can retry.
- **Curriculum-coverage score at generation time.** The existing `bookCurriculumScores` table is populated for imported books. The generate endpoint should populate it too so the teacher immediately sees coverage% in the draft card.
- **Benchmark flag.** `isBenchmark` exists on `books`; should generated books ever be marked benchmark? v1 says no — benchmarks are curated by admins.
- **Assignments from drafts.** Should `POST /api/assignments` reject `bookId` pointing at a draft? Yes — noted as a server-side guard in v1.
- **Duplicate detection.** If a teacher runs the same batch twice, should we warn? v1: no, teacher can delete duplicates.

---

## 12. Rollout

1. Schema migration (three new columns on `books`).
2. API: `POST /api/books/generate`, extend `PATCH /api/books/[id]`, update `GET /api/books` filter.
3. UI: `BookGenerateWizard` modal + Draft badge / Publish button on `/dashboard/books`.
4. Server-side guard: `POST /api/assignments` rejects drafts.
5. QA: generate batch of 3 books, verify drafts invisible to students, publish one, verify it appears in `/portal/library`, delete a draft, cancel mid-generation.
6. Ship no-flag — default behavior for existing books is unchanged (`isDraft = false`, `creatorId = NULL`).

---

## Key Files Reference

- Books schema: `packages/db/src/schema/books.ts`
- Existing import wizard: `apps/web/src/components/BookImportWizard.tsx`
- Books page: `apps/web/src/app/(protected)/dashboard/books/page.tsx`
- Book preview (reuse for draft review): `apps/web/src/app/(protected)/dashboard/books/preview/page.tsx`
- AI story generator (reference for Claude prompting pattern): `apps/web/src/app/api/stories/route.ts`
- Image upload endpoint (draft illustration workflow): `apps/web/src/app/api/books/upload-image/route.ts`
- Translation endpoint (post-publish workflow): `apps/web/src/app/api/books/translate/route.ts`
- Related PRDs: `docs/prd-global-curriculum.md`, `docs/prd-public-word-lists.md`
