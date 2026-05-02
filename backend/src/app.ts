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
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

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
  app.use("/users", usersRouter);
  app.use("/friends", friendsRouter);
  app.use("/logs", logsRouter);

  app.use(errorHandler);
  return app;
}
