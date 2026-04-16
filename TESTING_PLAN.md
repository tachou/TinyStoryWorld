# Tiny Story World — Testing Plan

## Test Accounts

| Role    | Email              | Password | Notes                          |
|---------|--------------------|----------|--------------------------------|
| Teacher | teacher@test.com   | test1234 | Ms. Smith, owns "Grade 3 French Immersion" class |
| Student | student@test.com   | test1234 | Test Student, enrolled in Grade 3 class |
| Parent  | *(create manually)* | —       | Needs `parentLinks` row to link to student |
| Admin   | *(create manually)* | —       | Role `admin` for full access |

---

## 1. Authentication & Authorization

### 1.1 Registration
- [ ] Navigate to `/register`
- [ ] Register with valid email/password/name — redirects to login
- [ ] Register with duplicate email — shows error
- [ ] Register with empty fields — shows validation errors
- [ ] Register with password < 6 chars — shows error

### 1.2 Login
- [ ] Navigate to `/login`
- [ ] Login with valid teacher credentials — redirects to `/dashboard`
- [ ] Login with valid student credentials — redirects to `/portal`
- [ ] Login with invalid password — shows error
- [ ] Login with nonexistent email — shows error

### 1.3 Role-Based Access (Middleware)
- [ ] Student accessing `/dashboard` — redirects to `/portal`
- [ ] Teacher accessing `/family` — redirects to `/`
- [ ] Unauthenticated user accessing `/portal` — redirects to `/login`
- [ ] Public routes (`/`, `/login`, `/register`) — accessible without auth

### 1.4 Sign Out
- [ ] Click Sign Out button — redirects to `/`
- [ ] After sign out, accessing protected route — redirects to `/login`

---

## 2. Student Portal

### 2.1 Dashboard (`/portal`)
- [ ] Shows welcome message with student name
- [ ] Displays Level badge with correct level number
- [ ] XP bar shows current XP and progress to next level
- [ ] Stat cards show correct counts: Pages Read, Reading Time, Stories Created, Grammar Score
- [ ] Reading Streak shows last 7 days with active day markers
- [ ] Recent Badges section shows earned badges (or empty state)
- [ ] Quick links (Book Library, Silly Sentences, Battle Stories, AI Stories) are clickable
- [ ] My Assignments section loads and shows teacher-assigned tasks
- [ ] Recent Reading section loads and shows reading history

### 2.2 Badges Page (`/portal/badges`)
- [ ] Page loads with badge categories: Reading, Creative, Social, Grammar
- [ ] Earned badges show golden border, green checkmark, and colored gradient
- [ ] Unearned badges show gray/locked appearance
- [ ] Badge progress text shows current count vs. requirement
- [ ] Summary header shows "X of Y badges earned"
- [ ] Badges correctly reflect actual student activity data

---

## 3. Book Library & Reader

### 3.1 Book Library (`/portal/library`)
- [ ] Page loads with all books displayed as cards
- [ ] Each card shows: cover image, title, reading stage badge, page count, description
- [ ] Stage filter dropdown filters books correctly (All Stages, Emergent, Beginner, etc.)
- [ ] Clicking a book card navigates to reader

### 3.2 Curriculum Filter
- [ ] Enable "Curriculum Filter" checkbox — word list dropdown appears
- [ ] Select a word list — "Scan Books" button appears
- [ ] Click "Scan Books" — button shows "Computing..." then results load
- [ ] Coverage threshold slider appears (50%–100%)
- [ ] Books show coverage badges (green >= 90%, emerald >= 80%, yellow >= 70%, red < 70%)
- [ ] "X/Y words matched" text displays on each book card
- [ ] Adjusting threshold slider filters visible books
- [ ] "Stretch Books" section appears for books near threshold
- [ ] "Showing X books above Y% coverage" counter updates correctly

### 3.3 Book Reader (`/portal/library/read`)
- [ ] Reader loads with book title, page count, page text
- [ ] Page navigation (Prev/Next) works, page indicator updates
- [ ] Keyboard navigation: ArrowRight = next, ArrowLeft = prev
- [ ] Listen button triggers TTS in correct language (French voice for FR books)
- [ ] Read button toggles read mode
- [ ] TTS play button works and highlights text
- [ ] Back to Library button returns to `/portal/library`

### 3.4 Pre-Reading Vocabulary Cards
- [ ] When a curriculum word list has been scanned, opening a book with unmatched words shows vocab modal
- [ ] Vocab cards show one word at a time with "Tap to hear pronunciation" prompt
- [ ] Tapping the card plays TTS pronunciation
- [ ] Next/Prev navigation works through cards
- [ ] Dismissing (X button) closes modal and shows reader
- [ ] Last card shows "Start Reading" button

### 3.5 Reading Quiz
- [ ] Quiz button (green, bottom-right) visible while reading
- [ ] Clicking Quiz generates 5 comprehension questions
- [ ] Questions are in the book's language (French for FR books)
- [ ] Question type badges show: Recall (blue), Think Deeper (purple), Connect (green)
- [ ] Selecting an answer highlights it, enables "Check Answer" button
- [ ] Correct answer shows green highlight + "Correct! Great job!"
- [ ] Wrong answer shows red highlight + correct answer text
- [ ] "Next Question" advances to next question
- [ ] After question 5, "See Results" shows score summary
- [ ] Results screen shows: percentage score, correct/total count, per-question review
- [ ] Quiz attempt is saved to database (check `/api/quizzes?bookId=...`)
- [ ] "Quit Quiz" closes modal without saving

### 3.6 Reading Session Tracking
- [ ] Completing a book (reaching last page) logs a reading session
- [ ] Session appears in portal Reading History table
- [ ] Session records: book title, mode, pages read, duration, date

---

## 4. Silly Sentences Grammar Game

### 4.1 Game Setup (`/silly-sentences`)
- [ ] Page loads with word pool tiles (color-coded by POS: noun, verb, adjective, etc.)
- [ ] POS Legend is visible and correct
- [ ] Sentence tray area is empty initially

### 4.2 Gameplay
- [ ] Clicking a word tile adds it to sentence tray
- [ ] Clicking a tray tile removes it back to pool
- [ ] Drag-and-drop reordering works in tray
- [ ] Submit button validates sentence grammar
- [ ] Correct sentence: green feedback, confetti/celebration
- [ ] Incorrect sentence: red feedback with explanation
- [ ] "New Round" button loads fresh word pool
- [ ] Language selector changes word pool language

### 4.3 Audio
- [ ] Clicking a word tile plays TTS pronunciation
- [ ] Playing full sentence reads entire tray aloud

---

## 5. Battle Stories

### 5.1 Battle Builder (`/battle-stories` > Build tab)
- [ ] Fighter A and Fighter B dropdowns populate with categories
- [ ] Number selectors (1-1000) for each fighter
- [ ] Setting dropdown shows 14 options
- [ ] Twist dropdown shows 12 options
- [ ] "Randomize" button fills all fields randomly
- [ ] Content safety: entering blocked words shows warning
- [ ] "Generate Battle Story!" button calls API and shows loading
- [ ] Story generates (mock or Claude API) and redirects to reader

### 5.2 Battle Story Reader (`/battle-stories/[id]`)
- [ ] Story displays with title, pages, navigation
- [ ] TTS works in correct language
- [ ] Keyboard shortcuts (arrows) navigate pages
- [ ] Voting panel shows 4 categories: Funniest, Smartest, Surprising, Best Plan
- [ ] Clicking a vote category toggles vote (add/remove)
- [ ] Vote counts update in real-time
- [ ] Remix button navigates to builder with matchup pre-filled
- [ ] Parent story badge shows if this is a remix
- [ ] Remix count badge shows number of remixes

### 5.3 Classroom Feed (`/battle-stories` > Feed tab)
- [ ] Feed loads stories from classmates
- [ ] Tab filters work: Recent, Trending, Funny, Smart, Surprising
- [ ] Story cards show: title, author name, vote badges, remix badge
- [ ] Clicking a card navigates to story reader

### 5.4 Remix Flow
- [ ] From a story reader, click "Remix" button
- [ ] Builder pre-fills with original matchup data
- [ ] Labels show "Your Remix" and "Generate Your Remix!"
- [ ] Generated remix stores `parentStoryId` reference
- [ ] Parent story's `remixCount` increments

---

## 6. AI Story Generator

### 6.1 Story Creation (`/stories`)
- [ ] Page loads with 12 theme buttons (Adventure, Animals, Space, etc.)
- [ ] Reading level dropdown shows 5 stages
- [ ] Optional word list picker loads available word lists
- [ ] Selecting theme + level enables "Generate Story" button
- [ ] Story generates (mock or Claude API) with loading state
- [ ] Generated story appears in history list with coverage badge (if word list used)

### 6.2 AI Story Reader (`/stories/[id]`)
- [ ] Story displays with title, pages, indigo theme header
- [ ] Page navigation works (buttons + keyboard)
- [ ] TTS reads in correct language
- [ ] Coverage badge shows in header if word list was used
- [ ] Back button returns to stories list

---

## 7. Teacher Dashboard

### 7.1 Dashboard Home (`/dashboard`)
- [ ] Shows welcome message with teacher name
- [ ] 4 navigation cards: My Classes, Assignments, Word Lists, Progress Reports
- [ ] Each card links to correct page

### 7.2 Class Management (`/dashboard/classes`)
- [ ] Create new class with name and academic year
- [ ] Class list shows on left panel
- [ ] Selecting a class shows detail view with students
- [ ] Add student by email — student appears in list
- [ ] Student card shows: name, reading stage, level, books read, stars
- [ ] Remove student from class (confirm dialog)

### 7.3 Assignments (`/dashboard/assignments`)
- [ ] Create assignment: select type (book, silly-sentences, battle-story, ai-story)
- [ ] Select class to assign to
- [ ] Optional due date picker
- [ ] Optional curriculum filter toggle with word list
- [ ] Assignment appears in list with type icon, due date, curriculum badge
- [ ] Students see assignments on their portal

### 7.4 Book Generation (`/dashboard/books` > Generate Books)
- [ ] Click "Generate Books" button — wizard modal opens
- [ ] Word list dropdown shows own lists + public lists, grouped by section
- [ ] Selecting a word list shows language label and populates emphasized-word chips
- [ ] Switching word lists resets chips correctly (no stale chips from previous list)
- [ ] Reading level radio buttons show all 5 levels; selecting one shows page/word targets
- [ ] Number of books pills (1-5) — selecting updates the Generate button label
- [ ] Emphasized word chips toggle on/off with visual feedback
- [ ] Generate button disabled until word list and level are selected
- [ ] Click Generate — modal switches to progress view with SSE streaming
- [ ] Each book row shows spinner while writing, checkmark when done, warning on error
- [ ] Book titles appear as they stream in from Claude
- [ ] Cancel button aborts in-flight generation
- [ ] On completion, "Generation complete" shows all books with draft labels
- [ ] Done button closes modal and refreshes book list
- [ ] Generated books appear in list with "Draft — visible only to you" badge
- [ ] Draft rows show amber background and Publish/Regenerate/Delete buttons
- [ ] Coverage badge appears on drafts (green >= 70%, yellow >= 40%, red < 40%)
- [ ] Click Publish — draft badge removed, book visible to students
- [ ] Click Unpublish on published book — reverts to draft state
- [ ] Click Regenerate — confirm dialog, then replaces draft content with new Claude run
- [ ] Duplicate detection: re-submitting same (wordlist, level) shows soft warning
- [ ] "Generate anyway" bypasses duplicate warning
- [ ] MOCK_LLM=1 in .env.local — generates canned books without real API key
- [ ] Student cannot see draft books in `/portal/library`
- [ ] Cannot assign a draft book via assignments API (returns 403)

### 7.5 Word Lists (`/dashboard/word-lists`)
- [ ] Create word list: name, language, script type
- [ ] Upload CSV with columns: word, pos, phonetic
- [ ] Word list appears in list with language, word count, date
- [ ] Students can see teacher-created word lists (via class enrollment)

### 7.6 Progress Reports (`/dashboard/reports`)
- [ ] Class selector dropdown auto-selects first class
- [ ] Period toggle: Last 7 days, Last 30 days, All time
- [ ] Stat cards: Active Students, Total Pages Read, Reading Minutes, Stories Created
- [ ] Reading Stage Distribution bar chart shows correct counts
- [ ] Daily Reading Activity chart shows bars per day (or empty state)
- [ ] Individual Student Progress table with sortable columns
- [ ] Click column headers to sort (name, stage, pages, minutes, books, stories, grammar, last active)
- [ ] Inactive students (>7 days) highlighted with red background
- [ ] Inactive Students warning section lists student names

### 7.7 Content Moderation (`/dashboard/moderation`)
- [ ] Filter tabs: All Content / Battle Stories / AI Stories
- [ ] Status tabs: Pending / Approved / Rejected
- [ ] Stats cards: Total Pending, Battle Stories pending, AI Stories pending
- [ ] Pending items show: title, author, language, reading stage, date, preview text
- [ ] "Show more" expands preview text
- [ ] Battle stories show matchup tags (fighterA, fighterB, setting, twist)
- [ ] Click "Approve" — item removed from pending, status updated in DB
- [ ] Click "Reject" — item removed from pending, status updated in DB
- [ ] Switch to "Approved" tab — shows approved items (no action buttons)

---

## 8. Parent Portal

### 8.1 Family Dashboard (`/family`)
- [ ] Shows welcome message with parent name
- [ ] If no linked children: shows empty state with explanation
- [ ] If linked children: shows child cards with:
  - Child name, class name, level badge
  - Stats: Pages Read, Reading Time, Stars
  - Reading stage badge and streak display
  - Books Read and Stories Created counts
  - Recent Books list (last 5)
  - "No reading activity yet" if no sessions

---

## 9. Responsive Design

### 9.1 Mobile (375px)
- [ ] Sidebar hidden, hamburger menu visible in top header
- [ ] "Tiny Story World" centered in mobile header
- [ ] Tapping hamburger opens slide-out drawer with full navigation
- [ ] Tapping overlay or nav link closes drawer
- [ ] Content uses full width (no left margin)
- [ ] Stat cards stack in 2-column grid
- [ ] Book cards stack vertically
- [ ] Quiz modal fits within mobile viewport
- [ ] Battle builder form stacks vertically

### 9.2 Tablet (768px)
- [ ] Desktop sidebar visible (md breakpoint)
- [ ] Mobile header hidden
- [ ] Content has left margin for sidebar
- [ ] Grids adjust to 2-column layouts

### 9.3 Desktop (1280px)
- [ ] Full sidebar with all navigation items
- [ ] Language selector in sidebar footer
- [ ] User info and sign out in sidebar bottom
- [ ] Content area has proper spacing
- [ ] Grids expand to 3-4 column layouts

---

## 10. Error Handling

### 10.1 Not Found Page
- [ ] Navigate to `/nonexistent` — shows custom 404 page
- [ ] 404 page shows book emoji, friendly message, Go Home + Browse Library buttons

### 10.2 Error Page
- [ ] Runtime error triggers error boundary with "Something Went Wrong" page
- [ ] "Try Again" button calls reset
- [ ] "Go Home" link navigates to `/`

### 10.3 API Error Handling
- [ ] API calls with invalid auth return 401
- [ ] Teacher APIs return 403 for student role
- [ ] Missing required fields return 400 with error message
- [ ] Non-existent resources return 404

---

## 11. Multilingual Support

### 11.1 Language Switching
- [ ] Language selector in sidebar shows EN, FR, CN
- [ ] Selecting FR activates French flag highlight
- [ ] Language persists across page navigation (Zustand + localStorage)
- [ ] Language persists after page reload

### 11.2 Content by Language
- [ ] Book library filters books by selected language
- [ ] Battle stories generate in selected language
- [ ] AI stories generate in selected language
- [ ] Silly Sentences loads word pool in selected language
- [ ] TTS uses correct BCP 47 voice tag (en-US, fr-FR, zh-CN)

### 11.3 Chinese Support
- [ ] Switch to CN — shows Chinese books (if seeded)
- [ ] Curriculum matching uses character-level matching (not word boundary)
- [ ] Content safety uses CJK character blocklist

---

## 12. Content Safety

### 12.1 Client-Side Validation
- [ ] Battle builder: entering blocked word in fighter/setting/twist shows warning
- [ ] Blocked words include: violence, profanity, slurs, adult content, scary themes
- [ ] Works for English, French, and Chinese

### 12.2 Server-Side Validation
- [ ] Battle stories API validates matchup fields before generation
- [ ] Blocked content returns 400 error with safety message
- [ ] AI-generated content includes safety constraints in system prompt

---

## 13. API Integration Tests

### 13.1 Reading Sessions API
```
GET  /api/reading-sessions          — Returns student's history (auth required)
POST /api/reading-sessions          — Logs session {bookId, pagesRead, durationSeconds, mode}
```
- [ ] GET returns array sorted by date desc, limited to 20
- [ ] POST creates record and returns 201
- [ ] POST without bookId returns 400

### 13.2 Battle Stories API
```
GET  /api/battle-stories            — Returns student's stories
POST /api/battle-stories            — Generates new story {matchup, language, readingStage}
GET  /api/battle-stories/:id        — Returns single story
GET  /api/battle-stories/:id/votes  — Returns vote counts + user votes
POST /api/battle-stories/:id/votes  — Toggle vote {category}
GET  /api/battle-stories/feed       — Classroom feed {tab, classId}
```
- [ ] Feed only returns stories from same class
- [ ] Vote toggle: first POST adds vote, second POST removes it
- [ ] Vote counts on story update correctly (denormalized)

### 13.3 Curriculum Scores API
```
GET  /api/books/curriculum-scores?wordlistId=X  — Returns score map
POST /api/books/curriculum-scores               — Computes scores {wordlistId}
```
- [ ] POST scans all books, computes coverage percentages
- [ ] Coverage uses word-boundary regex for Latin, character includes for CJK
- [ ] GET returns {bookId: {coveragePct, matchedCount, totalCount, unmatchedWords}}

### 13.4 Student Stats API
```
GET /api/student/stats   — Aggregated XP, level, streaks, activity counts
GET /api/student/badges  — Badge definitions with earned status
```
- [ ] XP calculated correctly from activities (reading, stories, grammar, votes)
- [ ] Level thresholds correct (100, 200, 400, 800...)
- [ ] Streak counts consecutive days with reading sessions
- [ ] Badges earned based on actual activity thresholds

### 13.5 Class Progress API
```
GET /api/classes/:id/progress?period=30d  — Per-student stats for teacher
```
- [ ] Only class owner (teacher) can access
- [ ] Period filter correctly limits date range
- [ ] Returns: classStats, stageDistribution, dailyActivity, students array
- [ ] Each student has: reading, battle, aiStories, silly aggregates

### 13.6 Book Generation API
```
POST /api/books/generate              — SSE batch generation {wordlistId, level, count, emphasizedWords}
POST /api/books/[id]/regenerate       — Regenerate draft {emphasizedWords}
PATCH /api/books/[id]                 — Toggle isDraft {isDraft: boolean}
```
- [ ] POST /generate returns SSE stream with batch_start, book_start, book_done, batch_done events
- [ ] Count validated to 1-5, level validated against enum
- [ ] Teacher can only generate from own lists or public lists
- [ ] Student/parent calling /generate returns 403
- [ ] Generated books saved as isDraft=true with creatorId and sourceWordlistId
- [ ] Coverage scores computed and stored on each book_done
- [ ] Duplicate detection returns duplicate_warning event when matching batch exists
- [ ] allowDuplicate=true bypasses duplicate check
- [ ] POST /regenerate only works on drafts owned by caller (or admin)
- [ ] POST /regenerate replaces title, themes, and pages in place
- [ ] PATCH isDraft=false publishes draft; isDraft=true unpublishes
- [ ] PATCH only allowed for creator (or admin)
- [ ] GET /api/books excludes other teachers' drafts from results
- [ ] GET /api/books/[id] returns 404 for other teachers' drafts
- [ ] POST /api/assignments rejects bookId pointing at a draft

### 13.7 Moderation API
```
GET   /api/moderation?type=all&status=pending  — List content for review
PATCH /api/moderation                          — {id, contentType, action: approve|reject}
```
- [ ] Only teacher/admin can access (403 for students)
- [ ] Approve updates reviewStatus to 'approved'
- [ ] Reject updates reviewStatus to 'rejected'
- [ ] Stats counts are accurate

---

## 14. Performance & Edge Cases

### 14.1 Loading States
- [ ] All pages show spinner/skeleton while data loads
- [ ] Protected layout shows loading.tsx during route transitions
- [ ] Button loading states prevent double-submission

### 14.2 Empty States
- [ ] No reading sessions: "No reading sessions yet" with prompt
- [ ] No assignments: "No assignments right now!" with prompt
- [ ] No badges earned: "No badges earned yet" with encouragement
- [ ] No books matching filter: "No books match your curriculum filter"
- [ ] Empty class: "No students in this class yet"
- [ ] No linked children (parent): "No linked children yet" with explanation

### 14.3 Edge Cases
- [ ] Student with no class enrollment — portal still works (limited features)
- [ ] Book with 1 page — pagination hides Prev/Next appropriately
- [ ] Very long story title — truncates with ellipsis
- [ ] Multiple browser tabs — session stays consistent
- [ ] Rapid clicking — debounced/disabled states prevent duplicates
- [ ] Network error during story generation — shows error, doesn't crash
- [ ] Empty word list — scanning produces 0% coverage for all books

---

## 15. Database Integrity

### 15.1 Foreign Key Relationships
- [ ] Deleting a class doesn't orphan student profiles
- [ ] Reading sessions reference valid book IDs
- [ ] Battle votes reference valid story IDs
- [ ] Parent links reference valid user IDs

### 15.2 Data Consistency
- [ ] Vote counts (denormalized JSONB) match actual battleVotes rows
- [ ] Student totalBooksRead/totalStars match actual session data
- [ ] Remix count on parent story matches actual remix count
- [ ] Curriculum scores match actual book content analysis

---

## Execution Priority

| Priority | Area | Risk Level |
|----------|------|------------|
| P0 | Auth & role-based access | High — security |
| P0 | Content safety validation | High — child safety |
| P1 | Book reader + TTS | High — core feature |
| P1 | Silly Sentences gameplay | High — core feature |
| P1 | Battle story generation | High — core feature |
| P1 | Teacher class management | High — admin flow |
| P1 | Book generation + draft workflow | High — teacher workflow |
| P2 | Curriculum filter + coverage | Medium — teacher workflow |
| P2 | Gamification (XP, badges, streaks) | Medium — engagement |
| P2 | Progress reports | Medium — analytics |
| P2 | Quiz system | Medium — comprehension |
| P3 | Responsive layout | Medium — usability |
| P3 | Parent portal | Low — secondary role |
| P3 | Moderation dashboard | Low — admin workflow |
| P3 | Edge cases & empty states | Low — polish |
