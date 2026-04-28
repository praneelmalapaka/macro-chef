import { state } from "./state.js";
import { showView } from "./navigation.js";
import { isRecipeSaved, toggleSavedRecipe } from "./favourites.js";

export const tagMap = {
  "high-protein": { cls: "tag-protein", label: "High Protein" },
  keto: { cls: "tag-keto", label: "Keto" },
  vegan: { cls: "tag-vegan", label: "Vegan" },
  "low-carb": { cls: "tag-low", label: "Low Carb" },
  bulking: { cls: "tag-bulk", label: "Bulking" },
  vegetarian: { cls: "tag-vegan", label: "Vegetarian" },
  quick: { cls: "tag-bulk", label: "Quick" },
  cutting: { cls: "tag-low", label: "Cutting" },
  "low-sodium": { cls: "tag-low", label: "Low Sodium" },
  "low-sugar": { cls: "tag-low", label: "Low Sugar" },
  "requires-oven": { cls: "tag-keto", label: "Requires Oven" },
};

export function filterRecipes() {
  const q = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const grid = document.getElementById("recipeGrid");
  if (!grid) return;
  const filtered = state.backendRecipes.filter((r) => {
    const tags = (r.tags || []).map((t) => t.slug);

    const matchesDiet =
      state.currentDiet === "all" ||
      (state.currentDiet === "saved" && isRecipeSaved(r.id)) ||
      tags.includes(state.currentDiet);

    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      tags.some((t) => t.includes(q));

    return matchesDiet && matchesSearch;
  });

  grid.innerHTML = "";

  if (!filtered.length) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3);font-family:var(--font-mono)">No recipes found. Try a different filter.</div>';
    return;
  }

  filtered.forEach((r) => grid.appendChild(buildBackendCard(r)));
}

function buildBackendCard(r) {
  const d = document.createElement("div");
  d.className = "recipe-card";

  const dietTags = (r.tags || [])
    .map(
      (t) =>
        `<span class="tag ${tagMap[t.slug]?.cls || ""}">${
          tagMap[t.slug]?.label || t.name
        }</span>`
    )
    .join("");

  const imageContent = r.image_url
    ? `<img src="${r.image_url}" alt="${r.title}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span style="font-size:72px;position:relative;z-index:1">🍽️</span>`;

  const saved = isRecipeSaved(r.id);
  d.innerHTML = `
    <div class="card-img" style="background:#f9f6f0">
      ${imageContent}
      <div class="card-verified">✓ COMMUNITY</div>
    </div>
    <div class="card-body">
      <div class="card-tags">${dietTags}</div>
      <div class="card-title">${r.title}</div>
      <div class="card-author" style="font-family:var(--font-mono)">${r.description || "Community recipe"}</div>
      <div class="macro-strip">
        <div class="macro-box"><div class="macro-val">${r.calories ?? "-"}</div><div class="macro-lbl">Cal</div></div>
        <div class="macro-box"><div class="macro-val">${r.protein_g ?? "-"}g</div><div class="macro-lbl">Protein</div></div>
        <div class="macro-box"><div class="macro-val">${r.carbs_g ?? "-"}g</div><div class="macro-lbl">Carbs</div></div>
        <div class="macro-box"><div class="macro-val">${r.fat_g ?? "-"}g</div><div class="macro-lbl">Fat</div></div>
      </div>
      <div class="card-footer">
        <div class="rating-row">★ New <span class="rating-count">(community)</span></div>
        <div class="card-btns">
          <button class="card-btn" data-save-id="${r.id}">
            ${saved ? "⭐ Saved" : "☆ Save"}
          </button>
          <button class="card-btn" data-localise-id="${r.id}">🌍 Localise</button>
          <button class="card-btn shop" data-shop-id="${r.id}">🛒 Order</button>
        </div>
      </div>
    </div>`;

  d.onclick = () => openBackendDetail(r);

  d.querySelector("[data-localise-id]").onclick = (e) => {
    e.stopPropagation();
    window.goLocaliseByRecipeId(r.id);
  };

  d.querySelector("[data-shop-id]").onclick = (e) => {
    e.stopPropagation();
    window.goShopByRecipeId(r.id);
  };

  d.querySelector("[data-save-id]").onclick = (e) => {
    e.stopPropagation();
    const nowSaved = toggleSavedRecipe(r.id);
    e.currentTarget.textContent = nowSaved ? "⭐ Saved" : "☆ Save";
  };

  return d;
}

export function openBackendDetail(r){
  state.currentRecipe=r;
  const detailEmoji=document.getElementById('detailEmoji');
  if(detailEmoji){
    detailEmoji.innerHTML=r.image_url
      ? `<img src="${r.image_url}" alt="${r.title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
      : '🍽️';
  }

  const detailSaveBtn = document.getElementById("detailSaveBtn");
  if (detailSaveBtn) {
    detailSaveBtn.textContent = isRecipeSaved(r.id) ? "⭐ Saved" : "☆ Save";
  }

  const dietTags=(r.tags||[]).map(t=>`<span class="tag ${tagMap[t.slug]?.cls||''}">${tagMap[t.slug]?.label||t.name}</span>`).join('');
  document.getElementById('detailTags').innerHTML=dietTags;
  document.getElementById('detailTitle').textContent=r.title;
  document.getElementById('detailAvatarText').textContent='MC';
  document.getElementById('detailAuthorName').textContent='@community';
  document.getElementById('detailAuthorStats').textContent='Recipe post';

  document.getElementById('detailMacros').innerHTML=`
    <div class="detail-macro-card"><div class="detail-macro-num">${r.calories??'-'}</div><div class="detail-macro-lbl">Calories / serving</div></div>
    <div class="detail-macro-card"><div class="detail-macro-num">${r.protein_g??'-'}g</div><div class="detail-macro-lbl">Protein</div></div>
    <div class="detail-macro-card"><div class="detail-macro-num">${r.carbs_g??'-'}g</div><div class="detail-macro-lbl">Carbs</div></div>
    <div class="detail-macro-card"><div class="detail-macro-num">${r.fat_g??'-'}g</div><div class="detail-macro-lbl">Fat</div></div>`;

  document.getElementById('detailIngredients').innerHTML=`
    <div class="ingredients-list">
      ${(r.ingredients||[]).map(i=>`
        <div class="ingredient-row">
          <div class="ing-name">${i.name}</div>
          <div class="ing-amount">${i.amount||''} ${i.unit||''}</div>
          <span class="ing-brand">◈ ${i.brandName||'No brand'}</span>
        </div>`).join('')}
    </div>`;

  document.getElementById('detailMethod').innerHTML=`<div style="white-space:pre-line;font-size:15px;line-height:1.8;color:var(--text2)">${r.method||''}</div>`;
  document.getElementById('detailComments').innerHTML=`
    <div class="comments-section">
      <div class="comments-title">Comments coming soon</div>
    </div>`;

  document.querySelectorAll('.detail-tab').forEach((t,i)=>{t.className='detail-tab'+(i===0?' active':'')});
  document.getElementById('detailIngredients').style.display='block';
  document.getElementById('detailMethod').style.display='none';
  document.getElementById('detailComments').style.display='none';
  showView('detail');
}