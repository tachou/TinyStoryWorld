# Mini-PRD: Public Word Lists

**Project:** Tiny Story World
**Date:** April 14, 2026
**Status:** Draft
**Author:** Product

---

## 1. Overview

Let a teacher publish any word list they upload as **public**, making it available to every student on the platform — not just students enrolled in that teacher's classes. The teacher controls this per list with a toggle, and can flip it on or off at any time.

---

## 2. Problem

Today, `GET /api/word-lists` for a student returns only:
1. Their own lists, and
2. Lists owned by teachers of classes the student is enrolled in
   (`studentProfiles.classId → classes.teacherId → curriculumWordLists.ownerId`).

Good lists built by one teacher are invisible to students in other classrooms or to students with no class enrollment at all (home learners, trial users, self-guided practice). Teachers who want to share community curriculum currently have no way to do so.

---

## 3. Goals

- A teacher can mark any of their word lists as **Public** from the `/dashboard/word-lists` page.
- Public lists appear in every student's available curriculum, regardless of class enrollment.
- The originating teacher retains full ownership: only they (or an admin) can edit, unpublish, or delete a public list.
- The control is **per list**, not account-wide.

### Non-goals

- Editorial review or moderation workflow (deferred — see §9).
- Forking, cloning, or remixing another teacher's public list.
- Parent-owned lists going public (teacher-only for v1).
- Discovery/search UI for browsing all public lists (deferred).
- Featuring or rating public lists.

---

## 4. Data Model Changes

**Table:** `curriculum_word_lists` (`packages/db/src/schema/curriculum.ts`)

Add one column:

```ts
isPublic: boolean('is_public').notNull().default(false),
```

Notes:
- We already have `isSharedClassList` (for class-wide sharing within a teacher's classes) — `isPublic` is a separate, broader scope (platform-wide) and the two can coexist.
- No new table; the existing `ownerId` / `ownerType` fields already tell us who authored the list.

**Migration:** single `ALTER TABLE … ADD COLUMN is_public boolean NOT NULL DEFAULT false;` — zero-risk for existing rows.

---

## 5. API Changes

### `GET /api/word-lists` (`apps/web/src/app/api/word-lists/route.ts`)

Student branch — currently filters by `ownerId IN (self + teacher ids from enrolled classes)`. Change the `where` clause to also include any list with `isPublic = true`:

```ts
where(
  or(
    inArray(curriculumWordLists.ownerId, ownerIds),
    eq(curriculumWordLists.isPublic, true),
  ),
);
```

Teacher/parent/admin branch — unchanged for v1 (they still see only their own lists on the management page; teachers don't browse other teachers' public lists yet).

### `PATCH /api/word-lists/:id` (new)

Replace or extend the existing `[id]/route.ts` with a PATCH handler that accepts `{ isPublic: boolean }`. Authorization:

- Allowed if `session.user.id === list.ownerId` and role is `teacher` or `admin`.
- Parents cannot set `isPublic = true` (enforced server-side, v1 scope).
- Response returns the updated row.

Keep `DELETE` as-is; deleting a public list is allowed and simply removes it for everyone.

### `POST /api/word-lists`

No change to the create endpoint — new lists default to `isPublic = false`. Teachers must explicitly toggle on.

---

## 6. UI Changes

### Teacher word-list page (`/dashboard/word-lists`)

Inside each expanded list card (the block rendered when `isExpanded === true`), above the POS stats / Delete row, add a visibility control:

```
[●] Public — any student on the platform can use this list
```

- Rendered as a labeled toggle switch (or a pill button like the existing translation toggle on `BookReader`).
- Default state: `off` (matches DB default).
- Toggling sends `PATCH /api/word-lists/:id` with the new value; on success, update the list in local state.
- Show a subtle tooltip: *"Public lists are visible to every student, including those not in your classes."*
- When on, also render a small `Public` badge in the collapsed card header so teachers can see at a glance which lists are shared.

Parents viewing the placeholder `/family/word-lists` page (not yet built) are **not** shown the toggle.

### Student / curriculum selector (`CurriculumSelector` component)

No new surface. Public lists flow through the same selector. Optionally (stretch): prefix public lists with a small globe indicator and the owning teacher's name, e.g. `🌐 Week 5 Vocab — Ms. Chen`. This helps students tell apart class-assigned lists from global ones. Deferred to v1.1 if it adds scope.

---

## 7. Permissions Summary

| Role    | Can toggle `isPublic`? | Sees public lists? |
| ------- | ---------------------- | ------------------ |
| Teacher | Only on lists they own | On their own lists only (v1) |
| Admin   | Yes, any list          | Yes |
| Parent  | No                     | No (scope unchanged) |
| Student | No                     | Yes — merged into their available lists |

---

## 8. Metrics

- Count of lists with `isPublic = true` (growth over time).
- Count of distinct students who select or use a public list owned by a teacher outside their class.
- Adoption ratio: public lists / total teacher lists.

These can be surfaced later on `/dashboard` or `/admin` — no new logging infra needed for v1, we can query the DB directly.

---

## 9. Open Questions / Deferred

- **Moderation.** A public list is visible to all children on the platform. For v1 we assume the small, known teacher cohort self-moderates, but we should add admin unpublish capability and a basic reporting flow before broad rollout.
- **Parent publishing.** Deferred until parent word-list UX is built at `/family/word-lists`.
- **Discovery.** No catalog / search / trending view yet — students only see public lists that already made it into their curriculum selector. If a teacher wants to actively promote a list they share the name out-of-band.
- **Duplicate names.** Two public lists named "Week 5 Vocab" will be confusing. Consider appending the owner's display name in the student selector (see §6 stretch).
- **Versioning.** The `version` column exists but isn't exposed; if a teacher edits a public list in place, every student sees the change instantly. Acceptable for v1.

---

## 10. Rollout

1. Schema migration (`is_public` column).
2. API: `GET` filter update, new `PATCH` handler.
3. Teacher UI: toggle + badge on `/dashboard/word-lists`.
4. QA: log in as student without class enrollment, confirm a teacher's public list appears in the curriculum selector and filters as expected; confirm non-public lists remain invisible.
5. Ship behind no flag — feature is opt-in per list, so default behavior is identical to today.

---

## Key Files Reference

- Schema: `packages/db/src/schema/curriculum.ts`
- API list/create: `apps/web/src/app/api/word-lists/route.ts`
- API per-list: `apps/web/src/app/api/word-lists/[id]/route.ts`
- Teacher UI: `apps/web/src/app/(protected)/dashboard/word-lists/page.tsx`
- Student selector: `apps/web/src/components/CurriculumSelector.tsx`
- Related PRD: `docs/prd-global-curriculum.md`
