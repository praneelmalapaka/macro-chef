import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { AppError, asyncHandler } from "../errors";
import { requireAuth, requireVerified } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { canViewFullProfile, findUserByUsername } from "../services/users";

export const logsRouter = Router();

const mealTypes = ["breakfast", "lunch", "dinner", "snack", "other"] as const;
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const logSchema = z.object({
  foodName: z.string().trim().min(1).max(120),
  calories: z.number().int().min(0).max(20000),
  proteinG: z.number().min(0).max(2000).default(0),
  carbsG: z.number().min(0).max(3000).default(0),
  fatG: z.number().min(0).max(2000).default(0),
  servingSize: z.string().trim().max(80).nullable().optional(),
  mealType: z.enum(mealTypes),
  consumedAt: z.string().datetime(),
  notes: z.string().trim().max(500).nullable().optional()
});

const patchLogSchema = logSchema.partial();

logsRouter.get("/", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const date = dateSchema.parse(req.query.date);
  const targetUserId = await resolveReadableLogUser(req.user!.id, req.query.username);
  const result = await pool.query(
    `SELECT * FROM food_logs
     WHERE user_id = $1 AND consumed_at >= $2::date AND consumed_at < ($2::date + INTERVAL '1 day')
     ORDER BY consumed_at DESC, id DESC`,
    [targetUserId, date]
  );
  res.json({ logs: result.rows.map(mapLog) });
}));

logsRouter.get("/summary", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const date = dateSchema.parse(req.query.date);
  const targetUserId = await resolveReadableLogUser(req.user!.id, req.query.username);
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(calories), 0)::int AS calories,
       COALESCE(SUM(protein_g), 0)::float AS protein_g,
       COALESCE(SUM(carbs_g), 0)::float AS carbs_g,
       COALESCE(SUM(fat_g), 0)::float AS fat_g
     FROM food_logs
     WHERE user_id = $1 AND consumed_at >= $2::date AND consumed_at < ($2::date + INTERVAL '1 day')`,
    [targetUserId, date]
  );
  res.json({
    date,
    totalCalories: Number(result.rows[0].calories),
    proteinG: Number(result.rows[0].protein_g),
    carbsG: Number(result.rows[0].carbs_g),
    fatG: Number(result.rows[0].fat_g)
  });
}));

logsRouter.post("/", requireAuth, requireVerified, validateBody(logSchema), asyncHandler(async (req, res) => {
  const payload = req.body;
  const result = await pool.query(
    `INSERT INTO food_logs (
       user_id, food_name, calories, protein_g, carbs_g, fat_g,
       serving_size, meal_type, consumed_at, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      req.user!.id,
      payload.foodName,
      payload.calories,
      payload.proteinG,
      payload.carbsG,
      payload.fatG,
      payload.servingSize || null,
      payload.mealType,
      payload.consumedAt,
      payload.notes || null
    ]
  );
  res.status(201).json({ log: mapLog(result.rows[0]) });
}));

logsRouter.patch("/:id", requireAuth, requireVerified, validateBody(patchLogSchema), asyncHandler(async (req, res) => {
  const existing = await pool.query("SELECT * FROM food_logs WHERE id = $1 AND user_id = $2", [req.params.id, req.user!.id]);
  if (!existing.rows.length) throw new AppError(404, "Food log not found.");
  const merged = { ...mapLog(existing.rows[0]), ...req.body };
  const result = await pool.query(
    `UPDATE food_logs SET
       food_name = $3,
       calories = $4,
       protein_g = $5,
       carbs_g = $6,
       fat_g = $7,
       serving_size = $8,
       meal_type = $9,
       consumed_at = $10,
       notes = $11,
       updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      req.params.id,
      req.user!.id,
      merged.foodName,
      merged.calories,
      merged.proteinG,
      merged.carbsG,
      merged.fatG,
      merged.servingSize || null,
      merged.mealType,
      merged.consumedAt,
      merged.notes || null
    ]
  );
  res.json({ log: mapLog(result.rows[0]) });
}));

logsRouter.delete("/:id", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const result = await pool.query(
    "DELETE FROM food_logs WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, req.user!.id]
  );
  if (!result.rows.length) throw new AppError(404, "Food log not found.");
  res.json({ ok: true });
}));

async function resolveReadableLogUser(viewerId: string, username: unknown) {
  if (!username) return viewerId;
  const target = await findUserByUsername(String(username));
  if (!target || !target.email_verified) throw new AppError(404, "User not found.");
  if (!(await canViewFullProfile(viewerId, target))) throw new AppError(403, "This user's food logs are private.");
  return String(target.id);
}

function mapLog(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    foodName: row.food_name,
    calories: Number(row.calories),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    servingSize: row.serving_size,
    mealType: row.meal_type,
    consumedAt: row.consumed_at instanceof Date ? row.consumed_at.toISOString() : row.consumed_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
