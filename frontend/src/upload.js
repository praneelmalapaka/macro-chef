import { createRecipe } from "./api.js";
import { showView } from "./navigation.js";

export function addIngRow() {
  const list = document.getElementById("uploadIngredients");
  if (!list) return;

  const row = document.createElement("div");
  row.className = "ingredient-entry";
  row.innerHTML = `
    <input class="form-input" placeholder="Ingredient name">
    <input class="form-input" placeholder="Amount">
    <input class="form-input" placeholder="Brand name" oninput="checkBrand(this)">
    <span></span>
  `;

  list.appendChild(row);
}

export function checkBrand(inp) {
  const parent = inp.parentElement;
  const existing = parent.querySelector(".brand-verify");

  if (inp.value.length > 2) {
    if (!existing) {
      const s = document.createElement("span");
      s.className = "brand-verify";
      s.textContent = "✓ Verified";
      parent.appendChild(s);
    }
  } else if (existing) {
    existing.remove();
  }
}

export function simUpload(dz) {
  dz.innerHTML = `
    <div class="drop-icon">✅</div>
    <div class="drop-text" style="color:var(--forest)">Photo uploaded</div>
    <div class="drop-sub">recipe_photo.jpg · 3.2MB</div>
  `;
}

export async function submitRecipe(loadRecipes, showToast) {
  const title = document.getElementById("upName")?.value.trim();
  const method = document.querySelector(".form-textarea")?.value.trim();
  const st = document.getElementById("uploadStatus");

  const rows = document.querySelectorAll("#uploadIngredients .ingredient-entry");
  const ingredients = [];

  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const name = inputs[0]?.value.trim();
    const amount = inputs[1]?.value.trim();
    const brandName = inputs[2]?.value.trim();

    if (name) {
      ingredients.push({
        name,
        amount,
        unit: "",
        brandName,
      });
    }
  });

  const selects = document.querySelectorAll(".form-select");
  const dietValue = selects[0]?.value || "";

  const tagSlugMap = {
    "High Protein": "high-protein",
    Keto: "keto",
    Vegan: "vegan",
    "Low Carb": "low-carb",
    Bulking: "bulking",
    Cutting: "cutting",
  };

  const tags = tagSlugMap[dietValue] ? [tagSlugMap[dietValue]] : [];

  const numberInputs = document.querySelectorAll('.form-input[type="number"]');
  const prepTimeMinutes = numberInputs[0]?.value
    ? Number(numberInputs[0].value)
    : null;
  const servings = numberInputs[1]?.value ? Number(numberInputs[1].value) : null;
  const calories = numberInputs[2]?.value ? Number(numberInputs[2].value) : null;
  const proteinG = numberInputs[3]?.value ? Number(numberInputs[3].value) : null;
  const carbsG = numberInputs[4]?.value ? Number(numberInputs[4].value) : null;
  const fatG = numberInputs[5]?.value ? Number(numberInputs[5].value) : null;

  if (!title || !method || ingredients.length === 0) {
    if (st) {
      st.innerHTML =
        '<span style="color:var(--rust)">Please add a title, method, and at least one ingredient</span>';
    }
    return;
  }

  const recipe = {
    title,
    description: "",
    method,
    prep_time_minutes: prepTimeMinutes,
    cook_time_minutes: null,
    servings,
    calories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    image_url: "https://placehold.co/600x400",
    ingredients,
    tags,
  };

  try {
    if (st) {
      st.innerHTML =
        '<span style="color:var(--text2)">⏳ Uploading recipe...</span>';
    }

    await createRecipe(recipe);

    if (st) {
      st.innerHTML =
        '<span class="detail-verified" style="font-size:13px">✓ Recipe live!</span>';
    }

    await loadRecipes();
    showToast("Recipe uploaded successfully!");
    showView("home");
  } catch (err) {
    console.error(err);
    if (st) {
      st.innerHTML = `<span style="color:var(--rust)">${err.message}</span>`;
    }
  }
}