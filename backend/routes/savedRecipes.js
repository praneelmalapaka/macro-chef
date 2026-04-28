const express = require("express");
const pool = require("../db");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT recipe_id FROM saved_recipes WHERE user_id = $1",
      [req.user.id]
    );

    res.json(result.rows.map(r => r.recipe_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved recipes" });
  }
})

router.post("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    await pool.query(
      `
      INSERT INTO saved_recipes (user_id, recipe_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, recipe_id) DO NOTHING
      `,
      [req.user.id, recipeId]
    );

    res.json({ message: "Saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

router.delete("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    await pool.query(
      "DELETE FROM saved_recipes WHERE user_id = $1 AND recipe_id = $2",
      [req.user.id, recipeId]
    );

    res.json({ message: "Removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove recipe" });
  }
});

module.exports = router;