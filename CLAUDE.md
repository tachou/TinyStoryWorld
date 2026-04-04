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
- `ANTHROPIC_API_KEY` — Claude API key for AI story/quiz generation (may be empty in dev)

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
- **Teacher Classes**: `/dashboard/classes` — manage students, assign curriculum per student
- **Teacher Books**: `/dashboard/books` — bulk import/delete books
- **Teacher Word Lists**: `/dashboard/word-lists` — create/manage curriculum word lists

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
│       │       ├── posTagging.ts     # Runtime POS resolution for curriculum words
│       │       └── posLookup.ts      # Static POS dictionary for CSV auto-tagging
│       └── next.config.ts
├── packages/
│   ├── db/                           # Drizzle ORM + schema
│   │   └── src/schema/
│   │       ├── users.ts              # users, parentLinks
│   │       ├── classes.ts            # classes, studentProfiles, readingStageEnum
│   │       ├── books.ts              # books, bookPages, bookCurriculumScores, readingSessions, quizAttempts, assignments
│   │       ├── curriculum.ts         # curriculumWordLists, studentCurriculumConfigs
│   │       ├── battle-stories.ts     # battleStories, storyVotes
│   │       └── generated-stories.ts  # generatedStories
│   ├── types/                        # Shared TypeScript types (Language, WordEntry, PartOfSpeech, etc.)
│   ├── sentence-engine/              # Sentence structure engine for Silly Sentences
│   ├── i18n/                         # Internationalization strings
│   ├── audio/                        # TTS/audio utilities
│   └── ui/                           # Shared UI components
├── docs/
│   ├── prd-global-curriculum.md      # Global curriculum feature PRD (mostly complete)
│   └── prd-seo-discovery.md          # SEO & AI discovery PRD (approved, not started)
├── TESTING_PLAN.md                   # Comprehensive test checklist
└── CLAUDE.md                         # This file
```

## API Routes Reference

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/auth/*` | GET/POST | — | NextAuth endpoints |
| `/api/books` | GET | Any | List books (filterable by language/stage) |
| `/api/books/[id]` | GET, DELETE | Any / Teacher+ | Get book with pages / Delete book |
| `/api/books/bulk` | POST | Teacher+ | Bulk import books from JSON |
| `/api/books/curriculum-scores` | GET, POST | Any | Curriculum coverage scores |
| `/api/battle-stories` | GET, POST | Any | List/create battle stories |
| `/api/battle-stories/[id]` | GET | Any | Get single battle story |
| `/api/stories` | GET, POST | Any | List/create AI stories |
| `/api/quizzes` | POST, PATCH | Any | Generate quiz / save results |
| `/api/classes` | GET, POST | Teacher+ | List/create classes |
| `/api/classes/[id]` | GET, DELETE | Teacher+ | Class details with students / Delete |
| `/api/classes/[id]/students` | POST, DELETE | Teacher+ | Add/remove students |
| `/api/word-lists` | GET, POST | Any / Teacher+ | List/create curriculum word lists |
| `/api/curriculum/active` | GET | Student | Get student's resolved active curriculum |
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
2. Teacher optionally assigns it to specific students at `/dashboard/classes` (Curriculum column)
3. Student's store checks for teacher-assigned curriculum first, falls back to own word lists
4. When curriculum is active, modules prioritize those words:
   - **Silly Sentences**: curriculum words fill POS slots first, padded from default pool
   - **Battle Stories / AI Stories**: curriculum words injected into Claude prompt as soft vocabulary
   - **Quizzes**: curriculum words guide question focus
   - **Book Library**: coverage scores show how many curriculum words each book contains
5. VocabularySpotlight shows matched/unmatched curriculum words after story generation

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
- [x] Teacher curriculum assignment UI
- [x] POS auto-detection for uploads
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
- [ ] Consider AI-assisted book generation (using Claude to write leveled readers)
- [ ] Book cover image upload/generation
