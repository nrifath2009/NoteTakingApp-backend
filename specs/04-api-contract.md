# 04 — API Contract

Base path `/api`. Authenticated routes require `Authorization: Bearer <token>`.

Safe user:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "user",
  "interests": ["chess"],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

Note and post:

```json
{
  "id": "string",
  "userId": "string",
  "title": "string",
  "content": "string",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

List query (all list endpoints): `page` integer >= 1 (default 1), `limit` integer 1–100 (default 10).

## Auth

### POST /api/auth/register

Public. Body: `name` (1–100), `email`, `password` (strength rule), optional `interests` (max 20 unique strings, each 1–50, stored lowercase).

- 201 `{ success, data: User }`
- 400 validation
- 409 email already registered

`role` in the body is ignored. Stored role is `user`. No token in the response.

### POST /api/auth/login

Public. Body: `email`, `password`.

- 200 `{ success, data: { accessToken, tokenType: "Bearer", expiresIn: "15m", user } }`
- 400 validation
- 401 unknown email or bad password (same message: "Invalid email or password")

### GET /api/auth/me

Authenticated.

- 200 `{ success, data: User }`
- 401

### PUT /api/auth/me

Authenticated. Body: `name`, `email`, `interests`. Role is not accepted.

- 200 `{ success, data: User }`
- 400 validation
- 401
- 409 email already registered

### POST /api/auth/change-password

Authenticated. Body: `currentPassword`, `newPassword` (same strength rule as registration, and different from the current password).

- 200 `{ success, data: { message: "Password changed" } }`
- 400 validation, or the current password does not match
- 401 missing or invalid token

The existing access token stays valid. The stored hash is replaced and is not returned.

## Notes

### POST /api/notes

Authenticated. Body: `title` (1–200), `content` (1–10000).

- 201 `{ success, data: Note }` with `userId` of the caller

### GET /api/notes

Authenticated. Always the caller's notes, newest first.

- 200 list envelope

### GET /api/notes/:id

Authenticated. Owner or admin.

- 200 `{ success, data: Note }`
- 400 bad id
- 404 not found, or not the owner when the caller is not an admin

### PUT /api/notes/:id

Authenticated. Body: `title` and/or `content` (at least one).

Match `{ _id, userId: caller }` for every role.

- 200 `{ success, data: Note }`
- 400 validation
- 404 not owner or missing

### DELETE /api/notes/:id

Authenticated. Same ownership match as update.

- 200 `{ success, data: { id } }`
- 404 not owner or missing

### GET /api/admin/notes

Admin. All notes, newest first.

- 200 list envelope
- 401 / 403

## Admin users

All routes require admin.

### POST /api/admin/users

Body: `name`, `email`, `password`, `role` (`user` | `admin`), optional `interests`.

- 201 user
- 409 duplicate email

### GET /api/admin/users

Paginated, newest first. 200 list envelope.

### GET /api/admin/users/:id

- 200 user
- 404

### PUT /api/admin/users/:id

Body: any of `name`, `email`, `role`, `interests`. At least one. Unknown keys stripped.

- 200 user
- 404 missing
- 409 duplicate email, or demoting the last admin

### DELETE /api/admin/users/:id

Deletes the user and that user's notes and posts.

- 200 `{ success, data: { id } }`
- 404 missing
- 409 last admin

## Analytics

### GET /api/admin/analytics/interests

Admin. One aggregation. Data items: `{ "_id": "<interest>", "userCount": <number> }`.

- 200 list envelope
- Empty collection: `data: []`, `total: 0`

## Posts

### POST /api/posts

Authenticated. Body: `title`, `content` (same limits as notes).

- 201 post

### GET /api/posts

Authenticated. All posts, newest first.

- 200 list envelope

### GET /api/users/:userId/posts

Authenticated. One `User.aggregate` with `$lookup`.

- 200

```json
{
  "success": true,
  "data": {
    "user": { "id": "string", "name": "string" },
    "posts": []
  },
  "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

- 400 bad id
- 404 user does not exist

## Docs

`GET /api/docs` serves Swagger UI. `GET /api/health` returns `{ success: true, data: { status: "ok" } }`.
