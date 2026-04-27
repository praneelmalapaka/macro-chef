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
    },
    body: JSON.stringify(recipe),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update recipe");
  }

  return data;
}