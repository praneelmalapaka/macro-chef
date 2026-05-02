# MacroChef API

TypeScript Express API for the MacroChef Android MVP.

## Local Setup

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Required environment variables:

- `DATABASE_URL`: Neon Postgres connection string. Use `sslmode=require`.
- `DATABASE_SCHEMA`: usually `public`.
- `JWT_SECRET`: long random secret, at least 32 characters.
- `CORS_ORIGIN`: `*` for mobile-only testing or a comma-separated allowlist.
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: Gmail address.
- `SMTP_PASS`: Gmail app password.
- `SMTP_FROM`: Gmail address.
- `SMTP_SKIP_SEND`: `false` in production.

## Render Deployment

Use the included root `render.yaml`, or create a Render Web Service manually:

- Root directory: `backend`
- Build command: `npm ci && npm run build && npm run migrate`
- Start command: `npm start`
- Runtime: Node

Set env vars in Render. Do not commit `.env`.

## API Surface

- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/send-verification`
- `POST /auth/verify-email`
- `POST /auth/forgot-password`
- `GET /profile`
- `PATCH /profile`
- `GET /users/search?q=`
- `GET /users/:username`
- `POST /friends/request`
- `POST /friends/accept`
- `POST /friends/reject`
- `DELETE /friends/:friendId`
- `GET /friends`
- `GET /friends/requests`
- `GET /logs?date=YYYY-MM-DD`
- `POST /logs`
- `PATCH /logs/:id`
- `DELETE /logs/:id`
- `GET /logs/summary?date=YYYY-MM-DD`

## Tests

Tests skip unless a test database is provided:

```bash
TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/macrochef_test?sslmode=require npm test
```
