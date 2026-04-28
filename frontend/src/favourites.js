const STORAGE_KEY = "macrochef_saved_recipes";

export function getSavedRecipeIds() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function isRecipeSaved(id) {
  return getSavedRecipeIds().includes(String(id));
}

export function toggleSavedRecipe(id) {
  const recipeId = String(id);
  const saved = getSavedRecipeIds();

  const updated = saved.includes(recipeId)
    ? saved.filter((x) => x !== recipeId)
    : [...saved, recipeId];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.includes(recipeId);
}