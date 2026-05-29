export type SubstituteCandidate = {
  ingredientId: string;
  displayName: string;
  fidelity: string;
  context: string[];
  notes: string | null;
};

export type UserNutritionGoals = {
  preferLowFat?: boolean;
  preferLowSodium?: boolean;
  preferHighProtein?: boolean;
  mustBeVegan?: boolean;
  mustBeDairyFree?: boolean;
};

export type RankingContext = {
  cookingMethod?: string;
  quantityGrams?: number;
  neighbourIngredients?: string[];
  userNutritionGoals?: UserNutritionGoals;
  userRegion?: string;
};

export type RankedSubstitute = SubstituteCandidate & {
  score: number;
  reasons: string[];
  warnings: string[];
};

const FIDELITY_SCORE: Record<string, number> = {
  functional: 40,
  approximate: 25,
  partial: 10,
};

const METHOD_CONTEXT_MAP: Record<string, string[]> = {
  whip: ['whipping', 'whipped'],
  whipping: ['whipping', 'whipped'],
  bake: ['baking', 'bake'],
  baking: ['baking', 'bake'],
  sauce: ['sauce', 'general-cooking'],
  saute: ['general-cooking'],
  raw: ['raw'],
};

function normalise(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function contextIncludes(
  candidate: SubstituteCandidate,
  value: string,
): boolean {
  const target = normalise(value);

  return candidate.context.some(
    (context) => normalise(context) === target,
  );
}

function contextMatchesAny(
  candidate: SubstituteCandidate,
  values: string[],
): boolean {
  return values.some((value) => contextIncludes(candidate, value));
}

function scoreFidelity(candidate: SubstituteCandidate) {
  return {
    score: FIDELITY_SCORE[candidate.fidelity] ?? 5,
    reasons: [`${candidate.fidelity} substitution fidelity`],
  };
}

function scoreRegion(
  candidate: SubstituteCandidate,
  userRegion?: string,
) {
  if (!userRegion) {
    return {
      score: 0,
      reasons: [] as string[],
    };
  }

  if (contextIncludes(candidate, userRegion)) {
    return {
      score: 15,
      reasons: [
        `marked as suitable for ${userRegion.toUpperCase()}`,
      ],
    };
  }

  return {
    score: 0,
    reasons: [] as string[],
  };
}

function scoreCookingMethod(
  candidate: SubstituteCandidate,
  cookingMethod?: string,
) {
  const method = normalise(cookingMethod);

  if (!method) {
    return {
      score: 0,
      reasons: [] as string[],
      warnings: [] as string[],
    };
  }

  const tags = METHOD_CONTEXT_MAP[method] ?? [method];

  if (contextMatchesAny(candidate, tags)) {
    return {
      score: 15,
      reasons: [`compatible with ${method} context`],
      warnings: [] as string[],
    };
  }

  if (candidate.fidelity === 'partial') {
    return {
      score: -10,
      reasons: [] as string[],
      warnings: [
        `partial substitute may not work well for ${method}`,
      ],
    };
  }

  return {
    score: 0,
    reasons: [] as string[],
    warnings: [] as string[],
  };
}

function scoreNutritionGoals(
  candidate: SubstituteCandidate,
  goals?: UserNutritionGoals,
) {
  if (!goals) {
    return {
      score: 0,
      reasons: [] as string[],
      warnings: [] as string[],
    };
  }

  let score = 0;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (goals.mustBeVegan) {
    if (contextIncludes(candidate, 'vegan')) {
      score += 25;
      reasons.push('matches vegan requirement');
    } else {
      score -= 100;
      warnings.push(
        'does not explicitly satisfy vegan requirement',
      );
    }
  }

  if (goals.mustBeDairyFree) {
    if (contextIncludes(candidate, 'dairy-free')) {
      score += 25;
      reasons.push('matches dairy-free requirement');
    } else {
      score -= 100;
      warnings.push(
        'does not explicitly satisfy dairy-free requirement',
      );
    }
  }

  if (goals.preferLowFat) {
    if (contextIncludes(candidate, 'low-fat')) {
      score += 15;
      reasons.push('supports low-fat preference');
    }
  }

  if (goals.preferLowSodium) {
    if (contextIncludes(candidate, 'low-sodium')) {
      score += 10;
      reasons.push('supports low-sodium preference');
    }
  }

  if (goals.preferHighProtein) {
    if (contextIncludes(candidate, 'high-protein')) {
      score += 10;
      reasons.push('supports high-protein preference');
    }
  }

  return {
    score,
    reasons,
    warnings,
  };
}

function scoreQuantity(
  candidate: SubstituteCandidate,
  quantityGrams?: number,
) {
  if (
    quantityGrams == null ||
    !Number.isFinite(quantityGrams)
  ) {
    return {
      score: 0,
      reasons: [] as string[],
      warnings: [] as string[],
    };
  }

  if (
    quantityGrams >= 250 &&
    candidate.fidelity === 'partial'
  ) {
    return {
      score: -8,
      reasons: [] as string[],
      warnings: [
        'large quantity with partial substitute may noticeably change the recipe',
      ],
    };
  }

  if (quantityGrams <= 30) {
    return {
      score: 4,
      reasons: ['small quantity reduces substitution risk'],
      warnings: [] as string[],
    };
  }

  return {
    score: 0,
    reasons: [] as string[],
    warnings: [] as string[],
  };
}

export function rankSubstitutes(
  candidates: SubstituteCandidate[],
  context: RankingContext = {},
): RankedSubstitute[] {
  return candidates
    .map((candidate) => {
      const fidelity = scoreFidelity(candidate);
      const region = scoreRegion(
        candidate,
        context.userRegion,
      );
      const method = scoreCookingMethod(
        candidate,
        context.cookingMethod,
      );
      const nutrition = scoreNutritionGoals(
        candidate,
        context.userNutritionGoals,
      );
      const quantity = scoreQuantity(
        candidate,
        context.quantityGrams,
      );

      const score =
        fidelity.score +
        region.score +
        method.score +
        nutrition.score +
        quantity.score;

      return {
        ...candidate,
        score,
        reasons: [
          ...fidelity.reasons,
          ...region.reasons,
          ...method.reasons,
          ...nutrition.reasons,
          ...quantity.reasons,
        ],
        warnings: [
          ...method.warnings,
          ...nutrition.warnings,
          ...quantity.warnings,
        ],
      };
    })
    .sort((a, b) => b.score - a.score);
}