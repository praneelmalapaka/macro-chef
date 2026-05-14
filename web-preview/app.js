const tokenKey = "macrochef_token";
const state = {
  mode: "login",
  token: localStorage.getItem(tokenKey),
  user: null,
  summary: null,
  logs: []
};

const $ = (id) => document.getElementById(id);

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function showError(id, error) {
  const node = $(id);
  node.textContent = error ? String(error.message || error) : "";
  node.classList.toggle("hidden", !error);
}

function setToken(token) {
  state.token = token;
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
}

function showView(view) {
  for (const id of ["authView", "verifyView", "appView"]) {
    $(id).classList.toggle("hidden", id !== view);
  }
}

function setBusy(form, busy) {
  form.querySelectorAll("button, input, select").forEach((node) => {
    node.disabled = busy;
  });
}

async function bootstrap() {
  if (!state.token) {
    renderAuth();
    return;
  }
  try {
    const payload = await api("/auth/me");
    state.user = payload.user;
    if (!state.user.emailVerified) {
      renderVerify();
      return;
    }
    await loadDashboard();
    renderApp();
  } catch (_) {
    setToken(null);
    renderAuth();
  }
}

function renderAuth() {
  showView("authView");
  const signup = state.mode === "signup";
  $("signupFields").classList.toggle("hidden", !signup);
  $("authSubmit").textContent = signup ? "Create account" : "Log in";
  $("toggleAuth").textContent = signup ? "Already have an account? Log in" : "New here? Create account";
}

function renderVerify() {
  showView("verifyView");
  $("verifyCopy").textContent = `Enter the 6-digit code sent to ${state.user?.email || "your email"}.`;
}

async function loadDashboard() {
  const date = todayKey();
  const [logsPayload, summaryPayload] = await Promise.all([
    api(`/logs?date=${date}`),
    api(`/logs/summary?date=${date}`)
  ]);
  state.logs = logsPayload.logs || [];
  state.summary = summaryPayload;
}

function renderApp() {
  showView("appView");
  const user = state.user || {};
  const summary = state.summary || {};
  const goal = Number(user.dailyCalorieGoal || 2200);
  const total = Number(summary.totalCalories || 0);

  $("welcome").textContent = user.displayName || "MacroChef";
  $("totalCalories").textContent = String(total);
  $("goalText").textContent = `${goal} goal`;
  $("remainingCalories").textContent = String(goal - total);
  $("protein").textContent = `${Number(summary.proteinG || 0).toFixed(0)}g`;
  $("carbs").textContent = `${Number(summary.carbsG || 0).toFixed(0)}g`;
  $("fat").textContent = `${Number(summary.fatG || 0).toFixed(0)}g`;

  const logs = $("logs");
  if (!state.logs.length) {
    logs.innerHTML = '<div class="empty">No food logs yet.</div>';
    return;
  }
  logs.innerHTML = state.logs.map((log) => `
    <article class="log">
      <div>
        <strong>${escapeHtml(log.foodName)}</strong>
        <p class="muted">${escapeHtml(log.mealType)} | ${new Date(log.consumedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
      </div>
      <strong>${Number(log.calories || 0)}</strong>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

$("toggleAuth").addEventListener("click", () => {
  state.mode = state.mode === "login" ? "signup" : "login";
  showError("authError", null);
  renderAuth();
});

$("forgotPassword").addEventListener("click", async () => {
  showError("authError", new Error("Password reset is reserved for the next release."));
});

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  showError("authError", null);
  setBusy(form, true);
  try {
    const signup = state.mode === "signup";
    const payload = signup
      ? await api("/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            username: $("username").value.trim(),
            displayName: $("displayName").value.trim(),
            email: $("email").value.trim(),
            password: $("password").value
          })
        })
      : await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: $("email").value.trim(),
            password: $("password").value
          })
        });

    setToken(payload.token);
    state.user = payload.user;
    if (!state.user.emailVerified) renderVerify();
    else {
      await loadDashboard();
      renderApp();
    }
  } catch (error) {
    showError("authError", error);
  } finally {
    setBusy(form, false);
  }
});

$("verifyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  showError("verifyError", null);
  setBusy(form, true);
  try {
    const payload = await api("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ code: $("verificationCode").value.trim() })
    });
    setToken(payload.token);
    state.user = payload.user;
    await loadDashboard();
    renderApp();
  } catch (error) {
    showError("verifyError", error);
  } finally {
    setBusy(form, false);
  }
});

$("resendCode").addEventListener("click", async () => {
  showError("verifyError", null);
  try {
    await api("/auth/send-verification", { method: "POST" });
    showError("verifyError", new Error("Code resent. In local dev, check the backend terminal."));
  } catch (error) {
    showError("verifyError", error);
  }
});

function logout() {
  setToken(null);
  state.user = null;
  state.logs = [];
  state.summary = null;
  renderAuth();
}

$("logout").addEventListener("click", logout);
$("verifyLogout").addEventListener("click", logout);

$("refresh").addEventListener("click", async () => {
  await loadDashboard();
  renderApp();
});

$("logForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  showError("logError", null);
  setBusy(form, true);
  try {
    await api("/logs", {
      method: "POST",
      body: JSON.stringify({
        foodName: $("foodName").value.trim(),
        calories: Number($("foodCalories").value),
        proteinG: Number($("foodProtein").value || 0),
        carbsG: Number($("foodCarbs").value || 0),
        fatG: Number($("foodFat").value || 0),
        mealType: $("mealType").value,
        consumedAt: new Date().toISOString()
      })
    });
    form.reset();
    $("foodProtein").value = "0";
    $("foodCarbs").value = "0";
    $("foodFat").value = "0";
    await loadDashboard();
    renderApp();
  } catch (error) {
    showError("logError", error);
  } finally {
    setBusy(form, false);
  }
});

bootstrap();
