import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";
import { AppError } from "../errors";
import { verifyAccessToken, type TokenUser } from "../services/security";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") || "";
    const [, token] = header.split(" ");
    if (!token) throw new AppError(401, "Missing bearer token.");

    const decoded = verifyAccessToken(token);
    const result = await pool.query(
      "SELECT id, username, email, email_verified FROM users WHERE id = $1",
      [decoded.id]
    );
    if (!result.rows.length) throw new AppError(401, "Session user no longer exists.");

    const row = result.rows[0];
    req.user = {
      id: String(row.id),
      username: row.username,
      email: row.email,
      emailVerified: Boolean(row.email_verified)
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Invalid or expired token."));
  }
}

export function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.emailVerified) {
    return next(new AppError(403, "Verify your email before using MacroChef."));
  }
  next();
}
