import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/products/barcode/:barcode', requireAuth, async (req, res) => {
  try {
    const barcode = String(req.params.barcode);

    if (!/^\d{6,20}$/.test(barcode)) {
      return res.status(400).json({ error: 'Invalid barcode' });
    }

    const fields = [
      'product_name',
      'brands',
      'image_url',
      'nutriments',
      'quantity',
      'serving_size',
    ].join(',');

    const url =
      `https://world.openfoodfacts.org/api/v2/product/${barcode}` +
      `?fields=${encodeURIComponent(fields)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MacroChef/0.1 (macrochef development)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Nutrition lookup failed' });
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = data.product;
    const nutriments = product.nutriments ?? {};

    return res.json({
      barcode,
      name: product.product_name || 'Unknown product',
      brand: product.brands || null,
      imageUrl: product.image_url || null,
      quantity: product.quantity || null,
      servingSize: product.serving_size || null,

      calories: Math.round(
        Number(
          nutriments['energy-kcal_serving'] ??
            nutriments['energy-kcal_100g'] ??
            0,
        ),
      ),
      proteinG: Number(
        nutriments.proteins_serving ?? nutriments.proteins_100g ?? 0,
      ),
      carbsG: Number(
        nutriments.carbohydrates_serving ??
          nutriments.carbohydrates_100g ??
          0,
      ),
      fatG: Number(
        nutriments.fat_serving ?? nutriments.fat_100g ?? 0,
      ),
      sodiumMg: Math.round(
        Number(
          nutriments.sodium_serving ??
            nutriments.sodium_100g ??
            0,
        ) * 1000,
      ),
      source: 'Open Food Facts',
    });
  } catch (error) {
    console.error('Failed to scan barcode:', error);
    return res.status(500).json({ error: 'Failed to scan barcode' });
  }
});

export default router;