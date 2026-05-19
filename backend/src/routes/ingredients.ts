import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';
import { resolveIngredient, resolveIngredients } from '../services/ingredientResolver';

const router = Router();

router.get(
  '/ingredients/resolve',
  requireAuth,
  async (req, res) => {
    try {
      const query =
        typeof req.query.q === 'string'
          ? req.query.q.trim().toLowerCase()
          : '';

      const regionCode =
        typeof req.query.regionCode === 'string'
          ? req.query.regionCode.toUpperCase()
          : 'AU';

      if (!query) {
        return res.status(400).json({
          error: 'q is required',
        });
      }

      const ingredientResult = await pool.query(
        `
        SELECT
          i.id,
          i.display_name,
          i.category,
          i.attributes,
          i.nutrition_anchor,
          irn.alias,
          irn.region_code,
          irn.confidence
        FROM ingredient_regional_names irn
        JOIN ingredients i
          ON i.id = irn.ingredient_id
        WHERE LOWER(irn.alias) = LOWER($1)
          AND UPPER(irn.region_code) = UPPER($2)
        ORDER BY irn.confidence DESC
        LIMIT 1
        `,
        [query, regionCode],
      );

      if (ingredientResult.rows.length === 0) {
        return res.status(404).json({
          error: 'No ingredient mapping found',
        });
      }

      const ingredient = ingredientResult.rows[0];

      const substitutesResult = await pool.query(
        `
        SELECT
          s.to_ingredient_id,
          s.fidelity,
          s.context,
          s.notes,
          i.display_name
        FROM ingredient_substitutes s
        JOIN ingredients i
          ON i.id = s.to_ingredient_id
        WHERE s.from_ingredient_id = $1
        `,
        [ingredient.id],
      );

      const functionsResult = await pool.query(
        `
        SELECT
          function,
          strength
        FROM ingredient_functions
        WHERE ingredient_id = $1
        `,
        [ingredient.id],
      );

      const dietaryResult = await pool.query(
        `
        SELECT
          flag,
          is_compatible,
          verified
        FROM ingredient_dietary_flags
        WHERE ingredient_id = $1
        `,
        [ingredient.id],
      );

      return res.json({
        ingredient: {
          id: ingredient.id,
          displayName: ingredient.display_name,
          category: ingredient.category,
          alias: ingredient.alias,
          regionCode: ingredient.region_code,
          confidence: Number(ingredient.confidence),
          attributes: ingredient.attributes,
          nutritionAnchor: ingredient.nutrition_anchor,
        },
        functions: functionsResult.rows,
        substitutes: substitutesResult.rows.map((row) => ({
          ingredientId: row.to_ingredient_id,
          displayName: row.display_name,
          fidelity: row.fidelity,
          context: row.context,
          notes: row.notes,
        })),
        dietaryFlags: dietaryResult.rows,
      });
    } catch (error) {
      console.error('Ingredient resolve failed:', error);

      return res.status(500).json({
        error: 'Ingredient resolve failed',
      });
    }
  },
);

router.post('/ingredients/resolve-batch', requireAuth, async (req, res) => {
  try {
    const ingredients = Array.isArray(req.body.ingredients)
      ? req.body.ingredients
      : [];

    const regionCode =
      typeof req.body.regionCode === 'string'
        ? req.body.regionCode.toUpperCase()
        : 'AU';

    if (ingredients.length === 0) {
      return res.status(400).json({
        error: 'ingredients must be a non-empty array',
      });
    }

    const cleanedIngredients = ingredients
      .filter((item: unknown): item is string => typeof item === 'string')
      .map((item: string) => item.trim())
      .filter(Boolean);

    const resolved = await resolveIngredients(cleanedIngredients, regionCode);

    return res.json({
      regionCode,
      count: resolved.length,
      ingredients: resolved,
    });
  } catch (error) {
    console.error('Batch ingredient resolve failed:', error);

    return res.status(500).json({
      error: 'Batch ingredient resolve failed',
    });
  }
});

router.post('/ingredients/resolve-one', requireAuth, async (req, res) => {
  try {
    const ingredient =
      typeof req.body.ingredient === 'string' ? req.body.ingredient : '';

    const regionCode =
      typeof req.body.regionCode === 'string'
        ? req.body.regionCode.toUpperCase()
        : 'AU';

    if (!ingredient.trim()) {
      return res.status(400).json({
        error: 'ingredient is required',
      });
    }

    const resolved = await resolveIngredient(ingredient, regionCode);

    return res.json(resolved);
  } catch (error) {
    console.error('Ingredient resolve failed:', error);

    return res.status(500).json({
      error: 'Ingredient resolve failed',
    });
  }
});

export default router;