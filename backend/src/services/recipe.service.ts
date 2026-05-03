import { pool } from "../db";

type RecipeInput = {
  title: string;
  description?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export async function createRecipe(userId: number, data: any) {
  const result = await pool.query(
    `INSERT INTO recipes (user_id, title, description, calories, protein_g, carbs_g, fat_g)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      data.title,
      data.description,
      data.calories,
      data.protein,
      data.carbs,
      data.fat,
    ]
  );
  return result.rows[0];
}

export async function getRecipes() {
  const result = await pool.query(
    `SELECT * FROM recipes ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getRecipeById(id: number) {
  const result = await pool.query(
    `SELECT * FROM recipes WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function updateRecipe(id: number, userId: number, data: RecipeInput) {
  const result = await pool.query(
    `UPDATE recipes
     SET title=$1, description=$2, calories=$3, protein_g=$4, carbs_g=$5, fat_g=$6
     WHERE id=$7 AND user_id=$8
     RETURNING *`,
    [
      data.title,
      data.description,
      data.calories,
      data.protein,
      data.carbs,
      data.fat,
      id,
      userId,
    ]
  );
  return result.rows[0];
}

export async function deleteRecipe(id: number, userId: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM recipes WHERE id=$1 AND user_id=$2`,
    [id, userId]
  );

  return (result.rowCount ?? 0) > 0;
}