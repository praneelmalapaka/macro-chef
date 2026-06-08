INSERT INTO ingredients (
  id,
  display_name,
  category,
  attributes,
  nutrition_anchor
)
VALUES
(
  'cheese:paneer',
  'Paneer',
  'dairy:cheese',
  '{"form":"solid","protein":"high"}',
  '{}'
),
(
  'cheese:halloumi',
  'Halloumi',
  'dairy:cheese',
  '{"form":"solid","grillable":true}',
  '{}'
),
(
  'yoghurt:greek',
  'Greek Yoghurt',
  'dairy:fermented',
  '{"form":"semi-solid","protein":"high"}',
  '{}'
),
(
  'yoghurt:labneh',
  'Labneh',
  'dairy:fermented',
  '{"form":"semi-solid","strained":true}',
  '{}'
),
(
  'milk:kefir',
  'Kefir',
  'dairy:fermented',
  '{"form":"liquid","fermented":true}',
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
('cheese:paneer','AU','paneer','manual',1.0),
('cheese:halloumi','AU','halloumi','manual',1.0),

('yoghurt:greek','AU','greek yoghurt','manual',1.0),
('yoghurt:greek','US','greek yogurt','manual',1.0),

('yoghurt:labneh','AU','labneh','manual',1.0),

('milk:kefir','AU','kefir','manual',1.0)
ON CONFLICT DO NOTHING;


INSERT INTO ingredient_functions (
  ingredient_id,
  function,
  strength
)
VALUES
('cheese:paneer','protein','primary'),
('cheese:paneer','firm-cheese','primary'),

('cheese:halloumi','protein','primary'),
('cheese:halloumi','firm-cheese','primary'),

('yoghurt:greek','creamy-base','primary'),
('yoghurt:greek','acid-provider','secondary'),

('yoghurt:labneh','soft-cheese','primary'),
('yoghurt:labneh','creamy-base','secondary'),

('milk:kefir','liquid-acid','primary')
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
  'cheese:paneer',
  'cheese:halloumi',
  'approximate',
  ARRAY['protein','firm-cheese'],
  'Halloumi is saltier than paneer.'
),

(
  'cheese:halloumi',
  'cheese:paneer',
  'approximate',
  ARRAY['curry','indian'],
  'Paneer is milder than halloumi.'
),

(
  'yoghurt:greek',
  'yoghurt:labneh',
  'approximate',
  ARRAY['dip','sauce'],
  'Labneh is thicker and tangier.'
),

(
  'yoghurt:labneh',
  'yoghurt:greek',
  'approximate',
  ARRAY['AU'],
  'Greek yoghurt is easier to find.'
),

(
  'milk:kefir',
  'yoghurt:greek',
  'partial',
  ARRAY['high-protein'],
  'Texture differs significantly.'
)
ON CONFLICT DO NOTHING;