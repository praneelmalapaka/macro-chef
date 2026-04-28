import { state } from "./state.js";
import {
  fetchSavedRecipeIds,
  saveRecipe,
  unsaveRecipe,
} from "./api.js";

export async function loadSavedRecipes() {
  state.savedRecipeIds = await fetchSavedRecipeIds();
  return state.savedRecipeIds;
}

export function getSavedRecipeIds() {
  return state.savedRecipeIds.map(String);
}

export function isRecipeSaved(id) {
  return getSavedRecipeIds().includes(String(id));
}

export function updateSavedCount() {
  const count = getSavedRecipeIds().length;

  const savedCount = document.getElementById("savedCount");
  if (savedCount) savedCount.textContent = count;

  const navSavedBadge = document.getElementById("navSavedBadge");
  if (navSavedBadge) navSavedBadge.textContent = count;
}

export async function initialiseSavedRecipes() {
  const token = localStorage.getItem("mc_token");

  if (!token) {
    state.savedRecipeIds = [];
    updateSavedCount();
    return;
  }

  try {
    await loadSavedRecipes();
    updateSavedCount();
    window.filterRecipes?.();
  } catch (err) {
    console.error(err);

    if (err.message === "Invalid token" || err.message === "Session expired") {
      localStorage.removeItem("mc_token");
      localStorage.removeItem("mc_user");
      state.savedRecipeIds = [];
      updateSavedCount();
      window.openAuthModal?.("login");
    }
  }
}

export async function toggleSavedRecipe(id) {
  const recipeId = String(id);

  if (isRecipeSaved(recipeId)) {
    await unsaveRecipe(recipeId);
    state.savedRecipeIds = state.savedRecipeIds.filter((x) => x !== recipeId);
    updateSavedCount();
    return false;
  }

  await saveRecipe(recipeId);
  state.savedRecipeIds = [...state.savedRecipeIds, recipeId];
  updateSavedCount();
  return true;
}