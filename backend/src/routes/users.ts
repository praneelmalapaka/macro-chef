import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { AppError, asyncHandler } from "../errors";
import { requireAuth, requireVerified } from "../middleware/auth";
import { canViewFullProfile, findUserByUsername, mapUser } from "../services/users";

export const usersRouter = Router();

usersRouter.get("/search", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const q = z.string().trim().min(1).max(80).parse(req.query.q || "");
  const result = await pool.query(
    `SELECT id, username, display_name, avatar_url, profile_visibility
     FROM users
     WHERE email_verified = TRUE
       AND (LOWER(username) LIKE LOWER($1) OR LOWER(display_name) LIKE LOWER($1))
     ORDER BY username
     LIMIT 25`,
    [`%${q}%`]
  );
  res.json({
    users: result.rows.map((row) => mapUser({ ...row, bio: "", email_verified: true }, false))
  });
}));

usersRouter.get("/:username", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const user = await findUserByUsername(String(req.params.username));
  if (!user || !user.email_verified) throw new AppError(404, "User not found.");

  const fullProfile = await canViewFullProfile(req.user!.id, user);
  res.json({ user: mapUser(user, fullProfile) });
}));
