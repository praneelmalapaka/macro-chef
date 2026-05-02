import { state } from "./state.js";
import { RECIPES } from "./data.js";
import { refreshShopList } from "./shopping.js";

export function showView(v) {
  document.querySelectorAll(".page-view").forEach((p) => {
    p.classList.remove("active");
  });

  document.querySelectorAll(".nav-link").forEach((n) => {
    n.classList.remove("active");
  });

  document.getElementById("view-" + v)?.classList.add("active");

  const navEl = document.getElementById("nav-" + v);
  if (navEl) navEl.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getRecipeById(id) {
  return (
    state.backendRecipes.find((r) => String(r.id) === String(id)) ||
    state.currentRecipe ||
    state.backendRecipes[0] ||
    RECIPES[0]
  );
}

export function goLocaliseByRecipeId(id) {
  state.currentRecipe = getRecipeById(id);

  const label = document.getElementById("localiserRecipeName");
  if (label) label.textContent = state.currentRecipe.title;

  showView("localiser");
}

export function goShopByRecipeId(id) {
  state.currentRecipe = getRecipeById(id);

  const title = document.getElementById("shopRecipeName");
  if (title) title.textContent = state.currentRecipe.title;

  const label = document.getElementById("localiserRecipeName");
  if (label) label.textContent = state.currentRecipe.title;

  showView("shopping");
  refreshShopList();
}