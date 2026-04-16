# Mini-PRD: Batch-Generate Leveled Readers from a Word List

**Project:** Tiny Story World
**Date:** April 14, 2026
**Status:** Shipped (v1)
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

### Confirmed in-scope decisions (v1)

- **Regenerate one book** — each draft card has a *Regenerate* button that reruns the same prompt (with a different random seed or fresh `avoidTitles` list) and replaces the draft in place.
- **Partial-batch failure** — successes are saved; failed slots render a red error row in the progress UI with a per-slot *Retry* button. The rest of the batch is not rolled back.
- **Curriculum coverage at generation time** — after each book is saved, compute and insert a `bookCurriculumScores` row against the source word list so the draft card shows coverage% immediately. Use the same helper the import wizard already calls.
- **Duplicate detection** — if the teacher submits a batch whose `(wordlistId, level, emphasizedWords[])` tuple matches an existing draft/published batch from the same teacher, show a soft confirm modal: *"You already generated 3 books with these settings last week. Generate anyway?"* — not a hard block.
- **Level → pages/words targets** — calibration in §7 is the shipping default (emergent 6 / 3–6 / 20–35 … experienced 14 / 40–60 / 300–400).
- **Draft badge copy** — `Draft — visible only to you` on the list view.

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

Books where `isDraft = true` render a small gray pill: **`Draft — visible only to you`**. Clicking the book title still routes to the existing preview page. Drafts also get:

- **Publish** button (next to the existing Delete button)
- **Regenerate** button — opens a confirm dialog and replaces the current draft's pages with a fresh Claude run against the same parameters. Title is regenerated too; old book_pages rows are deleted and recreated.
- Curriculum coverage badge — pulls the latest row from `bookCurriculumScores` for `(bookId, sourceWordlistId)` so the teacher sees e.g. `Coverage: 72%` without opening the draft.

### Duplicate-batch confirm

When the teacher clicks Generate, the server first checks for any existing book owned by this teacher where `(sourceWordlistId, stage, emphasizedWords[])` matches the requested batch. If any match, the client renders a soft-confirm modal:

> You already generated **{N}** book{s} with these exact settings ({date}).
> Generate anyway?  [ Cancel ]  [ Generate anyway ]

Not a hard block — match-normalization uses a sorted-lowercase compare on `emphasizedWords` so trivial reordering doesn't dodge the check.

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
- **Benchmark flag.** `isBenchmark` exists on `books`; should generated books ever be marked benchmark? v1 says no — benchmarks are curated by admins.
- **Assignments from drafts.** Server-side guard in v1: `POST /api/assignments` rejects `bookId` pointing at a draft.

---

## 12. Rollout

1. Schema migration (three new columns on `books`).
2. API: `POST /api/books/generate` (SSE, saves on each book complete, writes `bookCurriculumScores` inline), `POST /api/books/[id]/regenerate`, extend `PATCH /api/books/[id]`, update `GET /api/books` filter, add duplicate-check helper.
3. UI: `BookGenerateWizard` modal + Draft badge / Publish / Regenerate buttons / coverage badge on `/dashboard/books`, plus the soft-confirm duplicate dialog.
4. Server-side guard: `POST /api/assignments` rejects drafts.
5. QA: generate batch of 3 books, verify drafts invisible to students, regenerate one draft, simulate a mid-batch Claude failure (success rows remain, failed slot shows Retry), re-submit same batch and confirm duplicate warning fires, publish a draft, verify it appears in `/portal/library`, delete a draft, cancel mid-generation.
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

---

## Implementation Notes (shipped April 15, 2026)

### What shipped
All items in the PRD shipped as specified, with these implementation details:

- **SSE streaming**: `POST /api/books/generate` emits `batch_start`, `book_start`, `book_done`/`book_error`, and `batch_done` frames. The client parses via `ReadableStream.getReader()` splitting on `\n\n`. Sequential generation (not parallel) to accumulate `avoidTitles`.
- **MOCK_LLM mode**: Set `MOCK_LLM=1` in `.env.local` to skip real Claude calls and generate canned books for offline development. The mock builder (`buildMockBook()`) produces level-appropriate page counts using all words from the source list.
- **Coverage scoring**: Computed inline after each book is saved via `computeAndStoreCoverage()` in `bookGeneration.ts`. Uses word-boundary regex for Latin scripts, character-level `includes()` for CJK.
- **Duplicate detection**: `findDuplicateBatch()` matches `(creatorId, sourceWordlistId, stage)`. Since `emphasizedWords` aren't stored on books, the check compares against the full word inventory of the source list. Returns up to 5 most recent matches.
- **Draft visibility**: `GET /api/books` filters with `WHERE isDraft = false OR creatorId = session.user.id` (admins see all). `GET /api/books/[id]` also enforces this. `POST /api/assignments` rejects draft book IDs.
- **Wizard component**: `BookGenerateWizard.tsx` — word list `<select>` grouped by "My lists" / "Public lists", level radio buttons, count pills (1-5), emphasized-word chip multi-select with `key={selectedList.id}` to force React remount on list change, AbortController for cancel.

### What didn't ship (deferred to v2)
- Per-book progress bars showing page-level writing progress (v1 shows book-level done/writing/error)
- Per-slot Retry button on partial failures (v1 shows error text only)
- `hasPictures` checkbox (v1 always sets `hasPictures = false`; teachers can upload images post-generation via existing flow)
- Image generation via external API

### Key files
- `apps/web/src/lib/bookGeneration.ts` — prompt builder, Claude/mock caller, coverage scoring, duplicate detection
- `apps/web/src/app/api/books/generate/route.ts` — SSE batch generation endpoint
- `apps/web/src/app/api/books/[id]/regenerate/route.ts` — single-draft regeneration
- `apps/web/src/components/BookGenerateWizard.tsx` — wizard modal UI
