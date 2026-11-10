# 07 — Test Plan

Runner: Vitest. HTTP: Supertest against `createApp()`. Database: MongoDB Memory Server, started once per file (or shared setup) and disconnected after. `NODE_ENV=test` disables rate limits and enables `autoIndex`.

Helpers create a user or admin by calling the register route (admin via the model or admin API once that exists), then login for a token.

## Authentication

| Case | Expect |
| --- | --- |
| Register with valid body | 201, role `user`, no `passwordHash`, no `accessToken` |
| Register ignores `role: "admin"` | stored role `user` |
| Duplicate email | 409 |
| Email normalized | `Admin@Example.com` stored as `admin@example.com` |
| Stored password is a bcrypt hash | hash `!==` plain text and `bcrypt.compare` succeeds |
| Login success | 200, Bearer token, `sub` equals user id |
| Login bad password | 401, same message as unknown email |
| Missing Authorization | 401 on `/api/auth/me` |
| Malformed JWT | 401 |
| Expired JWT (`exp` in the past) | 401 |
| Wrong audience or issuer | 401 |

## Authorization

| Case | Expect |
| --- | --- |
| User calls `GET /api/admin/users` | 403 |
| User calls `GET /api/admin/notes` | 403 |
| User calls `GET /api/admin/analytics/interests` | 403 |
| User reads another user's note | 404 |
| User updates another user's note | 404 |
| User deletes another user's note | 404 |
| Admin lists notes | includes other users' notes |
| Admin reads any note by id | 200 |
| Admin updates another user's note | 404 and content unchanged |
| Admin deletes another user's note | 404 and note still present |
| Note create ignores body `userId` | saved owner is the caller |

## Pagination

Cover at least notes and one admin list.

| Case | Expect |
| --- | --- |
| No query | `page` 1, `limit` 10 |
| `page=2&limit=2` with 5 rows | 2 items, `total` 5, `totalPages` 3 |
| `page=0`, `page=-1`, `limit=0`, `limit=101`, `page=abc` | 400 |
| No rows | `data: []`, `total` 0, `totalPages` 0 |
| Sort | newer `createdAt` first; equal timestamps break ties by `_id` desc |

## Aggregation — interests

| Case | Expect |
| --- | --- |
| Three users, interests as in the brief example | counts match, sorted by `userCount` desc then `_id` asc |
| User interests `["reading", "reading"]` | that user adds 1 to `reading`, not 2 |
| User with missing/empty interests | no group contributed; request still 200 |
| `page` and `limit` | `$facet` metadata `total` matches group count; page slice is correct |
| Implementation | the analytics service performs one `User.aggregate` and does not call `find`, `distinct`, or a second aggregate. `authenticate` may still load the caller with `findById` before the handler runs |

Spy on `User.aggregate` if needed to assert a single call.

## Aggregation — user posts `$lookup`

| Case | Expect |
| --- | --- |
| User with posts | posts in the page belong to that user; author `name` is present |
| Another user's posts | not included |
| Sort and pagination | newest first, `total` / `totalPages` correct |
| Unknown user id | 404 |
| Known user, no posts | 200, empty posts, `total` 0 |
| Implementation | one `User.aggregate`; pipeline contains `$lookup` on `posts` |

## Indexes

| Case | Expect |
| --- | --- |
| User schema indexes | unique `email`, and `createdAt` + `_id` only (plus default `_id`) |
| Note schema indexes | the two compound indexes from `03`, nothing else |
| Post schema indexes | `userId` compound and `createdAt` compound, nothing else |
| No interests/title/content/name index | keys absent |
| Explain own notes, all notes, all posts | executed plan contains `IXSCAN` or `EXPRESS_IXSCAN` |
| Explain `$lookup` user posts | lookup stage `indexesUsed` includes `userId_1_createdAt_-1__id_-1` and `collectionScans` is 0 |
| Interest pipeline | documented as a full scan; test does not require `IXSCAN` |

Explain tests insert a handful of documents, build indexes, then call `.explain("executionStats")`. Find plans must show `IXSCAN` or `EXPRESS_IXSCAN`. The `$lookup` plan must name the posts `userId` compound index in `indexesUsed`.

## Admin users

| Case | Expect |
| --- | --- |
| Create user | 201, chosen role, hashed password |
| List and get | pagination and 200 |
| Update name, email, interests | 200, password hash unchanged |
| Duplicate email on update | 409 |
| Delete last admin | 409, user remains |
| Demote last admin | 409, role remains `admin` |
| Delete non-last user | 200, their notes and posts are gone |

## Out of test scope

Browser UI, Swagger rendering, load, and the production `autoIndex: false` path. Those are checked manually or by review.
