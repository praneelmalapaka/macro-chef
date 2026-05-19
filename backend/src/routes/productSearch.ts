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

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function countryNameFromCode(code: string) {
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
) {
  const targetCountry = countryNameFromCode(countryCode);

  if (!targetCountry) return true;

  const countries = product.countries_tags ?? [];

  return countries.some((country) =>
    String(country).toLowerCase().includes(targetCountry),
  );
}

function normaliseProduct(
  product: OpenFoodFactsProduct,
  query: string,
  countryCode: string,
) {
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
    fatG: toNumber(
      nutriments.fat_serving ?? nutriments.fat_100g,
    ),
    sodiumMg: Math.round(
      toNumber(
        nutriments.sodium_serving ?? nutriments.sodium_100g,
      ) * 1000,
    ),
    source: 'Open Food Facts',
    raw: JSON.parse(JSON.stringify(product)),
  };
}

router.get('/products/search', requireAuth, async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const countryCode =
      typeof req.query.countryCode === 'string'
        ? req.query.countryCode.toUpperCase()
        : 'AU';

    const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : null;
    const lng = typeof req.query.lng === 'string' ? Number(req.query.lng) : null;

    if (!q) {
      return res.status(400).json({ error: 'q is required' });
    }

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
      [q, countryCode],
    );

    if (cached.rows.length > 0) {
      return res.json({
        query: q,
        countryCode,
        location: lat != null && lng != null ? { lat, lng } : null,
        source: 'cache',
        products: cached.rows.map((row) => ({
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
        })),
      });
    }

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
      `?search_terms=${encodeURIComponent(q)}` +
      '&page_size=30' +
      `&fields=${encodeURIComponent(fields)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MacroChef/0.1 (macrochef development)',
      },
    });
    if (!response.ok) {
    const errorText = await response.text();

    console.error(
        'Open Food Facts API error:',
        response.status,
        response.statusText,
        errorText,
    );

    return res.status(502).json({
        error: 'Product search failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
    });
    }
    
    const data = await response.json();

    const products = ((data.products ?? []) as OpenFoodFactsProduct[])
    .map((product) => {
        const normalised = normaliseProduct(product, q, countryCode);

        return {
        ...normalised,
        countryMatch: productMatchesCountry(product, countryCode),
        };
    })
    .filter((product) => product.name !== 'Unknown product')
    .filter((product) => {
    const haystack = [
        product.name,
        product.brand ?? '',
        product.quantity ?? '',
    ].join(' ').toLowerCase();

    const words = q
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);

    return words.some((word) => haystack.includes(word));
    })
    .filter((product) => {
        if (!q.toLowerCase().includes('protein')) return true;
        return product.proteinG >= 8;
    })
    .sort((a, b) => {
        if (a.countryMatch !== b.countryMatch) {
        return a.countryMatch ? -1 : 1;
        }

        const proteinDiff = b.proteinG - a.proteinG;

        if (proteinDiff !== 0) {
        return proteinDiff;
        }

        return a.calories - b.calories;
    })
    .slice(0, 10);

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
        } catch (cacheError) {
            console.error('Product candidate cache insert failed:', cacheError);
        }
    }

    return res.json({
        query: q,
        countryCode,
        location: lat != null && lng != null ? { lat, lng } : null,
        source: 'open_food_facts',
        products: products.map(
            ({ raw, storesTags, countryMatch, ...product }) => product,
        ),
    });

    } catch (error) {
        console.error('Product search failed full error:', error);

        return res.status(500).json({
            error: 'Product search failed',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

export default router;
