# Phone + OTP login — retired, not deleted

These are the panel's original login screens. Administrators now sign in with an
email and a password (`/login`), but the backend's `/auth/send-otp` and
`/auth/verify-otp` are untouched and still serve the Flutter parishioner app and
the e2e harness.

Two things keep these files out of the build:

- a folder whose name starts with `_` is a **private folder** in the App Router,
  so nothing here is routed; and
- the `.disabled` suffix keeps them out of type-checking too. A private folder
  is excluded from routing, *not* from compilation, and these import two
  actions that are now commented out.

To put them back:

1. Move `login-page.tsx.disabled` to `app/(auth)/login/page.tsx`
   (and the email one somewhere else).
2. Move `verify-otp-page.tsx.disabled` to `app/(auth)/verify-otp/page.tsx`.
3. Uncomment `sendOtpAction` and `verifyOtpAction` in
   `src/actions/auth.actions.ts`.
4. Add `/verify-otp` back to `PUBLIC_PATHS` in `proxy.ts`.
