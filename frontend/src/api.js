export const API_BASE = "http://localhost:5000";

export async function fetchRecipesFromBackend() {
  const res = await fetch(`${API_BASE}/api/recipes`);

  if (!res.ok) {
    throw new Error("Failed to fetch recipes");
  }

  return await res.json();
}

export async function createRecipe(recipe) {
  const res = await fetch(`${API_BASE}/api/recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(recipe),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create recipe");
  }

  return data;
}

export async function deleteRecipe(id) {
  const res = await fetch(`${API_BASE}/api/recipes/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to delete");
  }

  return data;
}

export async function updateRecipe(id, recipe) {
  const res = await fetch(`${API_BASE}/api/recipes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(recipe),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update recipe");
  }

  return data;
}

function getToken() {
  return localStorage.getItem("mc_token");
}

export async function signup(username, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  return data;
}

export async function fetchSavedRecipeIds() {
  const res = await fetch(`${API_BASE}/api/saved-recipes`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch saved recipes");
  }

  return data.map(String);
}

export async function saveRecipe(id) {
  const res = await fetch(`${API_BASE}/api/saved-recipes/${id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to save recipe");
  }

  return data;
}

export async function unsaveRecipe(id) {
  const res = await fetch(`${API_BASE}/api/saved-recipes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to unsave recipe");
  }

  return data;
}