# MacroChef

Local fitness recipe app with a production-oriented Android MVP lane.

## What Works

- TypeScript Express API for Neon Postgres and Render.
- JWT auth, bcrypt password hashing, Gmail SMTP verification, and resend cooldown.
- Public/private profiles, friend requests, accepted friendships, and privacy-aware profile/log viewing.
- Daily food logs with calorie, protein, carbs, fat, meal type, edit/delete, and summaries.
- Flutter Android MVP using secure token storage and bottom navigation.
- Android release signing scaffolding for a signed `.aab`.

## MVP Structure

- `backend/`: production MVP TypeScript REST API.
- `mobile/`: Flutter Android client.
- `mobile/build/web`: generated Flutter web app served by root `npm run dev` after `npm run web:build`.
- `web-preview/`: legacy dark web preview retained for reference.
- `render.yaml`: Render web service config.
- `PRIVACY_POLICY.md`: starter privacy policy for Play Console testing.
- `index.html`, `server.js`, and `schema.sql`: legacy local web prototype retained for reference.

## Local Website Dev

From the repo root:

```bash
npm run dev
```

This starts the backend if needed and serves the built Flutter website at `http://127.0.0.1:5103`.

If `mobile/build/web` does not exist yet, `npm run dev` builds it first using `http://127.0.0.1:5000` as the API URL. To force a rebuild after Flutter changes:

```bash
FORCE_WEB_BUILD=true npm run dev
```

## Deployable Flutter Web App

The Flutter app can also build as a production static website, matching the app served locally on port `5103`.

```bash
API_BASE_URL=https://your-render-api.onrender.com npm run web:build
npm run web:serve
```

The static output is generated in `mobile/build/web` and can be deployed to any static host. The included `render.yaml` defines a `macrochef-web` static site; set its `API_BASE_URL` environment variable in Render to the deployed API URL, for example `https://macrochef-api.onrender.com`.

## Vercel Deployment

This repo is configured to deploy the Flutter web app to Vercel as a static site. The TypeScript API in `backend/` is still a normal Node web service, so deploy that backend first on Render/Neon or another Node host, then point the Vercel web app at it.

In Vercel:

1. Import the repo with the repo root as the project root.
2. Add `API_BASE_URL` in Project Settings > Environment Variables for Production and Preview, for example `https://macrochef-api.onrender.com`.
3. Deploy. Vercel will use [vercel.json](vercel.json) to run `npm run vercel-build` and publish `mobile/build/web`.

If the Vercel build says `API_BASE_URL is required`, the environment variable is missing from that deployment environment. Deploying the API itself on Vercel would require converting `backend/src/app.ts` into Vercel serverless functions first.

## Backend Local Setup

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Set `DATABASE_URL` to your Neon Postgres connection string and set Gmail SMTP variables in `backend/.env`. Never commit `.env`.

## Flutter Android Setup

Flutter is required locally. This environment did not have Flutter installed, so run these on your Flutter machine:

```bash
cd mobile
flutter clean
flutter pub get
flutter run --dart-define=API_BASE_URL=https://your-render-service.onrender.com
```

## Signed Android App Bundle

```bash
cd mobile/android
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
cp key.properties.example key.properties
```

Edit `mobile/android/key.properties` locally, then:

```bash
cd ..
flutter clean
flutter pub get
flutter build appbundle --release --dart-define=API_BASE_URL=https://your-render-service.onrender.com
```

## Render Deployment

Use `render.yaml`, or configure Render manually:

- API service root directory: `backend`
- API build command: `npm ci && npm run build && npm run migrate`
- API start command: `npm start`
- Web static site build command: `./scripts/build-flutter-web.sh`
- Web static site publish path: `mobile/build/web`
- Environment variables: see `backend/.env.example`

## Play Console Checklist

- Create the app in Google Play Console.
- Upload the signed AAB from `mobile/build/app/outputs/bundle/release/`.
- Fill app access, content rating, target audience, and ads declarations.
- Add a privacy policy URL using `PRIVACY_POLICY.md` content.
- Complete Data safety for account info, profile info, friend relationships, and food/calorie data.
- Choose internal or closed testing, add testers, and submit.
- Production release may require closed testing first depending on developer account type.

## Legacy Web Prototype

### Run Locally

The old root web prototype can still run locally:

1. Make sure PostgreSQL is running locally.
2. Create a database:

```bash
createdb macrochef
```

If you do not have permission to create a database, point `DATABASE_URL` in `.env` at an existing local PostgreSQL database you already own instead.

3. Copy the env file and adjust it if your local Postgres URL differs:

```bash
cp .env.example .env
```

If your local Postgres requires a password, set it in `.env`, for example:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/macrochef
```

If you cannot create a dedicated `macrochef` database, point `DATABASE_URL` at a database you can use and isolate the tables with a schema:

```text
DATABASE_URL=postgresql:///your_existing_database
DATABASE_SCHEMA=macrochef
```

4. Install dependencies:

```bash
npm install
```

5. Start the app:

```bash
npm start
```

6. Open:

```text
http://localhost:5000
```

## Notes

- The server auto-runs [schema.sql](schema.sql) on startup.
- It also seeds a few demo users and recipes the first time the database is empty.
- New signups, recipes, and calorie logs are stored in PostgreSQL, not IndexedDB.
- New account verification codes are printed to the server terminal for now. That flow is ready to be swapped to SMTP later.

## Project Layout

- `server.js` is the app server and API entrypoint.
- `index.html` is the production UI served by the root app.
- `schema.sql` is the canonical database schema.
- `frontend/` and `android-app/` are imported project variants kept in the merge.
