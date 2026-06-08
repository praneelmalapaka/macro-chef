import fs from 'fs';
import path from 'path';
import { resolveIngredient } from '../services/ingredientResolver';
import { rankSubstitutes, type RankingContext } from '../services/substituteRanker';

type GoldenCase = {
  name: string;
  caseType: 'core' | 'dietary' | 'adversarial';
  ingredient: string;
  region: string;
  cookingMethod?: string;
  userNutritionGoals?: RankingContext['userNutritionGoals'];
  expectedTopSubstitute?: string;
  expectedRejects?: string[];
};

function fail(message: string) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function pass(message: string) {
  console.log(`✅ ${message}`);
}

async function run() {
  const testPath = path.resolve(
    process.cwd(),
    'tests/localisation/golden-test-set.json',
  );

  const raw = fs.readFileSync(testPath, 'utf8');
  const cases = JSON.parse(raw) as GoldenCase[];

  console.log(`Running ${cases.length} golden localisation tests...\n`);

  for (const testCase of cases) {
    const resolved = await resolveIngredient(
      testCase.ingredient,
      testCase.region,
    );

    if (!resolved.matched || !resolved.ingredient) {
      fail(`${testCase.name}: ingredient did not resolve`);
      continue;
    }

    const ranked = rankSubstitutes(resolved.substitutes, {
      cookingMethod: testCase.cookingMethod,
      userRegion: testCase.region,
      userNutritionGoals: testCase.userNutritionGoals,
    });

    const top = ranked[0];

    if (testCase.expectedTopSubstitute) {
      if (!top) {
        fail(`${testCase.name}: expected ${testCase.expectedTopSubstitute}, got no substitute`);
      } else if (top.displayName !== testCase.expectedTopSubstitute) {
        fail(
          `${testCase.name}: expected top "${testCase.expectedTopSubstitute}", got "${top.displayName}"`,
        );
      } else {
        pass(`${testCase.name}: top substitute matched`);
      }
    }

    for (const rejected of testCase.expectedRejects ?? []) {
      if (top?.displayName === rejected) {
        fail(`${testCase.name}: rejected substitute "${rejected}" ranked first`);
      } else {
        pass(`${testCase.name}: rejected substitute "${rejected}" was not top`);
      }
    }
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('\nGolden localisation tests failed.');
    process.exit(process.exitCode);
  }

  console.log('\nAll golden localisation tests passed.');
}

run().catch((error) => {
  console.error('Golden localisation test runner failed:', error);
  process.exit(1);
});