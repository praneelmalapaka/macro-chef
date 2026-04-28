import { fetchRecipesFromBackend, updateRecipe, deleteRecipe } from "./src/api.js";
import { state } from "./src/state.js";
import { showView } from "./src/navigation.js";
import { RECIPES } from "./src/data.js";
import { filterRecipes, openBackendDetail } from "./src/recipes.js";
import { addIngRow, checkBrand, simUpload, submitRecipe } from "./src/upload.js";
import { renderFeed, toggleFollow, rateFeedPost } from "./src/feed.js";
import { renderCountryGrid, selectCountry, renderSwapRows } from "./src/localiser.js";
import { refreshShopList, toggleCheck, changeQty, openOrderPanel, closeOrderPanel, selectDelivery, placeOrder, setShopMode } from "./src/shopping.js";
import { isRecipeSaved, toggleSavedRecipe } from "./src/favourites.js";

/* ═══════════════════ API ═══════════════════ */
async function loadRecipes() {
  try {
    state.backendRecipes = await fetchRecipesFromBackend();
    filterRecipes();
  } catch (err) {
    console.error(err);
    const grid=document.getElementById('recipeGrid');
    if(grid){
      grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3);font-family:var(--font-mono)">Failed to load recipes.</div>';
    }
    showToast("Failed to load recipes");
  }
}

async function deleteCurrentRecipe() {
  if (!state.currentRecipe) return;

  const confirmDelete = confirm("Delete this recipe?");
  if (!confirmDelete) return;

  try {
    await deleteRecipe(state.currentRecipe.id);

    await loadRecipes();
    showView("home");
    showToast("Recipe deleted");
  } catch (err) {
    console.error(err);
    showToast("Failed to delete");
  }
}

/* ═══════════════════ RECIPE GRID ═══════════════════ */

function setDiet(d,el){
  state.currentDiet=d;
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  filterRecipes();
}

function switchDetailTab(tab,el){
  document.querySelectorAll('.detail-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('detailIngredients').style.display=tab==='ingredients'?'block':'none';
  document.getElementById('detailMethod').style.display=tab==='method'?'block':'none';
  document.getElementById('detailComments').style.display=tab==='comments'?'block':'none';
}

function renderDetailComments(id){
  const c=state.tempComments[id]||[];
  document.getElementById('detailComments').innerHTML=`
    <div class="comments-title">${c.length} Comment${c.length!==1?'s':''}</div>
    ${c.map(cm=>`<div class="comment-card"><div class="comment-av" style="background:${cm.col}18;color:${cm.col}">${cm.user}</div><div class="comment-content"><div class="comment-header"><div class="comment-name">${cm.name}</div><div class="comment-time">${cm.time}</div></div><div class="comment-text">${cm.text}</div><div class="comment-actions"><button class="comment-action-btn" onclick="this.textContent=this.textContent.includes('♥')?'♡ '+parseInt(this.dataset.l):'♥ '+(parseInt(this.dataset.l)+1)" data-l="${cm.likes}">♡ ${cm.likes}</button><button class="comment-action-btn">Reply</button></div></div></div>`).join('')}
    <div class="comment-input-box">
      <textarea class="comment-textarea" id="commentBox" placeholder="Add a comment..." rows="2"></textarea>
      <button class="btn-post" onclick="postComment(${id})">Post</button>
    </div>`;
}

function postComment(id){
  const box=document.getElementById('commentBox');
  const txt=box.value.trim();
  if(!txt)return;
  if(!state.tempComments[id])state.tempComments[id]=[];
  state.tempComments[id].push({user:"JD",name:"You",col:"#b8922a",text:txt,time:"just now",likes:0});
  renderDetailComments(id);
  switchDetailTab('comments',document.querySelectorAll('.detail-tab')[2]);
}

function getRecipeById(id){
  return state.backendRecipes.find(r=>String(r.id)===String(id)) || state.currentRecipe || state.backendRecipes[0] || RECIPES[0];
}

function goToShopRecipe(){
  if(state.currentRecipe){
    const id=state.currentRecipe.id;
    goShopByRecipeId(id);
  }
}

function goLocalise(id){
  const found=RECIPES.find(r=>r.id===id)||state.currentRecipe||RECIPES[0];
  state.currentRecipe=found;
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=state.currentRecipe.title;
  showView('localiser');
}

function goLocaliseByRecipeId(id){
  state.currentRecipe=getRecipeById(id);
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=state.currentRecipe.title;
  showView('localiser');
}

function goShop(id){
  const found=RECIPES.find(r=>r.id===id)||state.currentRecipe||RECIPES[0];
  state.currentRecipe=found;
  const title=document.getElementById('shopRecipeName');
  if(title)title.textContent=state.currentRecipe.title;
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=state.currentRecipe.title;
  showView('shopping');
  refreshShopList();
}

function goShopByRecipeId(id){
  state.currentRecipe=getRecipeById(id);
  const title=document.getElementById('shopRecipeName');
  if(title)title.textContent=state.currentRecipe.title;
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=state.currentRecipe.title;
  showView('shopping');
  refreshShopList();
}

function openEditRecipe() {
  if (!state.currentRecipe) return;

  const r = state.currentRecipe;

  document.getElementById("editTitle").value = r.title || "";
  document.getElementById("editMethod").value = r.method || "";
  document.getElementById("editCalories").value = r.calories ?? "";
  document.getElementById("editProtein").value = r.protein_g ?? "";
  document.getElementById("editCarbs").value = r.carbs_g ?? "";
  document.getElementById("editFat").value = r.fat_g ?? "";

  document.getElementById("editOverlay").classList.add("open");
  document.getElementById("editPanel").classList.add("open");
}

function closeEditModal() {
  document.getElementById("editOverlay").classList.remove("open");
  document.getElementById("editPanel").classList.remove("open");
}

async function saveEditRecipe() {
  if (!state.currentRecipe) return;

  const updatedRecipe = {
    title: document.getElementById("editTitle").value.trim(),
    description: state.currentRecipe.description || "",
    method: document.getElementById("editMethod").value.trim(),
    prep_time_minutes: state.currentRecipe.prep_time_minutes,
    cook_time_minutes: state.currentRecipe.cook_time_minutes,
    servings: state.currentRecipe.servings,
    calories: document.getElementById("editCalories").value
      ? Number(document.getElementById("editCalories").value)
      : null,
    protein_g: document.getElementById("editProtein").value
      ? Number(document.getElementById("editProtein").value)
      : null,
    carbs_g: document.getElementById("editCarbs").value
      ? Number(document.getElementById("editCarbs").value)
      : null,
    fat_g: document.getElementById("editFat").value
      ? Number(document.getElementById("editFat").value)
      : null,
    image_url: state.currentRecipe.image_url,
  };

  if (!updatedRecipe.title || !updatedRecipe.method) {
    showToast("Title and method are required");
    return;
  }

  try {
    await updateRecipe(state.currentRecipe.id, updatedRecipe);
    closeEditModal();
    await loadRecipes();
    showView("home");
    showToast("Recipe updated");
  } catch (err) {
    console.error(err);
    showToast("Failed to update recipe");
  }
}

function toggleCurrentRecipeSaved() {
  if (!state.currentRecipe) return;

  const nowSaved = toggleSavedRecipe(state.currentRecipe.id);
  const btn = document.getElementById("detailSaveBtn");

  if (btn) {
    btn.textContent = nowSaved ? "⭐ Saved" : "☆ Save";
  }

  filterRecipes();
  showToast(nowSaved ? "Recipe saved" : "Recipe removed from saved");
}

/* ═══════════════════ TOAST ═══════════════════ */
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

/* ═══════════════════ INIT ═══════════════════ */
state.currentRecipe=RECIPES[0];
const localiserLabel=document.getElementById('localiserRecipeName');
if(localiserLabel)localiserLabel.textContent=state.currentRecipe.title;
renderFeed();
renderCountryGrid();
renderSwapRows();
refreshShopList();
loadRecipes();

window.setDiet = setDiet;
window.switchDetailTab = switchDetailTab;
window.postComment = postComment;
window.goToShopRecipe = goToShopRecipe;
window.goLocalise = goLocalise;
window.goLocaliseByRecipeId = goLocaliseByRecipeId;
window.goShop = goShop;
window.goShopByRecipeId = goShopByRecipeId;
window.toggleFollow = toggleFollow;
window.rateFeedPost = rateFeedPost;
window.selectCountry = selectCountry;
window.setShopMode = setShopMode;
window.toggleCheck = toggleCheck;
window.changeQty = changeQty;
window.openOrderPanel = openOrderPanel;
window.closeOrderPanel = closeOrderPanel;
window.selectDelivery = selectDelivery;
window.placeOrder = placeOrder;
window.addIngRow = addIngRow;
window.checkBrand = checkBrand;
window.simUpload = simUpload;
window.submitRecipe = () => submitRecipe(loadRecipes, showToast);
window.filterRecipes = filterRecipes;
window.openBackendDetail = openBackendDetail;
window.showView = showView;
window.refreshShopList = refreshShopList;
window.deleteCurrentRecipe = deleteCurrentRecipe;
window.openEditRecipe = openEditRecipe;
window.closeEditModal = closeEditModal;
window.saveEditRecipe = saveEditRecipe;
window.toggleCurrentRecipeSaved = toggleCurrentRecipeSaved;