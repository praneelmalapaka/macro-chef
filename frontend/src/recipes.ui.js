import { tagMap } from "./recipes.js";

export function renderRecipeGrid(container, recipes, onAction) {
  container.innerHTML = "";

  if (!recipes.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3)">
        No recipes found.
      </div>
    `;
    return;
  }

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <div class="card-img">
        ${renderImage(recipe)}
        <div class="card-verified">✓ COMMUNITY</div>
      </div>
      <div class="card-body">
        <div class="card-tags">${renderTags(recipe.tags)}</div>
        <div class="card-title">${recipe.title}</div>
        <div class="card-author">${recipe.description || "Community recipe"}</div>

        ${renderMacros(recipe)}

        <div class="card-footer">
          <div class="rating-row">★ New</div>
          <div class="card-btns">
            <button data-action="save">☆ Save</button>
            <button data-action="localise">🌍 Localise</button>
            <button data-action="shop">🛒 Order</button>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () =>
      onAction("open", recipe)
    );

    card.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onAction(btn.dataset.action, recipe, btn);
      });
    });

    container.appendChild(card);
  });
}

/* helpers */

function renderTags(tags = []) {
  return tags
    .map(
      (t) =>
        `<span class="tag ${tagMap[t.slug]?.cls || ""}">
          ${tagMap[t.slug]?.label || t.name}
        </span>`
    )
    .join("");
}

function renderImage(r) {
  return r.image_url
    ? `<img src="${r.image_url}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span style="font-size:72px">🍽️</span>`;
}

function renderMacros(r) {
  return `
    <div class="macro-strip">
      ${macro("Cal", r.calories)}
      ${macro("Protein", r.protein_g, "g")}
      ${macro("Carbs", r.carbs_g, "g")}
      ${macro("Fat", r.fat_g, "g")}
    </div>
  `;
}

function macro(label, val, unit = "") {
  return `
    <div class="macro-box">
      <div class="macro-val">${val ?? "-"}${unit}</div>
      <div class="macro-lbl">${label}</div>
    </div>
  `;
}