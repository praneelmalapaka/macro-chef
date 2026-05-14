import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { AppError, asyncHandler } from "../errors";
import { requireAuth, requireVerified } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { mapUser } from "../services/users";

export const recipesRouter = Router();

const recipeVisibilities = ["public", "friends", "private"] as const;
const recipeSorts = ["recent", "popular"] as const;
const recipeFilters = ["all", "public", "friends", "mine", "saved", "liked"] as const;

const tagSchema = z.string().trim().min(1).max(32).transform(normalizeTag);

const recipeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  imageUrl: z.string().trim().url().nullable().optional(),
  ingredients: z.array(z.string().trim().min(1).max(160)).min(1).max(80),
  instructions: z.array(z.string().trim().min(1).max(1000)).min(1).max(80),
  calories: z.number().int().min(0).max(20000),
  tags: z.array(tagSchema).max(16).default([]),
  visibility: z.enum(recipeVisibilities).default("public")
});

const patchRecipeSchema = recipeSchema.partial();
const commentSchema = z.object({ body: z.string().trim().min(1).max(1000) });

recipesRouter.get("/", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const viewerId = req.user!.id;
  const limit = clampNumber(Number(req.query.limit || 20), 1, 40);
  const offset = clampNumber(Number(req.query.offset || 0), 0, 100000);
  const filter = readEnum(req.query.filter, recipeFilters, "all");
  const sort = readEnum(req.query.sort, recipeSorts, "recent");
  const tag = readString(req.query.tag);
  const q = readString(req.query.q);
  const highProtein = readBoolean(req.query.highProtein);
  const lowCalorie = readBoolean(req.query.lowCalorie);

  const args: unknown[] = [viewerId];
  const where = [
    "u.email_verified = TRUE",
    visibleRecipePredicate("$1")
  ];

  if (filter === "public") {
    where.push("r.visibility = 'public'", "u.profile_visibility = 'public'", "r.user_id <> $1");
  } else if (filter === "friends") {
    where.push("r.user_id <> $1", friendshipExists("$1", "r.user_id"));
  } else if (filter === "mine") {
    where.push("r.user_id = $1");
  } else if (filter === "saved") {
    where.push(`EXISTS (SELECT 1 FROM recipe_saves rs WHERE rs.recipe_id = r.id AND rs.user_id = $1)`);
  } else if (filter === "liked") {
    where.push(`EXISTS (SELECT 1 FROM recipe_likes rl WHERE rl.recipe_id = r.id AND rl.user_id = $1)`);
  }

  if (tag) {
    args.push(normalizeTag(tag));
    where.push(`$${args.length} = ANY(r.tags)`);
  }

  if (q) {
    args.push(`%${q}%`);
    where.push(`(r.title ILIKE $${args.length} OR r.description ILIKE $${args.length} OR EXISTS (SELECT 1 FROM unnest(r.tags) AS tag WHERE tag ILIKE $${args.length}))`);
  }

  if (highProtein) where.push(`'high-protein' = ANY(r.tags)`);
  if (lowCalorie) where.push("r.calories <= 500");

  const orderBy = sort === "popular"
    ? "like_count DESC, comment_count DESC, r.created_at DESC, r.id DESC"
    : "r.created_at DESC, r.id DESC";

  args.push(limit, offset);
  const result = await pool.query(
    `${recipeSelect("$1")}
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT $${args.length - 1} OFFSET $${args.length}`,
    args
  );

  res.json({
    recipes: result.rows.map(mapRecipe),
    nextOffset: result.rows.length === limit ? offset + limit : null
  });
}));

recipesRouter.post("/", requireAuth, requireVerified, validateBody(recipeSchema), asyncHandler(async (req, res) => {
  const payload = req.body;
  const result = await pool.query(
    `INSERT INTO recipes (
       user_id, title, description, image_url, ingredients, instructions, calories, tags, visibility
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      req.user!.id,
      payload.title,
      payload.description,
      payload.imageUrl || null,
      payload.ingredients,
      payload.instructions,
      payload.calories,
      uniqueTags(payload.tags),
      payload.visibility
    ]
  );

  const recipe = await loadVisibleRecipe(result.rows[0].id, req.user!.id);
  res.status(201).json({ recipe: mapRecipe(recipe) });
}));

recipesRouter.get("/:id", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = await loadVisibleRecipe(recipeId, req.user!.id);
  if (!recipe) throw new AppError(404, "Recipe not found.");
  res.json({ recipe: mapRecipe(recipe) });
}));

recipesRouter.patch("/:id", requireAuth, requireVerified, validateBody(patchRecipeSchema), asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const existing = await pool.query("SELECT * FROM recipes WHERE id = $1 AND user_id = $2", [recipeId, req.user!.id]);
  if (!existing.rows.length) throw new AppError(404, "Recipe not found.");

  const current = existing.rows[0];
  const payload = req.body;
  await pool.query(
    `UPDATE recipes SET
       title = $3,
       description = $4,
       image_url = $5,
       ingredients = $6,
       instructions = $7,
       calories = $8,
       tags = $9,
       visibility = $10,
       updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [
      recipeId,
      req.user!.id,
      payload.title ?? current.title,
      payload.description ?? current.description,
      payload.imageUrl === undefined ? current.image_url : payload.imageUrl,
      payload.ingredients ?? current.ingredients,
      payload.instructions ?? current.instructions,
      payload.calories ?? Number(current.calories),
      payload.tags === undefined ? current.tags : uniqueTags(payload.tags),
      payload.visibility ?? current.visibility
    ]
  );

  const recipe = await loadVisibleRecipe(recipeId, req.user!.id);
  res.json({ recipe: mapRecipe(recipe) });
}));

recipesRouter.delete("/:id", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const result = await pool.query("DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING id", [recipeId, req.user!.id]);
  if (!result.rows.length) throw new AppError(404, "Recipe not found.");
  res.json({ ok: true });
}));

recipesRouter.post("/:id/like", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = await loadVisibleRecipe(recipeId, req.user!.id);
  if (!recipe) throw new AppError(404, "Recipe not found.");

  const deleted = await pool.query("DELETE FROM recipe_likes WHERE recipe_id = $1 AND user_id = $2 RETURNING recipe_id", [recipeId, req.user!.id]);
  const liked = !deleted.rows.length;
  if (liked) {
    await pool.query(
      "INSERT INTO recipe_likes (recipe_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [recipeId, req.user!.id]
    );
  }

  const updated = await loadVisibleRecipe(recipeId, req.user!.id);
  res.json({ liked, recipe: mapRecipe(updated) });
}));

recipesRouter.post("/:id/save", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = await loadVisibleRecipe(recipeId, req.user!.id);
  if (!recipe) throw new AppError(404, "Recipe not found.");

  const deleted = await pool.query("DELETE FROM recipe_saves WHERE recipe_id = $1 AND user_id = $2 RETURNING recipe_id", [recipeId, req.user!.id]);
  const saved = !deleted.rows.length;
  if (saved) {
    await pool.query(
      "INSERT INTO recipe_saves (recipe_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [recipeId, req.user!.id]
    );
  }

  const updated = await loadVisibleRecipe(recipeId, req.user!.id);
  res.json({ saved, recipe: mapRecipe(updated) });
}));

recipesRouter.get("/:id/comments", requireAuth, requireVerified, asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = await loadVisibleRecipe(recipeId, req.user!.id);
  if (!recipe) throw new AppError(404, "Recipe not found.");

  const comments = await pool.query(
    `SELECT c.*, u.id AS author_id, u.username, u.display_name, u.email, u.email_verified, u.bio, u.avatar_url,
            u.daily_calorie_goal, u.protein_goal, u.carbs_goal, u.fat_goal, u.profile_visibility
     FROM recipe_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.recipe_id = $1
     ORDER BY c.created_at ASC, c.id ASC`,
    [recipeId]
  );
  res.json({ comments: comments.rows.map(mapComment) });
}));

recipesRouter.post("/:id/comments", requireAuth, requireVerified, validateBody(commentSchema), asyncHandler(async (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = await loadVisibleRecipe(recipeId, req.user!.id);
  if (!recipe) throw new AppError(404, "Recipe not found.");

  const result = await pool.query(
    `INSERT INTO recipe_comments (recipe_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [recipeId, req.user!.id, req.body.body]
  );

  const comment = await pool.query(
    `SELECT c.*, u.id AS author_id, u.username, u.display_name, u.email, u.email_verified, u.bio, u.avatar_url,
            u.daily_calorie_goal, u.protein_goal, u.carbs_goal, u.fat_goal, u.profile_visibility
     FROM recipe_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [result.rows[0].id]
  );
  res.status(201).json({ comment: mapComment(comment.rows[0]) });
}));

async function loadVisibleRecipe(recipeId: string | number, viewerId: string | number) {
  const result = await pool.query(
    `${recipeSelect("$1")}
     WHERE r.id = $2 AND u.email_verified = TRUE AND ${visibleRecipePredicate("$1")}
     LIMIT 1`,
    [viewerId, recipeId]
  );
  return result.rows[0] || null;
}

function recipeSelect(viewerParam: string) {
  return `SELECT r.*,
       u.id AS author_id, u.username, u.display_name, u.email, u.email_verified, u.bio, u.avatar_url,
       u.daily_calorie_goal, u.protein_goal, u.carbs_goal, u.fat_goal, u.profile_visibility,
       (SELECT COUNT(*)::int FROM recipe_likes rl WHERE rl.recipe_id = r.id) AS like_count,
       (SELECT COUNT(*)::int FROM recipe_comments rc WHERE rc.recipe_id = r.id) AS comment_count,
       (SELECT COUNT(*)::int FROM recipe_saves rs WHERE rs.recipe_id = r.id) AS save_count,
       EXISTS (SELECT 1 FROM recipe_likes rl WHERE rl.recipe_id = r.id AND rl.user_id = ${viewerParam}) AS liked_by_me,
       EXISTS (SELECT 1 FROM recipe_saves rs WHERE rs.recipe_id = r.id AND rs.user_id = ${viewerParam}) AS saved_by_me
     FROM recipes r
     JOIN users u ON u.id = r.user_id`;
}

function visibleRecipePredicate(viewerParam: string) {
  return `(r.user_id = ${viewerParam}
    OR (u.profile_visibility = 'public' AND r.visibility = 'public')
    OR (r.visibility IN ('public', 'friends') AND ${friendshipExists(viewerParam, "r.user_id")}))`;
}

function friendshipExists(viewerParam: string, authorExpression: string) {
  return `EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_low_id = LEAST(${viewerParam}::bigint, ${authorExpression})
      AND f.user_high_id = GREATEST(${viewerParam}::bigint, ${authorExpression})
  )`;
}

function mapRecipe(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    ingredients: row.ingredients || [],
    instructions: row.instructions || [],
    calories: Number(row.calories),
    tags: row.tags || [],
    visibility: row.visibility,
    author: mapUser({
      id: row.author_id,
      username: row.username,
      display_name: row.display_name,
      email: row.email,
      email_verified: row.email_verified,
      bio: row.bio,
      avatar_url: row.avatar_url,
      daily_calorie_goal: row.daily_calorie_goal,
      protein_goal: row.protein_goal,
      carbs_goal: row.carbs_goal,
      fat_goal: row.fat_goal,
      profile_visibility: row.profile_visibility
    }, false),
    likeCount: Number(row.like_count || 0),
    commentCount: Number(row.comment_count || 0),
    saveCount: Number(row.save_count || 0),
    likedByMe: Boolean(row.liked_by_me),
    savedByMe: Boolean(row.saved_by_me),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapComment(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    recipeId: String(row.recipe_id),
    body: row.body,
    author: mapUser({
      id: row.author_id,
      username: row.username,
      display_name: row.display_name,
      email: row.email,
      email_verified: row.email_verified,
      bio: row.bio,
      avatar_url: row.avatar_url,
      daily_calorie_goal: row.daily_calorie_goal,
      protein_goal: row.protein_goal,
      carbs_goal: row.carbs_goal,
      fat_goal: row.fat_goal,
      profile_visibility: row.profile_visibility
    }, false),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeTag))).slice(0, 16);
}

function readString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
}

function readBoolean(value: unknown) {
  return readString(value) === "true";
}

function readEnum<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  const stringValue = readString(value);
  return values.includes(stringValue) ? stringValue as T[number] : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
