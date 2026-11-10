# 03 — Database and Indexes

Three collections. Notes and posts are not embedded in users. References are plain ObjectIds. Mongoose timestamps provide `createdAt` and `updatedAt`.

## users

| Field | Rules |
| --- | --- |
| name | string, trimmed, required |
| email | string, trimmed, lowercase, required |
| passwordHash | string, required, `select: false` |
| role | `"user"` or `"admin"`, default `"user"` |
| interests | string array, default `[]` |

### Indexes

```ts
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1, _id: -1 });
```

- `{ email: 1 }` unique supports login and the duplicate-email constraint. Declared only via `schema.index()`, not a second `unique` on the path.
- `{ createdAt: -1, _id: -1 }` supports the admin user list sort and skip/limit pagination.
- `_id` is indexed by MongoDB. It is not declared again. `authenticate` loads the user with `findById`.

No index on `name` or `interests`.

## notes

| Field | Rules |
| --- | --- |
| userId | ObjectId, required, ref User |
| title | string, required |
| content | string, required |

### Indexes

```ts
noteSchema.index({ userId: 1, createdAt: -1, _id: -1 });
noteSchema.index({ createdAt: -1, _id: -1 });
```

- Leading `userId` serves `GET /api/notes` (`userId` equality, sort `createdAt` desc, `_id` desc, limit). A separate `userId` index would be redundant.
- `{ createdAt: -1, _id: -1 }` serves `GET /api/admin/notes`, which has no user filter.
- Get, update, and delete by `_id` (plus `userId` on writes) use the default `_id` index. The `userId` predicate is applied after the id lookup. That is one document, so an extra index is not justified.

No index on `title` or `content`.

## posts

| Field | Rules |
| --- | --- |
| userId | ObjectId, required, ref User |
| title | string, required |
| content | string, required |

### Indexes

```ts
postSchema.index({ userId: 1, createdAt: -1, _id: -1 });
postSchema.index({ createdAt: -1, _id: -1 });
```

- `{ userId: 1, createdAt: -1, _id: -1 }` supports `$lookup` equality on `userId` and the inner sort/pagination. This is the index required by the assessment.
- `{ createdAt: -1, _id: -1 }` was added after reviewing query patterns. `GET /api/posts` sorts the whole collection by `createdAt` and `_id` and cannot use an index whose first field is `userId`. This mirrors the admin notes index.

The proposed inventory did not include the second posts index. Shipping only the `userId` index would force a collection scan plus in-memory sort on the public list. The second index is the smallest fix.

No index on `title` or `content`.

## Query to index map

| Query | Index |
| --- | --- |
| Login `findOne({ email })` | users `email_1` |
| Admin users, sort createdAt/_id | users `createdAt_-1__id_-1` |
| Own notes, sort createdAt/_id | notes `userId_1_createdAt_-1__id_-1` |
| All notes, sort createdAt/_id | notes `createdAt_-1__id_-1` |
| Note by id | default `_id_` |
| `$lookup` posts by userId + sort | posts `userId_1_createdAt_-1__id_-1` |
| All posts, sort createdAt/_id | posts `createdAt_-1__id_-1` |
| Interest grouping | none (collection scan) |

## Interest grouping has no index

The pipeline has no selective `$match`. It unwinds every user's interests and groups globally. An index on `interests` would not bound this scan and would add write cost. Do not create one.

The post-`$group` sort (`userCount`, `_id`) also cannot use a collection index. `$facet` paginates that grouped result in the same aggregation.

## Index lifecycle

- Development and test: `autoIndex: true` so schemas build indexes on connect.
- Production: `autoIndex: false`.
- `npm run indexes:sync` calls `Model.createIndexes()` for User, Note, and Post. It creates missing indexes only. It does not call `syncIndexes()` and does not drop indexes that are absent from the schema.

## Execution plans

`npm run explain` runs, in development:

- `Note.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(10)`
- `Note.find().sort({ createdAt: -1, _id: -1 }).limit(10)`
- `Post.find().sort({ createdAt: -1, _id: -1 }).limit(10)`
- The user-posts aggregation with `$lookup`

Inspect `winningPlan` for `IXSCAN` or MongoDB 8's `EXPRESS_IXSCAN`, plus `totalKeysExamined`, `totalDocsExamined`, and execution time. `$lookup` explain on MongoDB 8 reports `indexesUsed` and `collectionScans` on the lookup stage instead of a nested `IXSCAN`. The posts compound index name must appear there, with `collectionScans: 0`. Tests assert that. Interest grouping is not expected to be an index scan.
