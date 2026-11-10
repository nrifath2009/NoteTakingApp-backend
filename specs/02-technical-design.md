# 02 — Technical Design

Lightweight modular monolith. One Node.js process, one Express app, feature folders. No repository layer, dependency injection, CQRS, or domain events.

## Layout

```text
backend/src/
├── config/           env + mongoose connection
├── modules/
│   ├── auth/         register, login, me
│   ├── users/        user model, admin CRUD, interest aggregation
│   ├── notes/        note model and CRUD
│   └── posts/        post model, public list, $lookup by user
├── middleware/       authenticate, authorize, validate, error-handler
├── utils/            pagination, api response, AppError
├── scripts/          seed admin, createIndexes, explain plans
├── docs/openapi.yaml
├── types/express.d.ts
├── app.ts
└── server.ts
```

Each module that accepts input has a `*.schema.ts` (Zod) next to its routes, controller, and service. That is the only extra file beyond the brief's tree.

## Request flow

1. Route attaches middleware and maps the HTTP verb.
2. `authenticate` (when required) verifies the JWT and loads the user from MongoDB.
3. `authorize(...)` (when required) checks `req.user.role`.
4. `validate(schema)` parses body, params, and query.
5. Controller reads the validated request and calls the service.
6. Service performs business rules and MongoDB operations.
7. Controller sends the standard JSON envelope.
8. Thrown `AppError` and unexpected errors reach `error-handler`.

`server.ts` loads env, connects to MongoDB, then listens. `app.ts` exports `createApp()` so tests can use Supertest without listening.

## Module responsibilities

| Module | Owns |
| --- | --- |
| auth | Registration rules, login, JWT signing, current profile |
| users | User schema and indexes, admin CRUD, last-admin rule, interest aggregation |
| notes | Note schema and indexes, ownership checks, admin list |
| posts | Post schema and indexes, create, public list, user posts `$lookup` |

Auth imports the User model and the password hasher. It does not own admin user management.

Interest analytics and the user-posts lookup each perform one `aggregate` in the service. `authenticate` may still load the caller with `findById` before that service runs. That lookup is required by the JWT rules and is not a second analytics query.

Interest analytics stays in the users module because it aggregates the users collection. Routes:

- `userRoutes` mounted at `/api/admin/users`
- `analyticsRoutes` (same module) mounted at `/api/admin/analytics`
- `noteRoutes` at `/api/notes`
- `adminNoteRoutes` at `/api/admin/notes`
- `postRoutes` at `/api/posts`
- `userPostRoutes` at `/api/users`

## Response envelope

Success, single resource:

```json
{ "success": true, "data": {} }
```

Success, list:

```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

`GET /api/users/:userId/posts` puts author info and the post page inside `data` and still returns top-level `pagination`.

Error:

```json
{ "success": false, "message": "Resource not found", "errors": [] }
```

Delete endpoints return `200` with `{ "success": true, "data": { "id": "..." } }` so every response is JSON.

## Errors

`AppError` carries `statusCode` and `errors`.

| Status | When |
| --- | --- |
| 400 | Zod validation, bad ObjectId |
| 401 | Missing, invalid, or expired JWT; bad login |
| 403 | Authenticated but wrong role |
| 404 | Missing note, user, or note not owned on write |
| 409 | Duplicate email, last admin |
| 500 | Anything else |

Mongo duplicate key `11000` is mapped to 409. Production hides the stack.

## Configuration

`src/config/env.ts` reads and validates environment variables with Zod at startup. Required: `MONGODB_URI`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`. `JWT_SECRET` must be at least 16 characters.

Development connects with `autoIndex: true`. Production uses `autoIndex: false`. `npm run indexes:sync` calls `createIndexes()` and does not drop indexes.

## Frontend

Separate Vite app. It talks only to the HTTP API.

- `src/api/*` — Axios client and resource functions.
- `src/context/AuthContext.tsx` — token in `sessionStorage`, `/auth/me` on load.
- Route guards redirect unauthenticated users to `/login` and non-admins away from `/admin/*`.

## Tooling

- ESM TypeScript (`NodeNext`), run with `tsx`.
- ESLint + Prettier.
- Vitest, Supertest, MongoDB Memory Server.
- Swagger UI at `/api/docs`.

## Assumptions carried from requirements

See `01-requirements.md`. This design does not add a status field, refresh tokens, or a posts UI.
