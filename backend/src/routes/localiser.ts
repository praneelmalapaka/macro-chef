import { Router } from 'express';
import { pool } from '../db';

const router = Router();

type LocaliseRequest = {
  ingredients?: string[];
  countryCode?: string;
};

router.post('/ingredients/localise', async (req, res) => {
  try {
    const { ingredients, countryCode } = req.body as LocaliseRequest;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'ingredients must be a non-empty array' });
    }

    if (!countryCode || typeof countryCode !== 'string') {
      return res.status(400).json({ error: 'countryCode is required' });
    }

    const cleanedIngredients = ingredients
      .map((item) => item.trim())
      .filter(Boolean);

    const results = await Promise.all(
      cleanedIngredients.map(async (ingredient) => {
        const { rows } = await pool.query(
          `
          SELECT
            base_ingredient,
            country_code,
            local_name,
            brand_suggestion,
            store_hint,
            notes,
            confidence
          FROM ingredient_localisations
          WHERE LOWER(base_ingredient) = LOWER($1)
            AND UPPER(country_code) = UPPER($2)
          ORDER BY confidence DESC
          LIMIT 1
          `,
          [ingredient, countryCode],
        );

        if (rows.length === 0) {
          return {
            original: ingredient,
            local: ingredient,
            brandSuggestion: null,
            storeHint: null,
            notes: 'No localisation found yet',
            confidence: 0,
            matched: false,
          };
        }

        const match = rows[0];

        return {
          original: ingredient,
          local: match.local_name,
          brandSuggestion: match.brand_suggestion,
          storeHint: match.store_hint,
          notes: match.notes,
          confidence: Number(match.confidence),
          matched: true,
        };
      }),
    );

    return res.json({ results });
  } catch (error) {
    console.error('Failed to localise ingredients:', error);
    return res.status(500).json({ error: 'Failed to localise ingredients' });
  }
});

export default router;