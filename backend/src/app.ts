import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config";
import { pool } from "./db";
import { errorHandler } from "./errors";
import { authRouter } from "./routes/auth";
import { friendsRouter } from "./routes/friends";
import { logsRouter } from "./routes/logs";
import { profileRouter } from "./routes/profile";
import { recipesRouter } from "./routes/recipes";
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MacroChef API</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f1217; color: #f2f5f8; }
    main { max-width: 760px; margin: 0 auto; padding: 48px 20px; }
    .card { background: #171b22; border: 1px solid #303846; border-radius: 18px; padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 34px; }
    p { color: #9ca7b5; line-height: 1.55; }
    a { color: #f5c45e; }
    code { background: #202631; padding: 3px 6px; border-radius: 6px; }
    ul { line-height: 1.9; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>MacroChef API is running</h1>
      <p>This is the backend REST API for the Android app. The Flutter client should point to this server with <code>API_BASE_URL</code>.</p>
      <ul>
        <li><a href="/health">GET /health</a></li>
        <li><code>POST /auth/signup</code></li>
        <li><code>POST /auth/login</code></li>
        <li><code>GET /recipes</code></li>
        <li><code>GET /logs?date=YYYY-MM-DD</code></li>
        <li><code>GET /friends</code></li>
      </ul>
      <p>For Android emulator testing use <code>http://10.0.2.2:5100</code>.</p>
    </div>
  </main>
</body>
</html>`);
  });

  app.get("/health", async (_req, res, next) => {
    try {
      const result = await pool.query("SELECT NOW() AS now");
      res.json({ ok: true, databaseTime: result.rows[0].now });
    } catch (error) {
      next(error);
    }
  });

  app.use("/auth", authRouter);
  app.use("/profile", profileRouter);
  app.use("/recipes", recipesRouter);
  app.use("/users", usersRouter);
  app.use("/friends", friendsRouter);
  app.use("/logs", logsRouter);

  app.use(errorHandler);
  return app;
}
