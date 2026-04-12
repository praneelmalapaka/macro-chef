const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Backend running",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({ error: "Database not connected" });
  }
});

app.get("/api/recipes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.title,
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

app.post("/api/recipes", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      title,
      description,
      method,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      calories,
      proteinG,
      carbsG,
      fatG,
      imageUrl,
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
        title, description, method,
        prep_time_minutes, cook_time_minutes, servings,
        calories, protein_g, carbs_g, fat_g, image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id
      `,
      [
        title,
        description || null,
        method,
        prepTimeMinutes || null,
        cookTimeMinutes || null,
        servings || null,
        calories || null,
        proteinG || null,
        carbsG || null,
        fatG || null,
        imageUrl || null,
      ]
    );

    const recipeId = recipeResult.rows[0].id;

    for (const ingredient of ingredients) {
      await client.query(
        `
        INSERT INTO recipe_ingredients (
          recipe_id, name, amount, unit, brand_name, notes
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          recipeId,
          ingredient.name,
          ingredient.amount || null,
          ingredient.unit || null,
          ingredient.brandName || null,
          ingredient.notes || null,
        ]
      );
    }

    if (Array.isArray(tags)) {
      for (const slug of tags) {
        const tagResult = await client.query(
          `SELECT id FROM tags WHERE slug = $1`,
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

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});