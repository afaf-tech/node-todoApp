# node-todoApp

A small to-do app built with Express 5, MongoDB (Mongoose 9), EJS and vanilla
JavaScript. Originally a Node.js tutorial project, now modernized end to end.

## Features

- Add, complete, edit and delete tasks without reloading the page
- Filter by all / active / done, with live counts and a progress bar
- Clear completed tasks in one action
- Light and dark theme toggle that remembers your choice
- Responsive, keyboard-accessible UI with no frontend framework or jQuery
- REST API with validation and proper HTTP status codes
- Server-rendered page (works before the JavaScript takes over)
- Config through environment variables — no credentials in the source
- Security headers (Helmet), gzip compression and request logging
- NoSQL-injection hardening (`sanitizeFilter` + strict payload validation)
- Integration tests against a real, in-memory MongoDB
- ESLint + Prettier, GitHub Actions CI, Docker support

## Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Runtime  | Node.js >= 20.19                                     |
| Server   | Express 5                                            |
| Database | MongoDB + Mongoose 9                                 |
| Views    | EJS 7                                                |
| Frontend | Vanilla JS (Fetch API) + modern CSS                  |
| Testing  | Node test runner + Supertest + mongodb-memory-server |

## Getting started

### Prerequisites

- Node.js 20.19 or newer
- A MongoDB instance (local, Docker, or Atlas)

### Install and run

```bash
npm install
cp .env.example .env

# Start a local MongoDB with Docker (skip if you already have one)
docker compose up -d mongo

# Development server with auto-restart
npm run dev
```

Open <http://localhost:7000>.

For a production-style run:

```bash
npm start
```

### Run everything with Docker

```bash
docker compose up --build
```

The app is available at <http://localhost:7000> and MongoDB data is kept in the
`mongo-data` volume.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed. Real environment variables
always take precedence over the file.

| Variable      | Default                          | Description               |
| ------------- | -------------------------------- | ------------------------- |
| `NODE_ENV`    | `development`                    | Runtime mode              |
| `PORT`        | `7000`                           | HTTP port                 |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/todo` | MongoDB connection string |

## Scripts

| Command                | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm start`            | Start the server                        |
| `npm run dev`          | Start with `node --watch`               |
| `npm test`             | Run integration tests                   |
| `npm run lint`         | Run ESLint                              |
| `npm run lint:fix`     | Fix lint issues automatically           |
| `npm run format`       | Format with Prettier                    |
| `npm run format:check` | Check formatting without changing files |

## API

Base path: `/api/todos`

| Method   | Path                   | Body                                         | Success |
| -------- | ---------------------- | -------------------------------------------- | ------- |
| `GET`    | `/api/todos`           | —                                            | `200`   |
| `POST`   | `/api/todos`           | `{ "item": "text" }`                         | `201`   |
| `PATCH`  | `/api/todos/:id`       | `{ "completed": true }` or `{ "item": "…" }` | `200`   |
| `DELETE` | `/api/todos/completed` | —                                            | `200`   |
| `DELETE` | `/api/todos/:id`       | —                                            | `204`   |

Errors are returned as JSON, for example:

```json
{
  "error": "Validation failed.",
  "details": ["Todo items cannot exceed 200 characters."]
}
```

### Examples

```bash
curl http://localhost:7000/api/todos

curl -X POST http://localhost:7000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"item":"Buy milk"}'

curl -X PATCH http://localhost:7000/api/todos/<id> \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

curl -X PATCH http://localhost:7000/api/todos/<id> \
  -H 'Content-Type: application/json' \
  -d '{"item":"Buy oat milk"}'

curl -X DELETE http://localhost:7000/api/todos/completed

curl -X DELETE http://localhost:7000/api/todos/<id>
```

`GET /healthz` returns `{ "status": "ok" }` for health checks. The page routes
are `GET /` and the legacy alias `GET /todo`.

## Project structure

```text
src/
  app.js              Express app factory (easy to test)
  server.js           Startup, MongoDB connection, graceful shutdown
  config.js           Environment loading and configuration
  db.js               Mongoose connection helpers
  models/todo.js      Todo schema and JSON serialization
  routes/todos.js     REST API routes
  middleware/errors.js 404 and error handling
views/                EJS templates
public/assets/        CSS and vanilla JS
tests/                Integration tests
```

## Docker

```text
Dockerfile            Production image (non-root user)
docker-compose.yml    App + MongoDB 8 + health checks
```

## A note on security

### Dependencies

The app uses Mongoose 9.12.1. **CVE-2024-53900** (the `$where` search-injection
issue) is fixed in Mongoose 8.8.3, so this version is not affected. Later
Mongoose advisories are also resolved, and `npm audit` reports no known
vulnerabilities.

As defense in depth, Mongoose's `sanitizeFilter` is enabled and the API only
accepts strict primitive payloads (`item` must be a string, `completed` must be
a boolean). Regression tests cover operator-style injection payloads.

### Credentials

The original version of this project contained a hard-coded MongoDB Atlas
connection string. It has been removed and replaced with `MONGODB_URI`.
Because the credential was committed, **rotate that database user's password**.
If the repository is public, consider purging it from history with
[git-filter-repo](https://github.com/newren/git-filter-repo) or BFG Repo-Cleaner.

## License

ISC
