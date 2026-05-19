import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  quantity?: string;
  nutriments?: Record<string, unknown>;
  countries_tags?: string[];
  stores?: string;
  stores_tags?: string[];
};

type ProductCandidate = {
  query: string;
  countryCode: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  quantity: string | null;
  stores: string | null;
  storesTags: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
  source: string;
  raw: unknown;
  countryMatch: boolean;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function countryNameFromCode(code: string): string {
  const map: Record<string, string> = {
    AU: 'australia',
    US: 'united-states',
    UK: 'united-kingdom',
    GB: 'united-kingdom',
    NZ: 'new-zealand',
    CA: 'canada',
    IN: 'india',
    JP: 'japan',
    SG: 'singapore',
  };

  return map[code.toUpperCase()] ?? '';
}

function productMatchesCountry(
  product: OpenFoodFactsProduct,
  countryCode: string,
): boolean {
  const targetCountry = countryNameFromCode(countryCode);
  if (!targetCountry) return true;

  const countries = product.countries_tags ?? [];

  return countries.some((country) =>
    String(country).toLowerCase().includes(targetCountry),
  );
}

function parseSearchParams(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const countryCode =
    typeof req.query.countryCode === 'string'
      ? req.query.countryCode.toUpperCase()
      : 'AU';

  const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : null;
  const lng = typeof req.query.lng === 'string' ? Number(req.query.lng) : null;

  return {
    query,
    countryCode,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

function normaliseProduct(
  product: OpenFoodFactsProduct,
  query: string,
  countryCode: string,
): ProductCandidate {
  const nutriments = product.nutriments ?? {};

  return {
    query,
    countryCode,
    barcode: product.code ?? null,
    name: product.product_name || 'Unknown product',
    brand: product.brands || null,
    imageUrl: product.image_url || null,
    quantity: product.quantity || null,
    stores: product.stores || null,
    storesTags: product.stores_tags ?? [],
    calories: Math.round(
      toNumber(
        nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'],
      ),
    ),
    proteinG: toNumber(
      nutriments.proteins_serving ?? nutriments.proteins_100g,
    ),
    carbsG: toNumber(
      nutriments.carbohydrates_serving ?? nutriments.carbohydrates_100g,
    ),
    fatG: toNumber(nutriments.fat_serving ?? nutriments.fat_100g),
    sodiumMg: Math.round(
      toNumber(nutriments.sodium_serving ?? nutriments.sodium_100g) * 1000,
    ),
    source: 'Open Food Facts',
    raw: JSON.parse(JSON.stringify(product)),
    countryMatch: productMatchesCountry(product, countryCode),
  };
}

function queryWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

function productMatchesQuery(product: ProductCandidate, query: string): boolean {
  const words = queryWords(query);

  if (words.length === 0) return true;

  const haystack = [
    product.name,
    product.brand ?? '',
    product.quantity ?? '',
    product.stores ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return words.some((word) => haystack.includes(word));
}

function passesNutritionIntent(product: ProductCandidate, query: string): boolean {
  const lower = query.toLowerCase();

  if (lower.includes('protein')) {
    return product.proteinG >= 8;
  }

  if (lower.includes('low sodium')) {
    return product.sodiumMg <= 300;
  }

  return true;
}

function rankProducts(products: ProductCandidate[]): ProductCandidate[] {
  return [...products]
    .sort((a, b) => {
      if (a.countryMatch !== b.countryMatch) {
        return a.countryMatch ? -1 : 1;
      }

      const proteinDiff = b.proteinG - a.proteinG;
      if (proteinDiff !== 0) return proteinDiff;

      return a.calories - b.calories;
    })
    .slice(0, 10);
}

async function readCachedProducts(query: string, countryCode: string) {
  const cached = await pool.query(
    `
    SELECT
      query,
      country_code,
      barcode,
      name,
      brand,
      image_url,
      quantity,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      sodium_mg,
      source
    FROM product_candidates
    WHERE LOWER(query) = LOWER($1)
      AND UPPER(country_code) = UPPER($2)
      AND created_at > NOW() - INTERVAL '14 days'
    ORDER BY protein_g DESC, calories ASC
    LIMIT 10
    `,
    [query, countryCode],
  );

  return cached.rows.map((row) => ({
    query: row.query,
    countryCode: row.country_code,
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    imageUrl: row.image_url,
    quantity: row.quantity,
    calories: Number(row.calories ?? 0),
    proteinG: Number(row.protein_g ?? 0),
    carbsG: Number(row.carbs_g ?? 0),
    fatG: Number(row.fat_g ?? 0),
    sodiumMg: Number(row.sodium_mg ?? 0),
    source: row.source,
  }));
}

async function fetchOpenFoodFactsProducts(
  query: string,
  countryCode: string,
): Promise<ProductCandidate[]> {
  const fields = [
    'code',
    'product_name',
    'brands',
    'image_url',
    'quantity',
    'nutriments',
    'countries_tags',
    'stores',
    'stores_tags',
  ].join(',');

  const url =
    'https://world.openfoodfacts.org/api/v2/search' +
    `?search_terms=${encodeURIComponent(query)}` +
    '&page_size=10' +
    `&fields=${encodeURIComponent(fields)}`;

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'MacroChef/0.1 (macrochef development)',
    },
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Open Food Facts failed: ${response.status} ${response.statusText} ${details.slice(
        0,
        300,
      )}`,
    );
  }

  const data = await response.json();

  const rawProducts = (data.products ?? []) as OpenFoodFactsProduct[];

  return rawProducts
    .map((product) => normaliseProduct(product, query, countryCode))
    .filter((product) => product.name !== 'Unknown product')
    .filter((product) => productMatchesQuery(product, query))
    .filter((product) => passesNutritionIntent(product, query));
}

async function cacheProducts(products: ProductCandidate[]) {
  for (const { countryMatch, storesTags, ...product } of products) {
    try {
      await pool.query(
        `
        INSERT INTO product_candidates (
          query,
          country_code,
          barcode,
          name,
          brand,
          image_url,
          quantity,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          sodium_mg,
          source,
          raw
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
        `,
        [
          product.query,
          product.countryCode,
          product.barcode,
          product.name,
          product.brand,
          product.imageUrl,
          product.quantity,
          product.calories,
          product.proteinG,
          product.carbsG,
          product.fatG,
          product.sodiumMg,
          product.source,
          JSON.stringify(product.raw ?? {}),
        ],
      );
    } catch (error) {
      console.error('Product candidate cache insert failed:', error);
    }
  }
}

async function logSearchEvent(params: {
  userId: string | number | undefined;
  query: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
  source: string;
  returnedCount: number;
  error?: string | null;
}) {
  try {
    await pool.query(
      `
      INSERT INTO product_search_events (
        user_id,
        query,
        country_code,
        lat,
        lng,
        source,
        returned_count,
        error
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        params.userId ?? null,
        params.query,
        params.countryCode,
        params.lat,
        params.lng,
        params.source,
        params.returnedCount,
        params.error ?? null,
      ],
    );
  } catch (error) {
    console.error('Product search event log failed:', error);
  }
}

function publicProduct(product: ProductCandidate) {
  const { raw, storesTags, countryMatch, ...publicFields } = product;
  return publicFields;
}

router.get('/products/search', requireAuth, async (req, res) => {
  const { query, countryCode, lat, lng } = parseSearchParams(req);

  if (!query) {
    return res.status(400).json({ error: 'q is required' });
  }

  const userId = req.user?.id;

  try {
    const cachedProducts = await readCachedProducts(query, countryCode);

    if (cachedProducts.length > 0) {
      await logSearchEvent({
        userId,
        query,
        countryCode,
        lat,
        lng,
        source: 'cache',
        returnedCount: cachedProducts.length,
      });

      return res.json({
        query,
        countryCode,
        location: lat != null && lng != null ? { lat, lng } : null,
        source: 'cache',
        products: cachedProducts,
      });
    }

    try {
      const fetchedProducts = await fetchOpenFoodFactsProducts(
        query,
        countryCode,
      );

      const rankedProducts = rankProducts(fetchedProducts);

      await cacheProducts(rankedProducts);

      await logSearchEvent({
        userId,
        query,
        countryCode,
        lat,
        lng,
        source: 'open_food_facts',
        returnedCount: rankedProducts.length,
      });

      return res.json({
        query,
        countryCode,
        location: lat != null && lng != null ? { lat, lng } : null,
        source: 'open_food_facts',
        products: rankedProducts.map(publicProduct),
      });
    } catch (providerError) {
      const message =
        providerError instanceof Error
          ? providerError.message
          : String(providerError);

      console.error('Product provider failed:', providerError);

      await logSearchEvent({
        userId,
        query,
        countryCode,
        lat,
        lng,
        source: 'fallback',
        returnedCount: 0,
        error: message,
      });

      return res.json({
        query,
        countryCode,
        location: lat != null && lng != null ? { lat, lng } : null,
        source: 'fallback',
        products: [],
        warning:
          'External product provider is temporarily unavailable. Try again later.',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error('Product search failed full error:', error);

    await logSearchEvent({
      userId,
      query,
      countryCode,
      lat,
      lng,
      source: 'error',
      returnedCount: 0,
      error: message,
    });

    return res.status(500).json({
      error: 'Product search failed',
      details: message,
    });
  }
});

export default router;