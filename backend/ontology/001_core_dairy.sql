INSERT INTO ingredients (
  id,
  display_name,
  category,
  attributes,
  nutrition_anchor
)
VALUES
(
  'cream:high-fat',
  'Heavy Cream',
  'dairy:cream',
  '{"fat":"high","form":"liquid"}',
  '{}'
),
(
  'cream:thickened',
  'Thickened Cream',
  'dairy:cream',
  '{"fat":"high","form":"liquid","stabilisers":true}',
  '{}'
),
(
  'cream:coconut-full-fat',
  'Full Fat Coconut Cream',
  'plant:cream',
  '{"fat":"high","form":"liquid","vegan":true}',
  '{}'
),
(
  'milk:evaporated-skim',
  'Evaporated Skim Milk',
  'dairy:milk',
  '{"fat":"low","form":"liquid"}',
  '{}'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO ingredient_regional_names (
  ingredient_id,
  region_code,
  alias,
  source,
  confidence
)
VALUES
('cream:high-fat','US','heavy cream','manual',1.0),
('cream:high-fat','US','heavy whipping cream','manual',1.0),

('cream:thickened','AU','thickened cream','manual',1.0),
('cream:thickened','AU','pure cream','manual',1.0),

('cream:coconut-full-fat','AU','coconut cream','manual',1.0),

('milk:evaporated-skim','AU','evaporated skim milk','manual',1.0)
ON CONFLICT DO NOTHING;


INSERT INTO ingredient_functions (
  ingredient_id,
  function,
  strength
)
VALUES
('cream:high-fat','fat-carrier','primary'),
('cream:high-fat','thickener','secondary'),

('cream:thickened','fat-carrier','primary'),
('cream:thickened','thickener','secondary'),

('cream:coconut-full-fat','fat-carrier','primary'),

('milk:evaporated-skim','liquid-dairy','primary')
ON CONFLICT DO NOTHING;


INSERT INTO ingredient_substitutes (
  from_ingredient_id,
  to_ingredient_id,
  fidelity,
  context,
  notes
)
VALUES
(
  'cream:high-fat',
  'cream:thickened',
  'functional',
  ARRAY['AU','sauce','general-cooking'],
  'Good Australian substitute.'
),
(
  'cream:high-fat',
  'cream:coconut-full-fat',
  'approximate',
  ARRAY['vegan','dairy-free'],
  'Changes flavour profile.'
),
(
  'cream:high-fat',
  'milk:evaporated-skim',
  'partial',
  ARRAY['low-fat'],
  'Not suitable for whipping.'
)
ON CONFLICT DO NOTHING;