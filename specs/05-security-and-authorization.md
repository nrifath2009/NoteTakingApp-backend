# 05 — Security and Authorization

## Passwords

- bcryptjs, cost factor 10.
- Hash in the service immediately before `User.create` or before saving a password change. The stored field is `passwordHash`.
- A signed-in user changes their password with the current password and a new one. A wrong current password is 400, not 401, so the client does not treat it as a logged-out session.
- `passwordHash` is `select: false`. Login uses `.select("+passwordHash")`.
- Responses never include `passwordHash`. The model `toJSON` transform removes it and exposes `id` instead of `_id`.
- Login failure uses one message for unknown email and bad password.
- Comparison uses `bcrypt.compare`, not string equality.

Password rule: length >= 8, at least one letter, at least one number.

## JWT

Signed with `JWT_SECRET` using HS256.

| Claim | Value |
| --- | --- |
| sub | user id string |
| iss | `JWT_ISSUER` |
| aud | `JWT_AUDIENCE` |
| iat | issued at (set by the library) |
| exp | `JWT_EXPIRES_IN` (default `15m`) |

The token does not carry `role`. A demotion takes effect on the next request because `authenticate` reloads the user.

## authenticate

1. Require `Authorization: Bearer <token>`. Missing or non-Bearer is 401.
2. `jwt.verify` with algorithms `["HS256"]`, `issuer`, and `audience`. Invalid signature, issuer, audience, or expiry is 401.
3. `sub` must be a 24-hex ObjectId. Otherwise 401.
4. `User.findById(sub)`. Missing user is 401 ("User no longer exists").
5. Set `req.user` to the safe profile (`id`, `name`, `email`, `role`, `interests`).

There is no inactive flag. A deleted user fails step 4.

## authorize

`authorize("admin")` runs after `authenticate`.

- Missing `req.user` is 401 (middleware mis-order).
- Role not in the allowed list is 403.
- A valid user token is not enough to call an admin route.

## Resource ownership

| Action | Rule | Failure |
| --- | --- | --- |
| List own notes | `find({ userId: caller })` | n/a |
| List all notes | admin route only | 403 |
| Read one note | owner, or admin via `findById` | 404 |
| Update or delete note | `findOne({ _id, userId: caller })` for every role | 404 |
| Admin user routes | `authorize("admin")` | 403 |
| Read posts | any authenticated user | 401 if anonymous |
| Create note or post | `userId` from `req.user.id` only | body `userId` ignored |

Update/delete returns 404 for an admin who does not own the note, including when the note exists. That avoids confirming another user's note id.

## Last administrator

Before delete, or before changing `role` from `admin` to `user`:

- If the target is an admin and `countDocuments({ role: "admin" })` is 1, respond 409.
- Creating an additional admin is allowed.

## Transport and headers

- `helmet()` with defaults.
- CORS origin is `FRONTEND_URL`. Methods and the `Authorization` and `Content-Type` headers are allowed. Credentials are not used (no cookies).
- Auth routes (`/api/auth/register`, `/api/auth/login`) are rate limited: 20 requests per 15 minutes per IP. The limiter is skipped when `NODE_ENV=test` so the suite can log in freely. Excess requests receive **429** `{ success: false, message: "Too many requests", errors: [] }`.
- A general limiter of 300 requests per minute applies to `/api`, also skipped in test.

## Validation

Zod schemas reject unexpected types. ObjectId params use a 24-hex pattern. Failed validation is 400 with `errors: [{ path, message }]`.

## Data exposure

- Generic 500 message in production: "Internal server error".
- Development may include the error message, never the password hash or `JWT_SECRET`.
- Stack traces are omitted when `NODE_ENV=production`.

## Browser token

The SPA stores the access token in `sessionStorage` under `accessToken`.

Trade-off: any script running on the origin can read it (XSS). It is not in `localStorage`, so it clears when the tab session ends, and it is not a cookie, so CSRF does not attach it. This is acceptable for the POC and is not a production session design. Passwords are never written to web storage.

## Seed

`ADMIN_EMAIL` and `ADMIN_PASSWORD` come from the environment. The script inserts an admin only when that email is absent. It never updates an existing password. Example values in `.env.example` are placeholders, not real secrets.
