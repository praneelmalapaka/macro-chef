const express = require("express");
const pool = require("../db");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.title,
        r.user_id,
        r.description,
        r.method,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.servings,
        r.calories,
        r.protein_g,
        r.carbs_g,
        r.fat_g,
        r.image_url,
        r.created_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'name', i.name,
              'amount', i.amount,
              'unit', i.unit,
              'brandName', i.brand_name,
              'notes', i.notes
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS ingredients,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'name', t.name,
              'slug', t.slug,
              'category', t.category
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags
      FROM recipes r
      LEFT JOIN recipe_ingredients i ON r.id = i.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      title,
      description,
      method,
      prepTimeMinutes,
      prep_time_minutes,
      cookTimeMinutes,
      cook_time_minutes,
      servings,
      calories,
      proteinG,
      protein_g,
      carbsG,
      carbs_g,
      fatG,
      fat_g,
      imageUrl,
      image_url,
      ingredients,
      tags,
    } = req.body;

    if (!title || !method || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        error: "title, method, and at least one ingredient are required",
      });
    }

    await client.query("BEGIN");

    const recipeResult = await client.query(
      `
      INSERT INTO recipes (
        user_id,
        title,
        description,
        method,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
      `,
      [
        req.user.id,
        title,
        description || null,
        method,
        prepTimeMinutes ?? prep_time_minutes ?? null,
        cookTimeMinutes ?? cook_time_minutes ?? null,
        servings || null,
        calories || null,
        proteinG ?? protein_g ?? null,
        carbsG ?? carbs_g ?? null,
        fatG ?? fat_g ?? null,
        imageUrl ?? image_url ?? null,
     ]
    );

    const recipeId = recipeResult.rows[0].id;

    for (const ingredient of ingredients) {
      await client.query(
        `
        INSERT INTO recipe_ingredients (
          recipe_id,
          name,
          amount,
          unit,
          brand_name,
          notes
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          recipeId,
          ingredient.name,
          ingredient.amount || null,
          ingredient.unit || null,
          ingredient.brandName || ingredient.brand_name || null,
          ingredient.notes || null,
        ]
      );
    }

    if (Array.isArray(tags)) {
      for (const slug of tags) {
        const tagResult = await client.query(
          "SELECT id FROM tags WHERE slug = $1",
          [slug]
        );

        if (tagResult.rows.length > 0) {
          await client.query(
            `
            INSERT INTO recipe_tags (recipe_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `,
            [recipeId, tagResult.rows[0].id]
          );
        }
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Recipe created successfully",
      recipeId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to create recipe" });
  } finally {
    client.release();
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
    title,
    description,
    method,
    prepTimeMinutes,
    prep_time_minutes,
    cookTimeMinutes,
    cook_time_minutes,
    servings,
    calories,
    proteinG,
    protein_g,
    carbsG,
    carbs_g,
    fatG,
    fat_g,
    imageUrl,
    image_url,
    } = req.body;

    if (!title || !method) {
      return res.status(400).json({
        error: "title and method are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE recipes
      SET
        title = $1,
        description = $2,
        method = $3,
        prep_time_minutes = $4,
        cook_time_minutes = $5,
        servings = $6,
        calories = $7,
        protein_g = $8,
        carbs_g = $9,
        fat_g = $10,
        image_url = $11
      WHERE id = $12 AND user_id = $13
      RETURNING id
      `,
      [
        title,
        description || null,
        method,
        prepTimeMinutes ?? prep_time_minutes ?? null,
        cookTimeMinutes ?? cook_time_minutes ?? null,
        servings || null,
        calories || null,
        proteinG ?? protein_g ?? null,
        carbsG ?? carbs_g ?? null,
        fatG ?? fat_g ?? null,
        imageUrl ?? image_url ?? null,
        id,
        req.user.id,
     ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json({
      message: "Recipe updated successfully",
      recipeId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const ownerCheck = await client.query(
      "SELECT id FROM recipes WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "You can only delete your own recipes" });
    }

    await client.query("DELETE FROM recipe_tags WHERE recipe_id = $1", [id]);
    await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);

    const result = await client.query(
      "DELETE FROM recipes WHERE id = $1 RETURNING id",
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Recipe deleted successfully",
      recipeId: result.rows[0].id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to delete recipe" });
  } finally {
    client.release();
  }
});

module.exports = router;