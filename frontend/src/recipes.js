import { state } from "./state.js";
import { isRecipeSaved, toggleSavedRecipe } from "./favourites.js";
import { showToast } from "./ui.js";
import { renderRecipeGrid } from "./recipes.ui.js";
import { showView } from "./navigation.js";
import { fetchRecipesFromBackend } from "./api.js";

export const tagMap = {
  "high-protein": { cls: "tag-protein", label: "High Protein" },
  keto: { cls: "tag-keto", label: "Keto" },
  vegan: { cls: "tag-vegan", label: "Vegan" },
  "low-carb": { cls: "tag-low", label: "Low Carb" },
  bulking: { cls: "tag-bulk", label: "Bulking" },
  vegetarian: { cls: "tag-vegan", label: "Vegetarian" },
};

export function filterRecipes() {
  const grid = document.getElementById("recipeGrid");
  if (!grid) return;

  const query = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const recipes = state.backendRecipes || [];
  const filtered = recipes.filter((r) => {
    const tags = (r.tags || []).map((t) => t.slug);

    return (
      (state.currentDiet === "all" || tags.includes(state.currentDiet)) &&
      (!query || r.title.toLowerCase().includes(query))
    );
  });

  renderRecipeGrid(grid, filtered, handleRecipeAction);
}

async function handleRecipeAction(action, recipe, btn) {
  switch (action) {
    case "open":
      openRecipe(recipe);
      break;

    case "save":
      await handleSave(recipe, btn);
      break;

    case "localise":
      document.dispatchEvent(
        new CustomEvent("recipe:localise", { detail: recipe.id })
      );
      break;

    case "shop":
      document.dispatchEvent(
        new CustomEvent("recipe:shop", { detail: recipe.id })
      );
      break;
  }
}

function openRecipe(recipe) {
  state.currentRecipe = recipe;
  showView("detail");
}

async function handleSave(recipe, btn) {
  if (!localStorage.getItem("mc_token")) {
    document.dispatchEvent(new Event("auth:required"));
    return;
  }

  try {
    const saved = await toggleSavedRecipe(recipe.id);
    btn.textContent = saved ? "⭐ Saved" : "☆ Save";
  } catch {
    showToast("Failed to save");
  }
}

export async function loadRecipes() {
  const grid = document.getElementById("recipeGrid");

  if (grid) {
    grid.innerHTML = `<div style="padding:40px;text-align:center">Loading...</div>`;
  }

  try {
    state.backendRecipes = await fetchRecipesFromBackend();
    filterRecipes();
  } catch (err) {
    console.error(err);

    if (grid) {
      grid.innerHTML = `
        <div style="padding:40px;text-align:center">
          Failed to load recipes
        </div>
      `;
    }

    showToast("Failed to load recipes");
  }
}