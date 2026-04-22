# MacroChef

Local fitness recipe app with:

- a premium dark mobile-first UI
- PostgreSQL-backed users, recipes, ingredients, calorie logs, and daily targets
- signup/login, posting recipes, community feed, and calorie tracking

## Run locally

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

- The server auto-runs [schema.sql](/home/vedantt_21/crucible/macro-chef/schema.sql) on startup.
- It also seeds a few demo users and recipes the first time the database is empty.
- New signups, recipes, and calorie logs are stored in PostgreSQL, not IndexedDB.
- New account verification codes are printed to the server terminal for now. That flow is ready to be swapped to SMTP later.
