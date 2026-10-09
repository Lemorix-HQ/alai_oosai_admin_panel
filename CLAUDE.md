@AGENTS.md

---

# Alai Oosai Admin Panel — Developer Reference

## Stack
- **Next.js 16.2.2** (Turbopack), React 19, Tailwind CSS 4
- **TanStack Query v5** — server actions are used as `queryFn` / `mutationFn` (no axios/fetch in client components)
- **Formik** — `useFormik` with inline `validate` function (no Yup)
- **JWT** stored in an httpOnly cookie named by `AUTH_COOKIE` (`src/session/cookie.ts`); decoded with `jwt-decode`

---

## CRITICAL: Next.js 16 Breaking Changes

### `'use server'` files must use named `async function` exports
Arrow-function exports in `'use server'` files are **NOT allowed** in Next.js 16. Always use:
```ts
// CORRECT
export async function myAction() { ... }

// WRONG — will fail
export const myAction = async () => { ... }
```

### `cookies()` is async
```ts
const cookieStore = await cookies(); // NOT cookies()
```

### No `revalidateTag` in action files
Next.js 16 changed the `revalidateTag` signature. Do NOT use it. Client-side cache invalidation is handled by TanStack Query's `queryClient.invalidateQueries()` in mutation `onSuccess` callbacks.

---

## CRITICAL: Backend ResponseTransformInterceptor

The NestJS backend (`alai_oosai_backend`) wraps **all successful HTTP responses** as:
```json
{ "response": { "success": true, "message": "...", "data": ... } }
```

Error responses from exception filters are **NOT wrapped**:
```json
{ "statusCode": 400, "message": "...", "error": "Bad Request", "path": "...", "timestamp": "..." }
```

The `src/services/api.ts` unwrapper handles this:
- If `'response' in raw` → return `raw.response`
- If `'statusCode' in raw` → map to `{ success: false, message }`

**Never** return raw `res.json()` directly — it will always look like `{ success: undefined }`.

---

## Architecture Rules

### Server actions are the only way to call the backend
All API calls go through `src/services/api.ts` (`getRequest`, `postRequest`, `patchRequest`, `deleteRequest`). This file has `'use server'` at the top. **Never import `patchRequest` / `getRequest` / etc. in a client component** — it will break the server action boundary.

Client components must call server actions from `src/actions/*.actions.ts`.

### Authentication
- Cookie name: `AUTH_COOKIE` from `src/session/cookie.ts` — `admin_token` by default,
  or whatever `AUTH_COOKIE_NAME` is set to. Never hardcode it. Browsers match cookies
  by host and ignore the port, so the test panel on localhost:3401 would otherwise
  share a session with the dev panel on localhost:3001 while their APIs sign tokens
  with different secrets.
- `GET /logout` clears the cookie. The dashboard layout redirects there, not to
  `/login`, when `/auth/me` rejects the token — a Server Component cannot delete a
  cookie, and `/login` with a cookie still set bounces back to `/` and loops.
- JWT payload shape: `{ sub, phone, role, name, parish_id?, iat, exp }`
- Edge auth lives in **`proxy.ts` at the repo root** — Next 16's rename of
  `middleware`. There is no `src/middleware.ts`. It answers only "is there a cookie":
  it does not decode the JWT, because the cookie carries a token rather than a
  permission set and re-deriving one at the edge would put a second, drifting copy of
  the rules in front of the real one.
- **A new public page needs two entries, not one.** `PUBLIC_PATHS` in `proxy.ts` is
  matched by **prefix**, so `/foo` also makes `/foo/anything` public — keep a public
  flow on one route segment with its steps in client state. And `/api/transliterate`
  is inside the proxy matcher and is *not* public, so Tamil typing on an
  unauthenticated page redirects to `/login`. It has never bitten because the four
  existing public pages (`/login`, `/forgot-password`, `/accept-invite`,
  `/reset-password`) all use plain `<input>`. `/family-update` is the first page that
  needed it, and both entries are now in the list.
- **A public page that is also usable while signed in needs a THIRD entry.** `TOKEN_PATHS`
  in `proxy.ts` exempts a path from the "signed in? go to the dashboard" redirect.
  `/accept-invite` and `/reset-password` are there because a link token addresses an
  account rather than whoever is signed in; `/family-update` is there because the
  household's form belongs to whoever is sitting at the machine — typically an Anbiyam
  head's own laptop, signed in as himself, handed to a family. Miss this and the page
  serves 200 to curl and redirects to the dashboard in a real browser.
- `src/services/api.ts` takes an `AuthMode` — `'session'` (default), `'sitting'` or
  `'none'`. The sitting token is the public form's, kept in `SITTING_COOKIE` and scoped to
  `/family-update`. Callers never pass a raw token: cookie handling stays in that one
  file.
- **A component that both staff and the public form use takes an `audience`, not a token.**
  `LookupCombobox` is the one case: `audience="household"` sends it to
  `/self-service/lookups/:kind` with the sitting token instead of `/schools` and friends,
  which need `member.read`. The audience is part of the TanStack Query key — the two routes
  answer with different page sizes and the public one is active-only, so one cache entry
  must not serve both.

---

## Backend API Constraints (verified against NestJS source)

### Events (`/events`)
| Route | Method | Body | Notes |
|-------|--------|------|-------|
| `/events/admin` | GET | query params: `page`, `limit`, `type`, `search` | Requires JWT |
| `/events/:id` | GET | — | Requires JWT |
| `/events` | POST | `multipart/form-data` | Fields: `title`, `description`, `place`, `time`, `conductorName`, `type`, `tags` (repeated key, NOT `tags[]`), `ctaText?`, `image?` (file, max 5MB) |
| `/events/:id` | PATCH | **JSON only** | No `FileInterceptor` — image cannot be updated. Fields: `title?`, `description?`, `place?`, `time?`, `conductorName?`, `type?`, `tags?` (array), `ctaText?` |
| `/events/:id` | DELETE | — | Requires JWT |

**Tags FormData key**: Use repeated `tags` key, NOT `tags[]`:
```ts
tagArr.forEach((tag) => formData.append("tags", tag)); // CORRECT
tagArr.forEach((tag) => formData.append("tags[]", tag)); // WRONG
```

### Announcements (`/announcements`)
| Route | Method | Notes |
|-------|--------|-------|
| `/announcements` | POST | `multipart/form-data`. Fields: `title`, `description`, `time`, `image?`, `video?`, `voiceNote?` |
| `/announcements/admin` | GET | Admin list |

**Missing routes (do not implement):** `GET /:id`, `PATCH /:id`, `DELETE /:id` — these do not exist in the backend. The edit page at `/announcements/[id]/edit` redirects back to `/announcements`.

### Reports (`/reports`)
| Route | Method | Notes |
|-------|--------|-------|
| `/reports` | POST | `multipart/form-data`. Fields: `title`, `description`, `pdf` (file, required, max 20MB) |
| `/reports/admin` | GET | Admin list |
| `/reports/:id` | PATCH | **JSON only**: `{ title?, description? }`. PDF cannot be re-uploaded on edit. |
| `/reports/:id` | DELETE | — |

**Missing route:** `GET /reports/:id` does not exist. The edit page loads from the full admin list and filters by ID client-side.

### Auth (`/auth`)
- `POST /auth/send-otp` — body: `{ phone_number: string }` (**underscore**, not `phone`)
- `POST /auth/verify-otp` — body: `{ phone_number: string, otp: number }` (**`otp` must be a number**, not string — backend uses `@IsNumber()`)

### Users (`/users`)
- `PATCH /users/:id` — JSON body: `{ name: string }`. Uses JWT middleware (not Passport guard).

### Parishes (`/parishes`)
- `GET /parishes/:id` — No auth required. Returns `{ _id, name }` directly (NOT in the standard `{ success, data }` format). Use `getParishNameAction` from `src/actions/parishes.actions.ts` which handles this non-standard response.

---

## File Structure Reference

```
src/
├── services/api.ts          # 'use server' — all fetch logic + ResponseTransformInterceptor unwrapping
├── actions/
│   ├── auth.actions.ts
│   ├── events.actions.ts    # UpdateEventPayload type exported here
│   ├── announcements.actions.ts
│   ├── reports.actions.ts   # UpdateReportPayload type exported here
│   ├── users.actions.ts     # updateUserNameAction
│   └── parishes.actions.ts  # getParishNameAction — handles non-standard parishes/:id response
├── hooks/
│   ├── useEvents.ts         # useAdminEvents, useEvent, useCreateEvent, useUpdateEvent, useDeleteEvent
│   ├── useAnnouncements.ts  # useAdminAnnouncements, useCreateAnnouncement ONLY (no update/delete hooks)
│   └── useReports.ts        # useAdminReports, useCreateReport, useUpdateReport, useDeleteReport (no useReport)
└── types/index.ts           # ApiResponse, Event, Announcement, Report, User, JwtPayload
```

---

## Common Pitfalls

1. **Edit event sends FormData** — `PATCH /events/:id` is JSON-only. Use `UpdateEventPayload` object.
2. **Edit report sends FormData** — `PATCH /reports/:id` is JSON-only. Use `UpdateReportPayload` object.
3. **Announcement delete/edit** — backend has no these routes. Do not add them.
4. **`useReport(id)` hook** — does not exist (no `GET /reports/:id`). Filter from `useAdminReports()` list.
5. **`useAnnouncement`, `useUpdateAnnouncement`, `useDeleteAnnouncement`** — do not exist. Do not recreate.
6. **ProfileForm** — must use `updateUserNameAction` from `src/actions/users.actions.ts`, NOT import `patchRequest` directly.
7. **`requests/new` builds a payload `apply()` cannot read.** `app/(dashboard)/requests/new/page.tsx`
   collapses every change-request type except `add_member` into `payload = { details: "..." }`,
   but the backend's `apply()` reads `family`, `member_id` and `to_anbiyam_id`. An
   `update_details`, `transfer_family` or `mark_deceased` raised from the panel can be
   verified and approved and then fails at the last step. Known issue #7 in
   `docs/planning/PROJECT_TRACKER.md`.

---

## The public family-update form

Moved out of the root `CLAUDE.md` on 6 October 2026 — panel-only, so it belongs
here. The feature as a whole is `docs/architecture/SELF_SERVICE.md`; what each
person sees is `docs/domain/self_service_flow.md`.

**It is a phone page.** Almost every parishioner reaching it is on one, so the
form carries a `.touch-form` scope (`app/globals.css`): **16px inputs**, because
below that iOS Safari zooms the whole page the moment a field is focused and the
reader has to pan back to find the label; 48px field heights and 44px buttons for
thumbs; and labels in sentence case at 13px, because the shared 12px uppercase
`tracking-wider` label pulls Tamil glyphs apart at the joins that carry their
meaning. Verified with nothing overflowing at 360px **or 320px**.

**Do not reuse `components/families/MemberFields.tsx`.** It renders the schooling,
college and work blocks in both of its modes by design, and each is a
`LookupCombobox` hitting a route that needs `member.read` — three 403s on a public
page. `components/self-service/HouseholdMemberFields.tsx` is the narrower set a
household can answer about itself.

**Its Tamil has not been read by a Tamil speaker.** The kinship terms come from
`domain-labels.ts`; the rest — including the fourteen industry names in
`INDUSTRY_TA` — should be checked before this is put in front of a parish.

**A block switched off must send an explicit `null`.** That is the removal, and
`JSON.stringify` drops `undefined`. "Switched on with nothing picked" would
otherwise send the same thing and erase what is on the record, so
`draftActivityError` refuses that submit.
