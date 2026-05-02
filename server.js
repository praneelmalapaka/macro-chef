const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { Pool } = require("pg");

loadEnvFile();

const PORT = Number(process.env.PORT || 5000);
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env and set a Postgres connection string.");
}
const DATABASE_SCHEMA = normalizeDatabaseSchema(process.env.DATABASE_SCHEMA || "");
const parsedDatabaseUrl = new URL(DATABASE_URL);
const databaseUser = decodeURIComponent(parsedDatabaseUrl.username || process.env.PGUSER || process.env.USER || "postgres");
const databasePassword = decodeURIComponent(parsedDatabaseUrl.password || process.env.PGPASSWORD || "");
const databaseHost = parsedDatabaseUrl.hostname || process.env.PGHOST || "/var/run/postgresql";
const databasePort = Number(parsedDatabaseUrl.port || process.env.PGPORT || 5432);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, "") || process.env.PGDATABASE || "macrochef");

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725
};

const GOAL_CALORIE_MULTIPLIERS = {
  lose: 0.85,
  maintain: 1,
  build: 1.1
};

const GOAL_MACRO_SPLITS = {
  lose: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.3 },
  build: { protein: 0.25, carbs: 0.5, fat: 0.25 }
};

const pool = new Pool({
  user: databaseUser,
  password: databasePassword,
  host: databaseHost,
  port: databasePort,
  database: databaseName,
  options: DATABASE_SCHEMA ? "-c search_path=" + DATABASE_SCHEMA : undefined
});

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, databaseTime: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Database unavailable" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const payload = normalizeSignupPayload(req.body || {});
  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  const recommendations = calculateRecommendations(payload);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (
         display_name, username, email, password_hash, is_email_verified
       ) VALUES (
         $1, $2, $3, $4, FALSE
       )
       RETURNING id, display_name, username, email, is_email_verified`,
      [
        payload.displayName,
        payload.username,
        payload.email,
        hashPassword(payload.password)
      ]
    );

    const userId = userResult.rows[0].id;
    await client.query(
      `INSERT INTO user_profiles (
         user_id, age, sex, height_cm, weight_kg, activity_level, goal,
         recommended_calories, maintenance_calories,
         recommended_protein_g, recommended_carbs_g, recommended_fat_g
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12
       )`,
      [
        userId,
        payload.age,
        payload.sex,
        payload.heightCm,
        payload.weightKg,
        payload.activityLevel,
        payload.goal,
        recommendations.recommendedCalories,
        recommendations.maintenanceCalories,
        recommendations.proteinGrams,
        recommendations.carbsGrams,
        recommendations.fatGrams
      ]
    );

    await client.query(
      `INSERT INTO user_settings (user_id, daily_target)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET daily_target = EXCLUDED.daily_target, updated_at = NOW()`,
      [userId, recommendations.recommendedCalories]
    );

    await issueVerificationCode(client, userId, payload.email);
    await client.query("COMMIT");

    res.status(201).json({
      ok: true,
      pendingUserId: String(userId),
      verificationSentTo: payload.email,
      recommendations
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ error: "That email or username is already in use." });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create account." });
  } finally {
    client.release();
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  const userId = Number(req.body && req.body.userId);
  const code = String(req.body && req.body.code || "").trim();

  if (!userId || !code) {
    return res.status(400).json({ error: "User and verification code are required." });
  }

  try {
    const recordResult = await pool.query(
      `SELECT id, code_hash, expires_at
       FROM email_verifications
       WHERE user_id = $1
         AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!recordResult.rows.length) {
      return res.status(400).json({ error: "No verification code is waiting for this account." });
    }

    const record = recordResult.rows[0];
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "That verification code expired. Request a new one." });
    }

    if (hashVerificationCode(code) !== record.code_hash) {
      return res.status(400).json({ error: "Incorrect verification code." });
    }

    await pool.query(
      `UPDATE email_verifications
       SET used_at = NOW()
       WHERE id = $1`,
      [record.id]
    );
    await pool.query(
      `UPDATE users
       SET is_email_verified = TRUE, email_verified_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    res.json({ ok: true, user: await getUserById(userId) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify email." });
  }
});

app.post("/api/auth/resend-code", async (req, res) => {
  const userId = Number(req.body && req.body.userId);
  if (!userId) {
    return res.status(400).json({ error: "User id is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `SELECT id, email, is_email_verified
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Account not found." });
    }

    if (userResult.rows[0].is_email_verified) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "That email is already verified." });
    }

    await issueVerificationCode(client, userId, userResult.rows[0].email);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to resend verification code." });
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  const safeEmail = String(req.body && req.body.email || "").trim().toLowerCase();
  const safePassword = String(req.body && req.body.password || "");

  if (!safeEmail || !safePassword) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      `SELECT id, password_hash, is_email_verified
       FROM users
       WHERE email = $1`,
      [safeEmail]
    );

    if (!result.rows.length || !verifyPassword(safePassword, result.rows[0].password_hash)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!result.rows[0].is_email_verified) {
      return res.status(403).json({
        error: "Verify your email before logging in.",
        pendingUserId: String(result.rows[0].id)
      });
    }

    res.json({ ok: true, user: await getUserById(result.rows[0].id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to log in." });
  }
});

app.get("/api/app-data", async (req, res) => {
  const userId = getRequestedUserId(req);

  try {
    const [recipesResult, logsResult, settingsResult] = await Promise.all([
      pool.query(
        `SELECT
           r.id::text AS id,
           r.user_id::text AS user_id,
           r.title,
           r.caption,
           r.diets,
           r.calories,
           r.protein,
           r.carbs,
           r.fat,
           r.prep_time,
           r.servings,
           r.method,
           r.tone,
           r.likes,
           r.created_at,
           u.display_name,
           u.username,
           COALESCE(
             json_agg(
               json_build_object(
                 'name', ri.name,
                 'amount', ri.amount,
                 'brand', ri.brand
               )
               ORDER BY ri.sort_order
             ) FILTER (WHERE ri.id IS NOT NULL),
             '[]'::json
           ) AS ingredients
         FROM recipes r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
         WHERE u.is_email_verified = TRUE
         GROUP BY r.id, u.id
         ORDER BY r.created_at DESC`
      ),
      userId ? pool.query(
        `SELECT
           id::text AS id,
           recipe_id::text AS recipe_id,
           to_char(date_key, 'YYYY-MM-DD') AS date_key,
           meal_type,
           title,
           calories,
           protein,
           carbs,
           fat,
           created_at
         FROM calorie_logs
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ) : Promise.resolve({ rows: [] }),
      userId ? pool.query(
        `SELECT daily_target
         FROM user_settings
         WHERE user_id = $1`,
        [userId]
      ) : Promise.resolve({ rows: [] })
    ]);

    const recipes = recipesResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      authorName: row.display_name,
      authorHandle: "@" + row.username,
      diets: row.diets || [],
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      prepTime: row.prep_time,
      servings: row.servings,
      ingredients: row.ingredients || [],
      method: row.method,
      tone: row.tone,
      createdAt: row.created_at,
      createdByUser: String(userId || "") === String(row.user_id)
    }));

    const posts = recipesResult.rows.map((row) => ({
      id: "post-" + row.id,
      recipeId: row.id,
      authorName: row.display_name,
      authorHandle: "@" + row.username,
      caption: row.caption,
      likes: row.likes,
      createdAt: row.created_at
    }));

    const logs = logsResult.rows.map((row) => ({
      id: row.id,
      recipeId: row.recipe_id,
      dateKey: row.date_key,
      mealType: row.meal_type,
      title: row.title,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      createdAt: row.created_at
    }));

    res.json({
      currentUser: userId ? await getUserById(userId) : null,
      recipes,
      posts,
      logs,
      dailyTarget: settingsResult.rows[0] ? settingsResult.rows[0].daily_target : DEFAULT_TARGET_FROM_SETTINGS()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load app data." });
  }
});

app.post("/api/recipes", async (req, res) => {
  const userId = getRequestedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to publish a recipe." });
  }

  const user = await getUserById(userId);
  if (!user || !user.isEmailVerified) {
    return res.status(403).json({ error: "Verify your email before publishing recipes." });
  }

  const { title, caption, diets, calories, protein, carbs, fat, prepTime, servings, method, tone, ingredients } = req.body || {};
  if (!title || !caption || !method || !Array.isArray(ingredients) || !ingredients.length || !Number(calories)) {
    return res.status(400).json({ error: "Title, caption, method, calories, and at least one ingredient are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const recipeResult = await client.query(
      `INSERT INTO recipes (
         user_id, title, caption, diets, calories, protein, carbs, fat, prep_time, servings, method, tone, likes
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
       )
       RETURNING id`,
      [
        userId,
        title,
        caption,
        Array.isArray(diets) ? diets : [],
        Number(calories),
        Number(protein || 0),
        Number(carbs || 0),
        Number(fat || 0),
        Number(prepTime || 0),
        Number(servings || 1),
        method,
        tone || "tone-a",
        0
      ]
    );

    const recipeId = recipeResult.rows[0].id;
    for (let index = 0; index < ingredients.length; index += 1) {
      const ingredient = ingredients[index];
      await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, sort_order, name, amount, brand)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          recipeId,
          index,
          ingredient.name,
          ingredient.amount || null,
          ingredient.brand || null
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ok: true, recipeId: String(recipeId) });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to publish recipe." });
  } finally {
    client.release();
  }
});

app.post("/api/logs", async (req, res) => {
  const userId = getRequestedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to save calorie logs." });
  }

  const { recipeId, dateKey, mealType, title, calories, protein, carbs, fat } = req.body || {};
  if (!title || !dateKey || !mealType || !Number(calories)) {
    return res.status(400).json({ error: "Log entries need a title, date, meal type, and calories." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO calorie_logs (
         user_id, recipe_id, date_key, meal_type, title, calories, protein, carbs, fat
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9
       )
       RETURNING id::text AS id`,
      [
        userId,
        recipeId ? Number(recipeId) : null,
        dateKey,
        mealType,
        title,
        Number(calories),
        Number(protein || 0),
        Number(carbs || 0),
        Number(fat || 0)
      ]
    );
    res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save calorie log." });
  }
});

app.delete("/api/logs/:id", async (req, res) => {
  const userId = getRequestedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to remove calorie logs." });
  }

  try {
    await pool.query(
      `DELETE FROM calorie_logs
       WHERE id = $1 AND user_id = $2`,
      [Number(req.params.id), userId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete calorie log." });
  }
});

app.put("/api/settings/target", async (req, res) => {
  const userId = getRequestedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to save your calorie target." });
  }

  const dailyTarget = Number(req.body && req.body.dailyTarget);
  if (!dailyTarget) {
    return res.status(400).json({ error: "A daily target is required." });
  }

  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, daily_target, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET daily_target = EXCLUDED.daily_target, updated_at = NOW()`,
      [userId, dailyTarget]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save daily target." });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

start().catch((error) => {
  console.error("Failed to start MacroChef:", error);
  process.exit(1);
});

async function start() {
  await initializeDatabase();
  await seedIfNeeded();
  app.listen(PORT, () => {
    console.log("MacroChef listening on http://localhost:" + PORT);
  });
}

async function initializeDatabase() {
  if (DATABASE_SCHEMA) {
    await pool.query("CREATE SCHEMA IF NOT EXISTS " + quoteIdentifier(DATABASE_SCHEMA));
  }
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
}

async function seedIfNeeded() {
  const existing = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (existing.rows[0].count > 0) {
    return;
  }

  const seedUsers = [
    { displayName: "Maya Chen", username: "maya.chen", email: "maya@macrochef.local", sex: "female", age: 29, heightCm: 168, weightKg: 66, activityLevel: "moderate", goal: "maintain" },
    { displayName: "Noah Park", username: "noahpark", email: "noah@macrochef.local", sex: "male", age: 31, heightCm: 182, weightKg: 83, activityLevel: "light", goal: "build" },
    { displayName: "Ari Sol", username: "arisol", email: "ari@macrochef.local", sex: "female", age: 27, heightCm: 170, weightKg: 61, activityLevel: "moderate", goal: "maintain" },
    { displayName: "Jules Hart", username: "juleshart", email: "jules@macrochef.local", sex: "male", age: 35, heightCm: 178, weightKg: 88, activityLevel: "light", goal: "lose" },
    { displayName: "Lena Brooks", username: "lena.brooks", email: "lena@macrochef.local", sex: "female", age: 30, heightCm: 172, weightKg: 68, activityLevel: "moderate", goal: "build" }
  ];

  const insertedUsers = [];
  for (const user of seedUsers) {
    const recommendations = calculateRecommendations(user);
    const result = await pool.query(
      `INSERT INTO users (
         display_name, username, email, password_hash, is_email_verified, email_verified_at
       ) VALUES (
         $1, $2, $3, $4, TRUE, NOW()
       )
       RETURNING id, display_name, username, email, is_email_verified`,
      [user.displayName, user.username, user.email, hashPassword("macrochef-demo")]
    );

    const insertedUser = normalizeUserRow({
      ...result.rows[0],
      age: user.age,
      sex: user.sex,
      height_cm: user.heightCm,
      weight_kg: user.weightKg,
      activity_level: user.activityLevel,
      goal: user.goal,
      recommended_calories: recommendations.recommendedCalories,
      maintenance_calories: recommendations.maintenanceCalories,
      recommended_protein_g: recommendations.proteinGrams,
      recommended_carbs_g: recommendations.carbsGrams,
      recommended_fat_g: recommendations.fatGrams
    });

    await pool.query(
      `INSERT INTO user_profiles (
         user_id, age, sex, height_cm, weight_kg, activity_level, goal,
         recommended_calories, maintenance_calories,
         recommended_protein_g, recommended_carbs_g, recommended_fat_g
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12
       )`,
      [
        insertedUser.id,
        user.age,
        user.sex,
        user.heightCm,
        user.weightKg,
        user.activityLevel,
        user.goal,
        recommendations.recommendedCalories,
        recommendations.maintenanceCalories,
        recommendations.proteinGrams,
        recommendations.carbsGrams,
        recommendations.fatGrams
      ]
    );

    await pool.query(
      `INSERT INTO user_settings (user_id, daily_target)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [insertedUser.id, recommendations.recommendedCalories]
    );

    insertedUsers.push(insertedUser);
  }

  const recipes = [
    {
      user: insertedUsers[0],
      title: "Smoked Chili Chicken Bowl",
      caption: "Protein stayed high, cleanup stayed low. This is my fastest lunch prep on upper-body days.",
      diets: ["high-protein", "low-carb"],
      calories: 520,
      protein: 46,
      carbs: 29,
      fat: 19,
      prepTime: 18,
      servings: 2,
      method: "1. Roast the chicken with smoked chili rub.\n2. Cook the rice until tender.\n3. Build the bowl with slaw, rice, and sliced chicken.\n4. Finish with lime and herbs.",
      tone: "tone-a",
      likes: 128,
      ingredients: [
        { name: "Chicken thigh", amount: "240g", brand: "Local butcher" },
        { name: "Black rice", amount: "120g", brand: "Lotus pantry" },
        { name: "Crunch slaw", amount: "2 cups", brand: "Fresh prep" }
      ],
      createdAt: "2026-04-20T08:15:00.000Z"
    },
    {
      user: insertedUsers[1],
      title: "Midnight Oats Reloaded",
      caption: "I wanted something calm and dense before early training. This one lands every time.",
      diets: ["high-protein", "recovery"],
      calories: 430,
      protein: 34,
      carbs: 44,
      fat: 12,
      prepTime: 8,
      servings: 1,
      method: "1. Stir the oats, yogurt, and whey together.\n2. Chill overnight.\n3. Top with berries and sea salt before eating.",
      tone: "tone-b",
      likes: 94,
      ingredients: [
        { name: "Rolled oats", amount: "70g", brand: "Stone mill" },
        { name: "Greek yogurt", amount: "160g", brand: "Farm kitchen" },
        { name: "Whey isolate", amount: "30g", brand: "Peak lab" }
      ],
      createdAt: "2026-04-19T21:10:00.000Z"
    },
    {
      user: insertedUsers[2],
      title: "Sesame Tofu Crunch Wrap",
      caption: "A vegan wrap that still feels athletic. Crunch, heat, and enough carbs to bounce back.",
      diets: ["vegan", "recovery"],
      calories: 480,
      protein: 27,
      carbs: 51,
      fat: 18,
      prepTime: 22,
      servings: 2,
      method: "1. Crisp the tofu in a hot pan.\n2. Warm the wraps.\n3. Fill with tofu, slaw, and sesame dressing.\n4. Toast the wrap seam-side down.",
      tone: "tone-c",
      likes: 77,
      ingredients: [
        { name: "Firm tofu", amount: "280g", brand: "North block" },
        { name: "Whole wheat wraps", amount: "2", brand: "Baker row" },
        { name: "Sesame slaw", amount: "2 cups", brand: "House mix" }
      ],
      createdAt: "2026-04-18T12:20:00.000Z"
    },
    {
      user: insertedUsers[3],
      title: "Steel-Cut Beef Noodle Pot",
      caption: "Cold-weather comfort with macros that still respect the cut.",
      diets: ["keto", "low-carb"],
      calories: 610,
      protein: 49,
      carbs: 17,
      fat: 37,
      prepTime: 28,
      servings: 2,
      method: "1. Brown beef hard for color.\n2. Add mushrooms and aromatics.\n3. Toss through noodles and broth.\n4. Reduce until glossy and rich.",
      tone: "tone-d",
      likes: 51,
      ingredients: [
        { name: "Lean beef strips", amount: "260g", brand: "Butcher cut" },
        { name: "Shirataki noodles", amount: "200g", brand: "Pure root" },
        { name: "Mushrooms", amount: "180g", brand: "Market fresh" }
      ],
      createdAt: "2026-04-17T14:00:00.000Z"
    },
    {
      user: insertedUsers[4],
      title: "Citrus Salmon Recovery Plate",
      caption: "Recovery dinner with enough edge to still feel like a reward.",
      diets: ["high-protein", "recovery"],
      calories: 560,
      protein: 43,
      carbs: 35,
      fat: 24,
      prepTime: 24,
      servings: 2,
      method: "1. Roast potatoes until crisp.\n2. Pan-sear the salmon.\n3. Steam the broccolini.\n4. Finish with citrus dressing and flaky salt.",
      tone: "tone-e",
      likes: 63,
      ingredients: [
        { name: "Salmon fillet", amount: "260g", brand: "Cold water co" },
        { name: "Baby potatoes", amount: "300g", brand: "Golden field" },
        { name: "Broccolini", amount: "1 bunch", brand: "Green house" }
      ],
      createdAt: "2026-04-16T06:15:00.000Z"
    }
  ];

  for (const recipe of recipes) {
    const insertedRecipe = await pool.query(
      `INSERT INTO recipes (
         user_id, title, caption, diets, calories, protein, carbs, fat, prep_time, servings, method, tone, likes, created_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
       )
       RETURNING id`,
      [
        recipe.user.id,
        recipe.title,
        recipe.caption,
        recipe.diets,
        recipe.calories,
        recipe.protein,
        recipe.carbs,
        recipe.fat,
        recipe.prepTime,
        recipe.servings,
        recipe.method,
        recipe.tone,
        recipe.likes,
        recipe.createdAt
      ]
    );

    for (let index = 0; index < recipe.ingredients.length; index += 1) {
      const ingredient = recipe.ingredients[index];
      await pool.query(
        `INSERT INTO recipe_ingredients (recipe_id, sort_order, name, amount, brand)
         VALUES ($1, $2, $3, $4, $5)`,
        [insertedRecipe.rows[0].id, index, ingredient.name, ingredient.amount, ingredient.brand]
      );
    }
  }
}

async function getUserById(id) {
  if (!id) return null;
  const result = await pool.query(
    `SELECT
       u.id,
       u.display_name,
       u.username,
       u.email,
       u.is_email_verified,
       p.age,
       p.sex,
       p.height_cm,
       p.weight_kg,
       p.activity_level,
       p.goal,
       p.recommended_calories,
       p.maintenance_calories,
       p.recommended_protein_g,
       p.recommended_carbs_g,
       p.recommended_fat_g
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] ? normalizeUserRow(result.rows[0]) : null;
}

function getRequestedUserId(req) {
  const raw = req.header("x-user-id");
  const parsed = raw ? Number(raw) : null;
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUserRow(row) {
  return {
    id: String(row.id),
    displayName: row.display_name,
    username: row.username,
    email: row.email,
    isEmailVerified: Boolean(row.is_email_verified),
    profile: row.age ? {
      age: row.age,
      sex: row.sex,
      heightCm: Number(row.height_cm),
      weightKg: Number(row.weight_kg),
      activityLevel: row.activity_level,
      goal: row.goal,
      recommendedCalories: Number(row.recommended_calories),
      maintenanceCalories: Number(row.maintenance_calories),
      proteinGrams: Number(row.recommended_protein_g),
      carbsGrams: Number(row.recommended_carbs_g),
      fatGrams: Number(row.recommended_fat_g)
    } : null
  };
}

function normalizeSignupPayload(input) {
  const payload = {
    displayName: String(input.displayName || "").trim(),
    username: String(input.username || "").trim().toLowerCase(),
    email: String(input.email || "").trim().toLowerCase(),
    password: String(input.password || ""),
    age: Number(input.age),
    sex: String(input.sex || "").trim(),
    heightCm: Number(input.heightCm),
    weightKg: Number(input.weightKg),
    activityLevel: String(input.activityLevel || "").trim(),
    goal: String(input.goal || "").trim()
  };

  if (!payload.displayName || !payload.username || !payload.email || payload.password.length < 6) {
    return { error: "Name, username, email, and a 6+ character password are required." };
  }
  if (!Number.isFinite(payload.age) || payload.age < 18) {
    return { error: "This calculator is currently set up for adults 18 and over." };
  }
  if (!["male", "female"].includes(payload.sex)) {
    return { error: "Select the sex used for the calorie estimate." };
  }
  if (!Number.isFinite(payload.heightCm) || payload.heightCm < 120 || payload.heightCm > 250) {
    return { error: "Enter a valid height in centimeters." };
  }
  if (!Number.isFinite(payload.weightKg) || payload.weightKg < 35 || payload.weightKg > 300) {
    return { error: "Enter a valid weight in kilograms." };
  }
  if (!Object.prototype.hasOwnProperty.call(ACTIVITY_MULTIPLIERS, payload.activityLevel)) {
    return { error: "Choose an activity level." };
  }
  if (!Object.prototype.hasOwnProperty.call(GOAL_CALORIE_MULTIPLIERS, payload.goal)) {
    return { error: "Choose a goal." };
  }

  return payload;
}

function calculateRecommendations(profile) {
  const bmrBase = (9.99 * Number(profile.weightKg)) + (6.25 * Number(profile.heightCm)) - (4.92 * Number(profile.age));
  const restingCalories = profile.sex === "male" ? bmrBase + 5 : bmrBase - 161;
  const maintenanceCalories = Math.round(restingCalories * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
  const recommendedCalories = Math.max(1200, Math.round(maintenanceCalories * GOAL_CALORIE_MULTIPLIERS[profile.goal]));
  const splits = GOAL_MACRO_SPLITS[profile.goal];

  return {
    restingCalories: Math.round(restingCalories),
    maintenanceCalories,
    recommendedCalories,
    proteinGrams: Math.round((recommendedCalories * splits.protein) / 4),
    carbsGrams: Math.round((recommendedCalories * splits.carbs) / 4),
    fatGrams: Math.round((recommendedCalories * splits.fat) / 9)
  };
}

async function issueVerificationCode(client, userId, email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await client.query(
    `UPDATE email_verifications
     SET used_at = NOW()
     WHERE user_id = $1
       AND used_at IS NULL`,
    [userId]
  );

  await client.query(
    `INSERT INTO email_verifications (user_id, code_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, codeHash, expiresAt]
  );

  console.log("[MacroChef] Verification code for " + email + ": " + code + " (valid for 15 minutes)");
}

function hashVerificationCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, storedValue) {
  const [salt, originalHash] = String(storedValue || "").split(":");
  if (!salt || !originalHash) {
    return false;
  }
  const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(derivedHash, "hex"));
}

function DEFAULT_TARGET_FROM_SETTINGS() {
  return 2200;
}

function normalizeDatabaseSchema(value) {
  const schema = String(value || "").trim().toLowerCase();
  if (!schema) {
    return "";
  }
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) {
    throw new Error("DATABASE_SCHEMA must use only letters, numbers, and underscores, and cannot start with a number.");
  }
  return schema;
}

function quoteIdentifier(value) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
