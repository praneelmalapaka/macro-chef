export type ProductCandidate = {
  name: string;
  brand?: string;
  retailer?: string;
  confidence: number;
};

const PRODUCT_MAP: Record<string, ProductCandidate[]> = {
  'cream:thickened': [
    {
      name: 'Thickened Cream',
      brand: 'Bulla',
      retailer: 'Coles',
      confidence: 95,
    },
    {
      name: 'Thickened Cream',
      brand: 'Pauls',
      retailer: 'Woolworths',
      confidence: 90,
    },
  ],

  'cheese:halloumi': [
    {
      name: 'Halloumi',
      brand: 'Lemnos',
      retailer: 'Coles',
      confidence: 95,
    },
  ],

  'yoghurt:greek': [
    {
      name: 'Greek Style Yoghurt',
      brand: 'Chobani',
      retailer: 'Woolworths',
      confidence: 95,
    },
  ],
};

export function discoverProducts(
  ingredientId: string,
): ProductCandidate[] {
  return PRODUCT_MAP[ingredientId] ?? [];
}