# Tiny Story World — Claude Code Reference

## Critical Universal Rules

- **Monorepo**: Turborepo with `apps/web` (Next.js 15) and shared packages under `packages/`
- **Database**: Supabase PostgreSQL via direct connection (NOT pooler). Password: `NotWelcomeAnymore123456!`
- **ORM**: Drizzle ORM. Schema lives in `packages/db/src/schema/`. All tables are re-exported from `packages/db/src/index.ts` as `@tiny-story-world/db`
- **Auth**: NextAuth.js with Credentials provider. Roles: `student`, `teacher`, `parent`, `admin`
- **State management**: Zustand with persist middleware. Single global store at `apps/web/src/stores/languageStore.ts` manages language, curriculum, and reading stage
- **Languages**: English (`en`), French (`fr`), Chinese Simplified (`zh-Hans`)
- **Reading stages**: `emergent`, `beginner`, `in_transition`, `competent`, `experienced` — stored as a Postgres enum `reading_stage`
- **NEVER** use the Supabase pooler endpoint (port 6543). Always use the direct connection (port 5432)
- **NEVER** delete `.env.local` — it contains the only copy of the database password and API keys
- If the `.next` cache corrupts (ENOENT manifest errors), delete the `.next` directory and restart

## Quick Command Reference

| Command | What it does |
|---------|-------------|
| `npm run dev --workspace=apps/web` | Start Next.js dev server on port 3000 |
| `npm run build` | Turbo build all packages + app |
| `npm run lint` | Lint all packages |
| Preview server name: `tsw` | Use this with `preview_start` tool |

### Dev Server

The preview server name is **`tsw`** (use this with `preview_start` tool). The server runs on `http://localhost:3000`.

**Important**: The `tsw` launch config is defined in `C:\ClaudeProjects\SillySentences\.claude\launch.json` (the parent project), NOT in TinyStoryWorld's own `.claude/launch.json`. It uses `start-tsw.js` which cd's into `../TinyStoryWorld/apps/web` and starts Next.js. The TinyStoryWorld `.claude/launch.json` has a `web` config but it's NOT what the preview tool uses.

### Database

- Host: `db.qxucoewzkpoxawhcozhn.supabase.co`
- Port: `5432` (direct connection)
- User: `postgres`
- Database: `postgres`
- Connection string is in `apps/web/.env.local`

### Environment Variables (`apps/web/.env.local`)

- `DATABASE_URL` — Supabase PostgreSQL direct connection
- `NEXTAUTH_SECRET` — Session encryption key
- `NEXTAUTH_URL` — `http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (for Storage)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for server-side storage uploads)
- `ANTHROPIC_API_KEY` — Claude API key for AI story/quiz generation, book generation, and translation backfill (may be empty in dev)
- `MOCK_LLM` — Set to `1` to skip real Claude calls in book generation and use canned mock books (useful for offline dev)

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Teacher | `teacher@test.com` | `test1234` | Ms. Smith, owns "Grade 3 French Immersion" class |
| Student | `student@test.com` | `test1234` | Test Student, enrolled in Grade 3 class, Emergent stage |
| Parent | *(create manually)* | — | Needs `parentLinks` row |
| Admin | *(create manually)* | — | Role `admin` |

## Testing Instructions

### Starting a test session
1. Start the dev server using the `tsw` preview server name
2. Navigate to `http://localhost:3000`
3. Log in with test accounts above
4. Teachers land at `/dashboard`, students at `/portal`

### Key pages to verify
- **Student portal**: `/portal` — dashboard with stats
- **Book Library**: `/portal/library` — browse books, curriculum filter toggle
- **Book Reader**: `/portal/library/read?bookId=xxx` — read book + quiz button
- **Silly Sentences**: `/silly-sentences` — word tile game (language-aware, curriculum-aware)
- **Battle Stories**: `/battle-stories` — build matchups, generate AI stories
- **AI Stories**: `/stories` — theme-based AI story generation
- **Teacher Dashboard**: `/dashboard` — classes, assignments, word lists, books, reports
- **Teacher Classes**: `/dashboard/classes` — manage students, assign curriculum per student or per class
- **Teacher Books**: `/dashboard/books` — import wizard, AI book generation wizard, draft/publish/regenerate workflow, coverage badges, click title to preview
- **Teacher Book Preview**: `/dashboard/books/preview?bookId=xxx` — read book as student sees it, translation toggle for non-English books
- **Book Generation**: Click "Generate Books" on `/dashboard/books` — select word list, reading level, count (1-5), optional emphasized words, streams progress via SSE
- **Teacher Word Lists**: `/dashboard/word-lists` — create/manage curriculum word lists; per-list "Public" toggle to share platform-wide with all students

### Verifying global controls
1. Open the sidebar (hamburger menu on mobile)
2. **Language selector** at bottom — switches all modules to EN/FR/ZH
3. **Curriculum dropdown** below language — shows word lists for current language
4. Changing language auto-reloads curriculum for the new language

### Seeding test data
- `POST /api/seed` — Seeds 3 French books (dev only, disabled in production)

## Repository Etiquette

- **Commit style**: Descriptive first line summarizing what + why, then bullet details in body
- **Co-author line**: All AI commits include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- **Branch**: All work is on `main` currently
- **Don't push** unless the user explicitly asks
- **Don't amend** previous commits — always create new commits
- **Stage specific files** — avoid `git add -A` or `git add .`

## Project Structure

```
TinyStoryWorld/
├── apps/
│   └── web/                          # Next.js 15 app (Turbopack)
│       ├── .env.local                # DB + auth + API keys
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/              # API routes (see below)
│       │   │   ├── (protected)/      # Auth-required pages
│       │   │   │   ├── layout.tsx    # Sidebar, nav, language/curriculum selectors
│       │   │   │   ├── portal/       # Student pages
│       │   │   │   ├── dashboard/    # Teacher pages
│       │   │   │   ├── battle-stories/
│       │   │   │   ├── stories/      # AI Stories
│       │   │   │   └── silly-sentences/
│       │   │   └── login/ & register/
│       │   ├── components/           # Shared components
│       │   │   ├── BookGenerateWizard.tsx  # AI book generation wizard modal
│       │   │   ├── CurriculumBadge.tsx
│       │   │   ├── CurriculumSelector.tsx
│       │   │   └── VocabularySpotlight.tsx
│       │   ├── features/
│       │   │   ├── battle/           # Battle Stories feature
│       │   │   │   ├── components/BattleBuilder.tsx
│       │   │   │   └── data/fighters.ts  # Fighter/setting/twist translations
│       │   │   ├── silly-sentences/  # Silly Sentences game
│       │   │   │   ├── data/en.ts, fr.ts, zh.ts  # Word pools with POS
│       │   │   │   ├── data/index.ts              # selectRoundWordsWithCurriculum()
│       │   │   │   └── store/gameStore.ts
│       │   │   ├── reader/           # Book reader components
│       │   │   └── quiz/             # Quiz modal
│       │   ├── stores/
│       │   │   └── languageStore.ts  # Global: language + curriculum + reading stage
│       │   └── lib/
│       │       ├── auth.ts           # NextAuth config
│       │       ├── bookGeneration.ts # Claude prompt builder, mock mode, coverage scoring
│       │       ├── posTagging.ts     # Runtime POS resolution for curriculum words
│       │       └── posLookup.ts      # Static POS dictionary for CSV auto-tagging
│       └── next.config.ts
├── packages/
│   ├── db/                           # Drizzle ORM + schema
│   │   └── src/schema/
│   │       ├── users.ts              # users, parentLinks
│   │       ├── classes.ts            # classes, studentProfiles, readingStageEnum
│   │       ├── books.ts              # books, bookPages, bookCurriculumScores, readingSessions, quizAttempts, assignments
│   │       ├── curriculum.ts         # curriculumWordLists, studentCurriculumConfigs, classCurriculumConfigs
│   │       ├── battle-stories.ts     # battleStories, storyVotes
│   │       └── generated-stories.ts  # generatedStories
│   ├── types/                        # Shared TypeScript types (Language, WordEntry, PartOfSpeech, etc.)
│   ├── sentence-engine/              # Sentence structure engine for Silly Sentences
│   ├── i18n/                         # Internationalization strings
│   ├── audio/                        # TTS/audio utilities
│   └── ui/                           # Shared UI components
├── docs/
│   ├── prd-book-generation.md        # Batch book generation PRD (shipped v1)
│   ├── prd-global-curriculum.md      # Global curriculum feature PRD (mostly complete)
│   ├── prd-public-word-lists.md      # Public word lists PRD (shipped v1)
│   └── prd-seo-discovery.md          # SEO & AI discovery PRD (approved, not started)
├── TESTING_PLAN.md                   # Comprehensive test checklist
└── CLAUDE.md                         # This file
```

## API Routes Reference

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/auth/*` | GET/POST | — | NextAuth endpoints |
| `/api/books` | GET | Any | List books (filterable by language/stage; drafts hidden from non-owners) |
| `/api/books/[id]` | GET, PATCH, DELETE | Any / Teacher+ | Get book / Toggle isDraft (publish/unpublish) / Delete book |
| `/api/books/generate` | POST | Teacher+ | Batch-generate 1-5 books via Claude (SSE streaming) |
| `/api/books/[id]/regenerate` | POST | Teacher+ | Re-run Claude on a draft, replacing content in place |
| `/api/books/bulk` | POST | Teacher+ | Bulk import books from JSON (supports translationEn per page) |
| `/api/books/upload-image` | POST | Teacher+ | Upload page illustration to Supabase Storage (multipart/form-data) |
| `/api/books/translate` | POST | Teacher+ | Auto-generate English translations for book pages via Claude |
| `/api/books/curriculum-scores` | GET, POST | Any | Curriculum coverage scores |
| `/api/battle-stories` | GET, POST | Any | List/create battle stories |
| `/api/battle-stories/[id]` | GET | Any | Get single battle story |
| `/api/stories` | GET, POST | Any | List/create AI stories |
| `/api/quizzes` | POST, PATCH | Any | Generate quiz / save results |
| `/api/classes` | GET, POST | Teacher+ | List/create classes |
| `/api/classes/[id]` | GET, DELETE | Teacher+ | Class details with students / Delete |
| `/api/classes/[id]/students` | POST, DELETE | Teacher+ | Add/remove students |
| `/api/word-lists` | GET, POST | Any / Teacher+ | List/create curriculum word lists (student GET also returns any list with `isPublic = true`) |
| `/api/word-lists/[id]` | PATCH, DELETE | Teacher+ / Owner | Toggle `isPublic` (teacher/admin) / Delete own list |
| `/api/classes/[id]/curriculum` | GET, POST, DELETE | Teacher+ | List/add/remove word lists assigned to a class |
| `/api/curriculum/active` | GET | Student | Get student's resolved active curriculum (student → class → default) |
| `/api/students/[id]/curriculum` | GET, PUT | Teacher+ | View/assign curriculum to student |
| `/api/student/stats` | GET | Student | Student profile stats + reading stage |
| `/api/reading-sessions` | POST | Student | Log reading session |
| `/api/seed` | POST | Dev only | Seed sample books |

## Key Architecture Decisions

### Global State (languageStore.ts)
- **language**: persisted, controls all modules
- **activeWordlistId / activeWords**: loaded async from `/api/curriculum/active` or student's own word lists
- **profileReadingStage**: loaded from `/api/student/stats`, used as default for story generation
- **wordlistSource**: `'teacher'` (locked) or `'student'` (selectable)
- Changing language triggers `loadCurriculum()` to find matching word lists
- `hydrateCurriculum()` runs on app mount (loads both curriculum + reading stage)

### Curriculum Flow
1. Teacher creates word list at `/dashboard/word-lists`
2. Teacher assigns word lists to classes at `/dashboard/classes` (Class Word Lists section) or to individual students (Curriculum column)
3. **Resolution priority**: Student-level override → Class-level word lists (merged, deduplicated) → Student's own selection → Default pool
4. When curriculum is active, modules prioritize those words:
   - **Silly Sentences**: curriculum words fill POS slots first, padded from default pool. Non-curriculum "bonus" words are visually distinguished with dashed borders, reduced opacity, and a "+" badge
   - **Battle Stories / AI Stories**: curriculum words injected into Claude prompt as soft vocabulary
   - **Quizzes**: curriculum words guide question focus
   - **Book Library**: coverage scores show how many curriculum words each book contains
5. VocabularySpotlight shows matched/unmatched curriculum words after story generation

### Class-Level Word Lists
- Multiple word lists can be assigned to a single class via `classCurriculumConfigs` table
- When a student belongs to a class with assigned word lists, they are merged (deduplicated by lowercase key)
- Class curriculum is a fallback — student-level assignment takes precedence
- API: `GET/POST/DELETE /api/classes/[id]/curriculum`

### Public Word Lists
- Any teacher can flip `curriculum_word_lists.is_public = true` on their own list via the toggle on `/dashboard/word-lists`
- `GET /api/word-lists` for a student returns: own lists ∪ lists owned by class teachers ∪ any public list (id-level de-dup)
- `PATCH /api/word-lists/[id]` is teacher/admin-only; parents cannot publish (v1 scope)
- See `docs/prd-public-word-lists.md`

### Translation System (Battle Stories)
- `fighters.ts` has translation maps: `FIGHTERS_FR`, `FIGHTERS_ZH`, `SETTINGS_FR`, `SETTINGS_ZH`, `TWISTS_FR`, `TWISTS_ZH`
- `translateFighter()`, `translateSetting()`, `translateTwist()` helpers in the battle stories API route
- Applied before building the Claude prompt so the full story is in the target language

### POS Tagging
- `posLookup.ts`: Static dictionary (400+ words across EN/FR/ZH) for auto-tagging CSV uploads
- `posTagging.ts`: Runtime resolution matching curriculum words against built-in word pools

## Pending Work

### Global Curriculum PRD (mostly complete)
- [x] All module integrations done
- [x] Teacher curriculum assignment UI (student-level + class-level)
- [x] POS auto-detection for uploads
- [x] Class-level word list assignment with merged curriculum resolution
- [x] Bonus word visual indicator in Silly Sentences (dashed border + "+" badge for non-curriculum words)
- [ ] End-to-end testing of all curriculum integrations

### SEO & AI Discovery PRD (approved, not started)
Full plan at `docs/prd-seo-discovery.md`. Key items:
- [ ] Add `visibility` column to stories/books (public/private/unlisted)
- [ ] Build `/explore` public gallery page
- [ ] Build `/explore/stories/[slug]` public story pages
- [ ] Create `sitemap.xml`, `robots.txt`, `llms.txt`
- [ ] Add Schema.org JSON-LD structured data
- [ ] OG image generation for social sharing
- [ ] Social share buttons on story pages

### Book Library
- [x] Bulk JSON import endpoint + teacher UI
- [x] 4-step import wizard: JSON input, per-page images (Supabase Storage), curriculum association, review
- [x] English translation support: optional `translationEn` per page in JSON, Claude auto-backfill for missing translations
- [x] Supabase Storage integration for page illustrations (`book-images` bucket)
- [x] Teacher book preview: click book title on `/dashboard/books` to read as student, with English translation toggle
- [x] AI book generation: batch-generate 1-5 leveled readers from word lists via Claude (SSE streaming, draft workflow, coverage scoring, duplicate detection, MOCK_LLM fallback). See `docs/prd-book-generation.md`
- [x] Draft management: publish/unpublish toggle, regenerate drafts, coverage badges, draft visibility guards
- [ ] Book cover image upload/generation
- [ ] AI image generation for book pages (v2)
- [ ] Per-book progress bars during generation (v1 shows book-level status only)
