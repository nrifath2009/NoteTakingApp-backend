# NoteTakingApp Backend

REST API for the NoteTakingApp client. Built with Node.js, TypeScript, Express, and MongoDB.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB for local application runs; tests use an in-memory MongoDB server

## Setup

```powershell
npm ci
Copy-Item .env.example .env
```

Set the values in `.env` before running the API. Use a unique, strong `JWT_SECRET` and a private admin password.

## Commands

```bash
npm run dev
npm test
npm run build
```

The API listens on port 5000 by default. Swagger UI is available at `/api/docs`.

## Documentation

The OpenAPI definition is in `src/docs/openapi.yaml`. Project requirements, API, database, security, implementation, and test specifications are in `specs/`.
