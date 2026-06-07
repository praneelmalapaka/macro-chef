import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

function rate(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

router.get('/analytics/localisation-health', requireAuth, async (_req, res) => {
  try {
    const resolverSummary = await pool.query(`
      SELECT
        COUNT(*)::int AS total_resolutions,
        COUNT(*) FILTER (WHERE matched = true)::int AS matched_count,
        COUNT(*) FILTER (WHERE matched = false)::int AS miss_count,
        COUNT(*) FILTER (WHERE match_type = 'exact-region-alias')::int AS exact_region_count,
        COUNT(*) FILTER (WHERE match_type = 'exact-global-alias')::int AS exact_global_count,
        COUNT(*) FILTER (WHERE match_type = 'fuzzy-alias')::int AS fuzzy_count
      FROM resolver_events
    `);

    const topMisses = await pool.query(`
      SELECT
        raw_ingredient,
        cleaned_ingredient,
        region_code,
        COUNT(*)::int AS miss_count
      FROM resolver_events
      WHERE matched = false
      GROUP BY raw_ingredient, cleaned_ingredient, region_code
      ORDER BY miss_count DESC
      LIMIT 20
    `);

    const feedbackSummary = await pool.query(`
      SELECT
        COUNT(*)::int AS feedback_count,
        COUNT(*) FILTER (WHERE feedback = 'helpful')::int AS helpful_count,
        COUNT(*) FILTER (WHERE feedback = 'bad')::int AS bad_count
      FROM substitute_feedback
    `);

    const topAccepted = await pool.query(`
      SELECT
        substitute_ingredient_id,
        substitute_display_name,
        COUNT(*)::int AS helpful_count
      FROM substitute_feedback
      WHERE feedback = 'helpful'
      GROUP BY substitute_ingredient_id, substitute_display_name
      ORDER BY helpful_count DESC
      LIMIT 10
    `);

    const topRejected = await pool.query(`
      SELECT
        substitute_ingredient_id,
        substitute_display_name,
        COUNT(*)::int AS bad_count
      FROM substitute_feedback
      WHERE feedback = 'bad'
      GROUP BY substitute_ingredient_id, substitute_display_name
      ORDER BY bad_count DESC
      LIMIT 10
    `);

    const acceptanceByMatchType = await pool.query(`
        WITH latest_resolver_match AS (
            SELECT DISTINCT ON (canonical_ingredient_id)
            canonical_ingredient_id,
            match_type
            FROM resolver_events
            WHERE canonical_ingredient_id IS NOT NULL
            ORDER BY canonical_ingredient_id, created_at DESC
        )
        SELECT
            lrm.match_type,
            COUNT(sf.id)::int AS feedback_count,
            COUNT(*) FILTER (WHERE sf.feedback = 'helpful')::int AS helpful_count,
            COUNT(*) FILTER (WHERE sf.feedback = 'bad')::int AS bad_count
        FROM substitute_feedback sf
        JOIN latest_resolver_match lrm
            ON lrm.canonical_ingredient_id = sf.canonical_ingredient_id
        WHERE sf.canonical_ingredient_id IS NOT NULL
        GROUP BY lrm.match_type
    `);

    const resolver = resolverSummary.rows[0];
    const feedback = feedbackSummary.rows[0];

    const totalResolutions = Number(resolver.total_resolutions ?? 0);
    const matchedCount = Number(resolver.matched_count ?? 0);
    const missCount = Number(resolver.miss_count ?? 0);
    const exactRegionCount = Number(resolver.exact_region_count ?? 0);
    const exactGlobalCount = Number(resolver.exact_global_count ?? 0);
    const fuzzyCount = Number(resolver.fuzzy_count ?? 0);

    const feedbackCount = Number(feedback.feedback_count ?? 0);
    const helpfulCount = Number(feedback.helpful_count ?? 0);
    const badCount = Number(feedback.bad_count ?? 0);

    return res.json({
      resolver: {
        totalResolutions,
        matchedCount,
        missCount,
        matchRate: rate(matchedCount, totalResolutions),
        missRate: rate(missCount, totalResolutions),
        exactRegionMatchRate: rate(exactRegionCount, totalResolutions),
        exactGlobalMatchRate: rate(exactGlobalCount, totalResolutions),
        fuzzyMatchRate: rate(fuzzyCount, totalResolutions),
        topMisses: topMisses.rows.map((row) => ({
          rawIngredient: row.raw_ingredient,
          cleanedIngredient: row.cleaned_ingredient,
          regionCode: row.region_code,
          missCount: Number(row.miss_count ?? 0),
        })),
      },
      substitutions: {
        feedbackCount,
        helpfulCount,
        badCount,
        acceptanceRate: rate(helpfulCount, feedbackCount),
        rejectionRate: rate(badCount, feedbackCount),
        topAccepted: topAccepted.rows.map((row) => ({
          substituteIngredientId: row.substitute_ingredient_id,
          substituteDisplayName: row.substitute_display_name,
          helpfulCount: Number(row.helpful_count ?? 0),
        })),
        topRejected: topRejected.rows.map((row) => ({
          substituteIngredientId: row.substitute_ingredient_id,
          substituteDisplayName: row.substitute_display_name,
          badCount: Number(row.bad_count ?? 0),
        })),
        acceptanceByMatchType: acceptanceByMatchType.rows.map((row) => ({
            matchType: row.match_type,
            feedbackCount: Number(row.feedback_count ?? 0),
            helpfulCount: Number(row.helpful_count ?? 0),
            badCount: Number(row.bad_count ?? 0),
            acceptanceRate:
                row.feedback_count > 0
                ? Number(
                    (
                        (Number(row.helpful_count) /
                        Number(row.feedback_count)) *
                        100
                    ).toFixed(2)
                    )
                : 0,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to load localisation analytics:', error);

    return res.status(500).json({
      error: 'Failed to load localisation analytics',
    });
  }
});

export default router;