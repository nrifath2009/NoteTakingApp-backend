# 06 — Implementation Plan

Build one phase at a time. After each backend phase, run `npx tsc --noEmit` and the tests that exist. Do not start the frontend until the API tests pass.

## Phase 0 — Specifications

Write `specs/01` through `specs/07`. Check them against the assessment: two roles, ownership, both aggregations, index inventory, pagination, and the endpoint list.

Acceptance: every endpoint in section 10 of the brief appears in `04-api-contract.md`. Every `schema.index()` call appears in `03-database-and-indexes.md` with a query that uses it.

## Phase 1 — Backend scaffold

- `package.json`, TypeScript, ESLint, Prettier, Vitest config.
- `env.ts`, `database.ts`, `AppError`, `api-response`, `pagination`.
- `error-handler`, `validate`, `app.ts`, `server.ts`, health route.
- `.env.example`, `.gitignore`.

Acceptance: `createApp()` boots, `GET /api/health` returns 200, `tsc --noEmit` is clean.

## Phase 2 — Users and auth

- User schema, both indexes, JSON transform.
- Register, login, me.
- `authenticate`, `authorize`.
- Auth rate limit.
- Tests: register, duplicate email, hash stored, login, bad password, missing JWT, invalid JWT, expired JWT, user forbidden from an admin route.

Acceptance: auth tests pass.

## Phase 3 — Notes

- Note schema and both indexes.
- CRUD with the ownership rules in `05-security-and-authorization.md`.
- Admin list at `/api/admin/notes`.
- Tests: user cannot read, update, or delete another user's note; admin can list all and read one; admin cannot update or delete another user's note; pagination defaults, custom page, invalid page, max limit, empty page, totals.

Acceptance: note and pagination tests pass.

## Phase 4 — Admin users

- Admin CRUD.
- Last-admin 409 on delete and demotion.
- Cascade delete of that user's notes and posts.
- Tests for 403, 409, and cascade.

Acceptance: user-admin tests pass.

## Phase 5 — Posts, analytics, indexes

- Post schema and both indexes.
- Create, public list.
- User posts: single aggregate, `$lookup`, `$facet` inside the lookup pipeline, 404 when the user is missing.
- Interest grouping: single aggregate with `$project`, `$unwind`, `$group`, `$sort`, `$facet`.
- `explain-queries.ts` and tests that require `IXSCAN` on own notes, all notes, all posts, and the lookup.
- Schema index declaration test (exact index keys, no extras such as `interests`).

Acceptance: aggregation and index tests pass. Interest route issues one `User.aggregate` call. User posts issues one `User.aggregate` call.

## Phase 6 — Docs and scripts

- `openapi.yaml` and Swagger UI.
- `seed-admin.ts`, `sync-indexes.ts`.
- Root `README.md` covering the 18 documentation points in the brief.

Acceptance: `/api/docs` serves the UI in development. Seed is idempotent.

## Phase 7 — Frontend

- Vite React app, Axios client, auth context, guards, pages listed in `01-requirements.md`, basic CSS.
- Browser check: register, login, note CRUD, admin user CRUD, admin notes, interest analytics.

Acceptance: the flows above work against the running API.

## Order rule

If a later phase changes a contract or an index, update the matching spec in the same change. Do not add endpoints that are absent from `04-api-contract.md`.
