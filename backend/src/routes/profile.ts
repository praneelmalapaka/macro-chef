import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { asyncHandler } from "../errors";
import { requireAuth, requireVerified } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { mapUser } from "../services/users";

export const profileRouter = Router();

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
  dailyCalorieGoal: z.number().int().positive().max(20000).optional(),
  proteinGoal: z.number().int().min(0).max(2000).optional(),
  carbsGoal: z.number().int().min(0).max(3000).optional(),
  fatGoal: z.number().int().min(0).max(2000).optional(),
  profileVisibility: z.enum(["public", "private"]).optional()
});

profileRouter.get("/", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.user!.id]);
  res.json({ user: mapUser(result.rows[0], true) });
}));

profileRouter.patch("/", requireAuth, requireVerified, validateBody(profileSchema), asyncHandler(async (req, res) => {
  const payload = req.body;
  const result = await pool.query(
    `UPDATE users SET
      display_name = COALESCE($2, display_name),
      bio = COALESCE($3, bio),
      avatar_url = COALESCE($4, avatar_url),
      daily_calorie_goal = COALESCE($5, daily_calorie_goal),
      protein_goal = COALESCE($6, protein_goal),
      carbs_goal = COALESCE($7, carbs_goal),
      fat_goal = COALESCE($8, fat_goal),
      profile_visibility = COALESCE($9, profile_visibility),
      updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      req.user!.id,
      payload.displayName,
      payload.bio,
      payload.avatarUrl,
      payload.dailyCalorieGoal,
      payload.proteinGoal,
      payload.carbsGoal,
      payload.fatGoal,
      payload.profileVisibility
    ]
  );
  res.json({ user: mapUser(result.rows[0], true) });
}));
