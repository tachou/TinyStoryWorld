# PRD: SEO & AI Discovery via Public Story Pages

**Project:** Tiny Story World
**Date:** April 2, 2026
**Status:** Approved

---

## 1. Overview

Create a public-facing layer of story pages and a browsable library for search engine and AI discovery. All content is anonymous (no student attribution). The authenticated child experience is untouched — these are separate, read-only routes.

---

## 2. Key Decisions

| Decision | Answer |
|---|---|
| Attribution | **Anonymous** — no student names shown on public pages |
| Book Library preview | **First page only** — remainder requires sign-up |
| Social sharing | **Yes** — students/parents can share story links |
| OG images | **Yes, Phase 1** — auto-generated for social cards |

---

## 3. Public Routes

```
Public (no auth, SSR/ISR)                    Protected (auth, SPA)
────────────────────────                     ────────────────────────
/explore                                     (n/a — new page)
/explore/stories/[slug]                      /battle-stories/[id], /stories/[id]
/explore/books                               /portal/library
/explore/books/[slug]                        /portal/library/read?bookId=...
/sitemap.xml                                 (n/a)
/robots.txt                                  (n/a)
/llms.txt                                    (n/a)
```

---

## 4. Visibility Rules

| Student situation | Default visibility | Can change? |
|---|---|---|
| In a class (has teacher) | `private` — teacher must approve via "Publish to Gallery" | Student can request, teacher approves |
| No class (solo student) | `public` — visible in gallery after generation | Student can toggle to `private` |
| Book Library entries | Always `public` | Platform-managed |

**New DB column:** `visibility TEXT NOT NULL DEFAULT 'private'` on `battle_stories` and `generated_stories` tables. Values: `'public'`, `'private'`, `'unlisted'`.

Logic for setting default on story creation:
```
if (student has a classId in studentProfiles) → 'private'
else → 'public'
```

---

## 5. Page Designs

### 5A. Explore Gallery (`/explore`)

Filterable, paginated gallery of all public stories + books.

**Filters:** Language (EN/FR/ZH) · Type (Battle/AI/Book) · Reading Level · Sort (newest/popular)

**Each card shows:**
- Story title
- First ~100 characters of text
- Language flag · Reading level badge · Type badge (Battle/AI/Book)
- No author name — anonymous

**CTAs:**
- "Create your own story — Sign up free!" (sticky banner or inline)
- "Read this story →" per card

**SEO:**
- `<title>`: "Free Multilingual Stories for Kids | Tiny Story World"
- Schema.org `CollectionPage` + `ItemList`
- `<link rel="alternate" hreflang="...">` per language
- Paginated with `rel="next"` / `rel="prev"`

### 5B. Individual Story Page (`/explore/stories/[slug]`)

Full read-only story, server-side rendered.

**Slug format:** `{slugified-title}-{language}-{short-id}` → e.g. `3-dragons-contre-1-chats-fr-a1b2c3`

**Page content:**
- Intro paragraph: "This is a French battle story written at the beginner reading level on Tiny Story World, a free multilingual learning platform for kids."
- Story title
- Metadata bar: language flag, reading level badge, story type, date
- Full story text — all pages displayed vertically (no pagination, no interactivity)
- **No** TTS, voting, quizzes, or remix — those are logged-in features
- CTA section: "Want to create your own story?" + sign-up button
- "Share this story" buttons (copy link, social share)
- Related stories section (same language + similar level)

**SEO:**
- `<title>`: `"{Title}" — A French Story for Beginner Readers | Tiny Story World`
- Meta description: first 155 chars of story text
- Open Graph: title, description, auto-generated OG image
- Schema.org `CreativeWork` with `inLanguage`, `educationalLevel`, `audience`, `isAccessibleForFree: true`

**If logged-in user visits their own story's public page:** banner "This is your story! [Open in reader →]"

### 5C. Book Browse (`/explore/books`)

Public catalog of the Book Library.

**Each card:** Cover image, title, language, reading level, page count, description

### 5D. Individual Book Page (`/explore/books/[slug]`)

- Book metadata (title, language, level, description, page count)
- **First page text only** as a preview
- "Sign up to read the full book" CTA with sign-up link
- Schema.org `Book` markup
- Related books section

---

## 6. OG Image Generation

Auto-generated images for social sharing (Phase 1).

**For Battle Stories:** Colorful card with story title, fighter emojis from categories, language flag, "Tiny Story World" branding

**For AI Stories:** Card with story title, theme emoji, language flag

**For Books:** Card with book cover (or placeholder), title, language flag

**Implementation:** Next.js `ImageResponse` API (`/api/og?type=battle&title=...&lang=fr`) generating 1200x630 images. Cached via ISR.

---

## 7. Social Sharing

**Share button on:**
- Public story pages (`/explore/stories/[slug]`)
- Authenticated story reader pages (Battle Stories, AI Stories) — "Share" button copies the public URL

**Share options:**
- Copy link to clipboard
- Native Web Share API (mobile)

**The share link always points to the public `/explore/stories/[slug]` URL**, not the authenticated route. If the story is `private`, the share button is hidden.

---

## 8. AI Discovery

| Mechanism | Implementation |
|---|---|
| `robots.txt` | Allow `/explore/*`, disallow `/portal/*`, `/dashboard/*`, `/api/*` |
| `sitemap.xml` | Auto-generated, includes all public stories + books, regenerated daily |
| `llms.txt` | Plain-text site description at root for AI crawlers |
| Schema.org | `WebSite` (homepage), `CollectionPage` (gallery), `CreativeWork`/`ShortStory` (stories), `Book` (library) |
| FAQ content | On `/explore` gallery: "What languages?", "What reading levels?", "How do kids create stories?" — natural language for AI retrieval |
| `hreflang` | Language variants linked across EN/FR/ZH gallery pages |

---

## 9. Content Safety for Public Pages

1. **Generation-time filter** — Already in place (content safety check on Battle Stories)
2. **Teacher approval** — Class students' stories require teacher to mark as public
3. **Report button** — Every public story page has a "Report inappropriate content" link
4. **Moderation queue** — Reported stories go to existing `/dashboard/moderation` for review
5. **Auto-hide** — Stories with N+ reports auto-set to `private` pending review

---

## 10. Implementation Phases

### Phase 1 — Core Public Pages
- Add `visibility` column to `battle_stories` and `generated_stories`
- Set default visibility based on class membership on story creation
- Build `/explore` gallery page (SSR + ISR)
- Build `/explore/stories/[slug]` individual story page
- Build `/explore/books` and `/explore/books/[slug]`
- Slug generation + storage
- `sitemap.xml`, `robots.txt`, `llms.txt`
- Schema.org JSON-LD on all public pages
- OG image generation endpoint
- Social share buttons (copy link + Web Share API)

### Phase 2 — Teacher Approval + Student Controls
- "Publish to Gallery" button in teacher moderation dashboard
- Student visibility toggle (public/private) on their story list
- "Report" button + moderation queue integration
- Auto-hide on N+ reports

### Phase 3 — Growth & Analytics
- Track which stories drive sign-ups (UTM params on CTAs)
- A/B test CTA placements and copy
- FAQ content expansion based on search console data
- Multilingual meta descriptions tuned per language
