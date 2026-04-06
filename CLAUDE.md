@AGENTS.md

---

# Alai Oosai Admin Panel — Developer Reference

## Stack
- **Next.js 16.2.2** (Turbopack), React 19, Tailwind CSS 4
- **TanStack Query v5** — server actions are used as `queryFn` / `mutationFn` (no axios/fetch in client components)
- **Formik** — `useFormik` with inline `validate` function (no Yup)
- **JWT** stored in `admin_token` httpOnly cookie; decoded with `jwt-decode`

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
- Cookie name: `admin_token`
- JWT payload shape: `{ sub, phone, role, name, village_id?, iat, exp }`
- Middleware at `src/middleware.ts` protects all dashboard routes

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

### Villages (`/villages`)
- `GET /villages/:id` — No auth required. Returns `{ _id, name }` directly (NOT in the standard `{ success, data }` format). Use `getVillageNameAction` from `src/actions/villages.actions.ts` which handles this non-standard response.

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
│   └── villages.actions.ts  # getVillageNameAction — handles non-standard villages/:id response
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
