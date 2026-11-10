# 01 — Requirements

Interview POC for a secure note-taking application. Scope is the assessment brief only.

## Roles

```ts
type UserRole = "user" | "admin";
```

Public registration always assigns `user`. The request body cannot set `role`.

### User

- Register and log in.
- Create, list, read, update, and delete **own** notes.
- Read own profile (`GET /api/auth/me`).
- Create posts and list public posts.
- Read any user's public posts via `GET /api/users/:userId/posts`.

### Admin

Inherits user capabilities, plus:

- Create, list, read, update, and delete users.
- List every user's notes (`GET /api/admin/notes`).
- Read any individual note (`GET /api/notes/:id`).
- View interest grouping analytics.

Admin visibility does not grant update or delete of another user's notes.

## Functional requirements

### Authentication

- Register with unique email, normalized to lowercase and trimmed.
- Password minimum: 8 characters, at least one letter and one number. Hashed with bcrypt (cost 10) before insert.
- Login looks up the user by email, verifies the hash, and returns a signed JWT.
- JWT claims: `sub` (user id), `iss`, `aud`, `iat`, `exp`. No role, email, or password material.
- Access token lifetime defaults to 15 minutes. No refresh tokens.
- `GET /api/auth/me` returns the current user without `passwordHash`.
- A signed-in user can change their own password with `POST /api/auth/change-password`. The current password must match. The new password uses the same strength rule and is hashed before it is saved.

### Notes

- Full CRUD. `userId` comes from the authenticated user, never from the body.
- `GET /api/notes` returns only the caller's notes, including when the caller is an admin.
- `GET /api/admin/notes` returns notes for all users (admin only).
- `GET /api/notes/:id` returns the note to its owner or to an admin.
- Update and delete match `{ _id, userId: currentUserId }` for every role. A miss is **404**.

### Users (admin)

- Manage `name`, `email`, `role`, and `interests`.
- Create accepts an initial password, which is hashed.
- Updates cannot set `_id`, `passwordHash`, `createdAt`, or `updatedAt`.
- Duplicate email is **409**.
- Deleting or demoting the last remaining admin is **409**.
- Deleting a user also deletes that user's notes and posts.

### Posts

- Authenticated users create posts. `userId` comes from the token.
- Every post is public to any authenticated user. There is no visibility field.
- `GET /api/posts` is a paginated list of all posts.
- `GET /api/users/:userId/posts` uses one aggregation on `User` that includes `$lookup` into `posts`.
- Unknown user id is **404**. A known user with no posts is **200** with an empty page.

### Analytics

- `GET /api/admin/analytics/interests` groups users by interest.
- Exactly one `User.aggregate()` call. Pagination metadata comes from `$facet` in that same pipeline.
- Duplicate interests on one user count once (`$setUnion`). Missing interests are treated as `[]`.

### Pagination

Every list endpoint accepts `page` and `limit`.

- Default page `1`, default limit `10`, maximum limit `100`.
- Non-integers, values below 1, and limits above 100 are **400**.
- `skip = (page - 1) * limit`.
- Sort `{ createdAt: -1, _id: -1 }` except interest groups, which sort `{ userCount: -1, _id: 1 }`.
- Response includes `pagination: { page, limit, total, totalPages }`.

## Non-functional requirements

- Lightweight modular monolith. Business logic lives in services.
- Zod validates bodies, params, and query strings. ObjectIds are validated before use.
- Central error handler. Production responses do not include stacks, hashes, or secrets.
- Helmet, CORS restricted to `FRONTEND_URL`, and rate limiting on auth routes.
- Indexes declared with `schema.index()` and justified by real queries. No index on interests, names, titles, or content.
- Automated tests cover auth, authorization, pagination, both aggregations, and index use.
- Swagger UI documents the API.
- Secrets come from the environment. `.env` is not committed.

## Frontend

Minimal React + Vite client:

- Public: login, register.
- User: notes list, create, edit, delete.
- Admin: users list, create, edit, delete, all notes, interest analytics.
- Axios, auth context, route guards, loading and error states, pagination, basic CSS.
- Access token in `sessionStorage` only. Passwords are never stored in the browser.
- Frontend guards are UX only. The API enforces authorization.

Posts are API-only. The required pages do not include a posts screen.

## Non-goals

Refresh tokens, cursor pagination, post update/delete, note sharing, an `isActive` flag, a UI component library, and a posts UI.

## Assumptions

1. "Inactive user" means the user document no longer exists. The schema has no status field.
2. `GET /api/notes` is always caller-scoped. Cross-user listing is only `GET /api/admin/notes`.
3. Optional `interests` may be sent on public registration and on admin create/update. There is no profile-edit endpoint.
4. Register returns the safe user profile and does not issue a token. Login issues the token.
5. User delete removes that user's notes and posts so admin lists do not show orphans.
6. Public post listing needs its own `{ createdAt: -1, _id: -1 }` index. See `03-database-and-indexes.md`.
7. The project root is this workspace (`backend/`, `frontend/`, `specs/`), not a nested `secure-notes/` directory.
