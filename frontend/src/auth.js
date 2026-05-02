import { login, signup } from "./api.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";

let authMode = "login";

/* ═══════════════════ STORAGE ═══════════════════ */

export function getAuth() {
  return {
    user: getCurrentUser(),
    token: localStorage.getItem("mc_token"),
  };
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("mc_user"));
  } catch {
    return null;
  }
}

export function setAuth(user, token) {
  localStorage.setItem("mc_user", JSON.stringify(user));
  localStorage.setItem("mc_token", token);
  updateAuthUI();
}

/* ═══════════════════ UI CONTROL ═══════════════════ */

export function openAuthModal(mode = "login") {
  authMode = mode;
  updateAuthModal();

  document.getElementById("authOverlay")?.classList.add("open");
  document.getElementById("authPanel")?.classList.add("open");
}

export function closeAuthModal() {
  document.getElementById("authOverlay")?.classList.remove("open");
  document.getElementById("authPanel")?.classList.remove("open");
}

export function toggleAuthMode() {
  authMode = authMode === "login" ? "signup" : "login";
  updateAuthModal();
}

function updateAuthModal() {
  const isSignup = authMode === "signup";

  const title = document.getElementById("authTitle");
  const username = document.getElementById("authUsername");
  const switchText = document.getElementById("authSwitchText");
  const switchBtn = document.getElementById("authSwitchBtn");

  if (title) title.textContent = isSignup ? "Sign up" : "Login";
  if (username) username.style.display = isSignup ? "block" : "none";
  if (switchText)
    switchText.textContent = isSignup
      ? "Already have an account?"
      : "Don't have an account?";
  if (switchBtn) switchBtn.textContent = isSignup ? "Login" : "Sign up";
}

/* ═══════════════════ AUTH ACTIONS ═══════════════════ */

export async function submitAuthForm() {
  const username = document.getElementById("authUsername")?.value.trim();
  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

  if (!email || !password || (authMode === "signup" && !username)) {
    showToast("Please fill all fields");
    return;
  }

  try {
    const data =
      authMode === "signup"
        ? await signup(username, email, password)
        : await login(email, password);

    setAuth(data.user, data.token);
    closeAuthModal();

    // lazy import to avoid circular deps
    const { initialiseSavedRecipes } = await import("./favourites.js");
    await initialiseSavedRecipes();

    showToast(authMode === "signup" ? "Account created" : "Logged in");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Authentication failed");
  }
}

export function logout() {
  localStorage.removeItem("mc_user");
  localStorage.removeItem("mc_token");

  state.savedRecipeIds = [];

  updateAuthUI();

  import("./favourites.js").then(({ updateSavedCount }) =>
    updateSavedCount()
  );
  import("./recipes.js").then(({ filterRecipes }) =>
    filterRecipes()
  );

  const badge = document.getElementById("navSavedBadge");
  if (badge) badge.textContent = "0";

  showToast("Logged out");
}

/* ═══════════════════ UI STATE ═══════════════════ */

export function updateAuthUI() {
  const user = getCurrentUser();
  const avatar = document.querySelector(".user-avatar");

  if (!avatar) return;

  if (user) {
    const label = user.username || user.name || user.email;
    avatar.textContent = label ? label[0].toUpperCase() : "U";

    avatar.onclick = logout;
    avatar.title = "Click to logout";
  } else {
    avatar.textContent = "Login";
    avatar.onclick = () => openAuthModal("login");
    avatar.title = "Login";
  }
}

export async function restoreSession() {
  const token = localStorage.getItem("mc_token");
  if (!token) return;

  updateAuthUI();

  const { initialiseSavedRecipes } = await import("./favourites.js");
  await initialiseSavedRecipes();
}

document.getElementById("authOverlay")?.addEventListener("click", closeAuthModal);