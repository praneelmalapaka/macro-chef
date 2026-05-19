import { pool } from '../db';

export type ResolvedIngredient = {
  rawIngredient: string;
  regionCode: string;
  matched: boolean;
  matchType: 'exact-region-alias' | 'exact-global-alias' | 'fuzzy-alias' | 'none';
  confidence: number;
  ingredient: {
    id: string;
    displayName: string;
    category: string;
    attributes: unknown;
    nutritionAnchor: unknown;
  } | null;
  functions: Array<{
    function: string;
    strength: string;
  }>;
  substitutes: Array<{
    ingredientId: string;
    displayName: string;
    fidelity: string;
    context: string[];
    notes: string | null;
  }>;
  dietaryFlags: Array<{
    flag: string;
    isCompatible: boolean;
    verified: boolean;
  }>;
};

function cleanIngredient(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+([./]\d+)?\b/g, ' ')
    .replace(
      /\b(cups?|tbsp|tablespoons?|tsp|teaspoons?|grams?|g|kg|ml|l|litres?|ounces?|oz|pounds?|lbs?|pinch|dash|slice|slices|can|cans)\b/g,
      ' ',
    )
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadIngredientDetails(ingredientId: string) {
  const [functionsResult, substitutesResult, dietaryResult] = await Promise.all([
    pool.query(
      `
      SELECT
        function,
        strength
      FROM ingredient_functions
      WHERE ingredient_id = $1
      ORDER BY strength ASC, function ASC
      `,
      [ingredientId],
    ),

    pool.query(
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
      ORDER BY
        CASE s.fidelity
          WHEN 'functional' THEN 1
          WHEN 'approximate' THEN 2
          WHEN 'partial' THEN 3
          ELSE 4
        END,
        i.display_name ASC
      `,
      [ingredientId],
    ),

    pool.query(
      `
      SELECT
        flag,
        is_compatible,
        verified
      FROM ingredient_dietary_flags
      WHERE ingredient_id = $1
      ORDER BY flag ASC
      `,
      [ingredientId],
    ),
  ]);

  return {
    functions: functionsResult.rows.map((row) => ({
      function: row.function,
      strength: row.strength,
    })),
    substitutes: substitutesResult.rows.map((row) => ({
      ingredientId: row.to_ingredient_id,
      displayName: row.display_name,
      fidelity: row.fidelity,
      context: row.context ?? [],
      notes: row.notes,
    })),
    dietaryFlags: dietaryResult.rows.map((row) => ({
      flag: row.flag,
      isCompatible: row.is_compatible,
      verified: row.verified,
    })),
  };
}

async function findExactRegionAlias(cleaned: string, regionCode: string) {
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.display_name,
      i.category,
      i.attributes,
      i.nutrition_anchor,
      irn.confidence
    FROM ingredient_regional_names irn
    JOIN ingredients i
      ON i.id = irn.ingredient_id
    WHERE LOWER(irn.alias) = LOWER($1)
      AND UPPER(irn.region_code) = UPPER($2)
    ORDER BY irn.confidence DESC
    LIMIT 1
    `,
    [cleaned, regionCode],
  );

  return result.rows[0] ?? null;
}

async function findExactGlobalAlias(cleaned: string) {
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.display_name,
      i.category,
      i.attributes,
      i.nutrition_anchor,
      irn.confidence
    FROM ingredient_regional_names irn
    JOIN ingredients i
      ON i.id = irn.ingredient_id
    WHERE LOWER(irn.alias) = LOWER($1)
    ORDER BY irn.confidence DESC
    LIMIT 1
    `,
    [cleaned],
  );

  return result.rows[0] ?? null;
}

async function findFuzzyAlias(cleaned: string) {
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.display_name,
      i.category,
      i.attributes,
      i.nutrition_anchor,
      irn.alias,
      irn.confidence
    FROM ingredient_regional_names irn
    JOIN ingredients i
      ON i.id = irn.ingredient_id
    WHERE
      LOWER(irn.alias) LIKE '%' || LOWER($1) || '%'
      OR LOWER($1) LIKE '%' || LOWER(irn.alias) || '%'
    ORDER BY
      LENGTH(irn.alias) ASC,
      irn.confidence DESC
    LIMIT 1
    `,
    [cleaned],
  );

  return result.rows[0] ?? null;
}

function buildResolvedIngredient(params: {
  rawIngredient: string;
  regionCode: string;
  matchType: ResolvedIngredient['matchType'];
  match: any | null;
  details?: Awaited<ReturnType<typeof loadIngredientDetails>>;
}): ResolvedIngredient {
  const { rawIngredient, regionCode, matchType, match, details } = params;

  return {
    rawIngredient,
    regionCode,
    matched: match != null,
    matchType,
    confidence: Number(match?.confidence ?? 0),
    ingredient: match
      ? {
          id: match.id,
          displayName: match.display_name,
          category: match.category,
          attributes: match.attributes,
          nutritionAnchor: match.nutrition_anchor,
        }
      : null,
    functions: details?.functions ?? [],
    substitutes: details?.substitutes ?? [],
    dietaryFlags: details?.dietaryFlags ?? [],
  };
}

export async function resolveIngredient(
  rawIngredient: string,
  regionCode = 'AU',
): Promise<ResolvedIngredient> {
  const cleaned = cleanIngredient(rawIngredient);

  if (!cleaned) {
    return buildResolvedIngredient({
      rawIngredient,
      regionCode,
      matchType: 'none',
      match: null,
    });
  }

  const exactRegion = await findExactRegionAlias(cleaned, regionCode);

  if (exactRegion) {
    const details = await loadIngredientDetails(exactRegion.id);

    return buildResolvedIngredient({
      rawIngredient,
      regionCode,
      matchType: 'exact-region-alias',
      match: exactRegion,
      details,
    });
  }

  const exactGlobal = await findExactGlobalAlias(cleaned);

  if (exactGlobal) {
    const details = await loadIngredientDetails(exactGlobal.id);

    return buildResolvedIngredient({
      rawIngredient,
      regionCode,
      matchType: 'exact-global-alias',
      match: exactGlobal,
      details,
    });
  }

  const fuzzy = await findFuzzyAlias(cleaned);

  if (fuzzy) {
    const details = await loadIngredientDetails(fuzzy.id);

    return buildResolvedIngredient({
      rawIngredient,
      regionCode,
      matchType: 'fuzzy-alias',
      match: fuzzy,
      details,
    });
  }

  return buildResolvedIngredient({
    rawIngredient,
    regionCode,
    matchType: 'none',
    match: null,
  });
}

export async function resolveIngredients(
  ingredients: string[],
  regionCode = 'AU',
): Promise<ResolvedIngredient[]> {
  return Promise.all(
    ingredients.map((ingredient) => resolveIngredient(ingredient, regionCode)),
  );
}