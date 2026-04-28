import { state } from "./src/state.js";
import { RECIPES } from "./src/data.js";

import { loadRecipes } from "./src/recipes.js";
import { filterRecipes } from "./src/recipes.js";

import { initialiseSavedRecipes } from "./src/favourites.js";
import { updateAuthUI, openAuthModal, closeAuthModal, toggleAuthMode, submitAuthForm, logout } from "./src/auth.js";

import { renderFeed } from "./src/feed.js";
import { renderCountryGrid, renderSwapRows } from "./src/localiser.js";
import { refreshShopList } from "./src/shopping.js";

import { goShopByRecipeId, goLocaliseByRecipeId } from "./src/navigation.js";

function init() {
  state.currentRecipe = RECIPES[0];

  renderFeed();
  renderCountryGrid();
  renderSwapRows();
  refreshShopList();

  loadRecipes();
  initialiseSavedRecipes();

  updateAuthUI();

  setupEventListeners();
}

init();

function setupEventListeners() {
  document.addEventListener("recipe:shop", (e) => {
    goShopByRecipeId(e.detail);
  });

  document.addEventListener("recipe:localise", (e) => {
    goLocaliseByRecipeId(e.detail);
  });

  document.addEventListener("auth:required", () => {
    openAuthModal("login");
  });

  document.getElementById("searchInput")?.addEventListener("input", () => {
    filterRecipes();
  });
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.submitAuthForm = submitAuthForm;
window.logout = logout;