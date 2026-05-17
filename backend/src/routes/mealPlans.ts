import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/meal-plans/:date/shopping-list', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        r.id AS recipe_id,
        r.title,
        r.ingredients
      FROM meal_plans mp
      JOIN recipes r ON r.id = mp.recipe_id
      WHERE mp.user_id = $1
        AND mp.planned_for = $2
      ORDER BY mp.created_at ASC
      `,
      [userId, date],
    );

    const items = rows.flatMap((row) => {
      const ingredients = Array.isArray(row.ingredients)
        ? row.ingredients
        : [];

      return ingredients.map((ingredient: string) => ({
        recipeId: String(row.recipe_id),
        recipeTitle: row.title,
        ingredient,
      }));
    });

    return res.json({ items });
  } catch (error) {
    console.error('Failed to build shopping list:', error);
    return res.status(500).json({ error: 'Failed to build shopping list' });
  }
});

router.get('/meal-plans/:date', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        mp.id,
        mp.meal_type,
        mp.planned_for,
        mp.created_at,
        r.id AS recipe_id,
        r.title,
        r.description,
        r.image_url,
        r.calories
      FROM meal_plans mp
      JOIN recipes r ON r.id = mp.recipe_id
      WHERE mp.user_id = $1
        AND mp.planned_for = $2
      ORDER BY
        CASE mp.meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'dinner' THEN 3
          WHEN 'snack' THEN 4
          ELSE 5
        END,
        mp.created_at ASC
      `,
      [userId, date],
    );

    return res.json({ mealPlans: rows });
  } catch (error) {
    console.error('Failed to load meal plans:', error);
    return res.status(500).json({ error: 'Failed to load meal plans' });
  }
});

router.post('/meal-plans', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { recipeId, mealType, plannedFor } = req.body;

    if (!recipeId || !mealType || !plannedFor) {
      return res.status(400).json({
        error: 'recipeId, mealType, and plannedFor are required',
      });
    }

    const numericRecipeId = Number(recipeId);

    if (!Number.isInteger(numericRecipeId)) {
      return res.status(400).json({
        error: 'recipeId must be a numeric database id',
      });
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({ error: 'Invalid mealType' });
    }

    const recipeCheck = await pool.query(
      `
      SELECT id
      FROM recipes
      WHERE id = $1
      LIMIT 1
      `,
      [numericRecipeId],
    );

    if (recipeCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Recipe not found',
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO meal_plans (user_id, recipe_id, meal_type, planned_for)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [userId, numericRecipeId, mealType, plannedFor],
    );

    return res.status(201).json({ mealPlan: rows[0] });
  } catch (error) {
    console.error('Failed to create meal plan:', error);
    return res.status(500).json({ error: 'Failed to create meal plan' });
  }
});

router.delete('/meal-plans/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
      DELETE FROM meal_plans
      WHERE id = $1
        AND user_id = $2
      `,
      [id, userId],
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete meal plan:', error);
    return res.status(500).json({ error: 'Failed to delete meal plan' });
  }
});

export default router;