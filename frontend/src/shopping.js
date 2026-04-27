import { state } from "./state.js";
import { showView } from "./navigation.js";
import { RECIPES, SHOPS, TARGET_NUTRITION, SHOP_MODE_LABELS } from "./data.js";

function normaliseName(name){return (name||'').toLowerCase();}

function getIngredientType(name){
  const n=normaliseName(name);
  if(n.includes('chicken'))return 'chicken';
  if(n.includes('yoghurt')||n.includes('yogurt'))return 'yoghurt';
  if(n.includes('tikka'))return 'tikka';
  if(n.includes('rice'))return 'rice';
  if(n.includes('beef'))return 'beef';
  if(n.includes('avocado'))return 'avocado';
  if(n.includes('cheddar')||n.includes('cheese')||n.includes('parmesan'))return n.includes('parmesan')?'parmesan':'cheese';
  if(n.includes('lettuce'))return 'lettuce';
  if(n.includes('lentil'))return 'lentils';
  if(n.includes('quinoa'))return 'quinoa';
  if(n.includes('spinach'))return 'spinach';
  if(n.includes('tahini'))return 'tahini';
  if(n.includes('oats'))return 'oats';
  if(n.includes('whey')||n.includes('protein powder'))return 'whey';
  if(n.includes('banana'))return 'banana';
  if(n.includes('almond milk'))return 'almondmilk';
  if(n.includes('salmon'))return 'salmon';
  if(n.includes('soy sauce'))return 'soy';
  if(n.includes('mirin'))return 'mirin';
  if(n.includes('broccolini'))return 'broccolini';
  if(n.includes('pasta')||n.includes('rigatoni'))return 'pasta';
  if(n.includes('passata')||n.includes('tomato'))return 'passata';
  return 'generic';
}

function getTargetMacros(name){
  const type=getIngredientType(name);
  return TARGET_NUTRITION[type]||TARGET_NUTRITION.generic;
}

function parseStoreDistance(region,storeName){
  const data=SHOPS[region]||SHOPS["Sydney, NSW, Australia"];
  const store=data.stores.find(s=>storeName&&storeName.includes(s.name.split(' · ')[0]));
  return store?parseFloat(store.dist):2.5;
}

function makeCandidate(base,variant,target,region){
  const mult=variant==='value'?0.92:variant==='premium'?1.08:1;
  const proteinMult=variant==='value'?0.93:variant==='premium'?1.02:1;
  const sodiumMult=variant==='value'?1.05:variant==='premium'?0.98:1;
  const storePrefix=(base.store||'Local').split(' ')[0];
  const label=variant==='value'?`${storePrefix} Value ${base.name}`:variant==='premium'?`${storePrefix} Select ${base.name}`:`${base.brand} ${base.name}`;
  return {
    name:label,
    brand:variant==='value'?`${storePrefix} Value`:variant==='premium'?`${storePrefix} Select`:base.brand,
    amount:base.amount,
    store:base.store,
    avail:variant==='exact'?base.avail:true,
    sub:variant==='exact'?base.sub:null,
    price:parseFloat((base.price*(variant==='value'?0.88:variant==='premium'?1.14:1)).toFixed(2)),
    cals:parseFloat((target.cals*mult).toFixed(1)),
    protein:parseFloat((target.protein*proteinMult).toFixed(1)),
    sodium:parseFloat((target.sodium*sodiumMult).toFixed(1)),
    distance:parseStoreDistance(region,base.store),
    variant
  };
}

function scoreCandidate(candidate,target,mode){
  const nutritionError=Math.abs(candidate.cals-target.cals)+Math.abs(candidate.protein-target.protein)*6+Math.abs(candidate.sodium-target.sodium)/20;
  const availabilityPenalty=candidate.avail?0:999;
  if(mode==='nutrition')return nutritionError + candidate.price*0.6 + candidate.distance + availabilityPenalty;
  if(mode==='closest')return candidate.distance*12 + nutritionError*0.5 + candidate.price*0.4 + availabilityPenalty;
  return candidate.price*4 + nutritionError*0.35 + candidate.distance + availabilityPenalty;
}

function getRecipeForShop(){
  return state.currentRecipe||state.backendRecipes[0]||RECIPES[0];
}

function getRecipeIngredientsForShop(recipe){
  if(Array.isArray(recipe?.ingredients) && recipe.ingredients.length){
    return recipe.ingredients.map(i=>({
      name:i.name,
      amount:i.amount ? `${i.amount}${i.unit ? ' '+i.unit : ''}` : (i.unit||''),
      brand:i.brandName || i.brand || 'Local'
    }));
  }
  return recipe?.ingredients || [];
}

function getRecipeMacroValue(recipe, keyOld, keyNew){
  if(recipe?.[keyOld] !== undefined && recipe?.[keyOld] !== null) return Number(recipe[keyOld]);
  if(recipe?.[keyNew] !== undefined && recipe?.[keyNew] !== null) return Number(recipe[keyNew]);
  return 0;
}

function getOptimisedItems(region){
  const recipe=getRecipeForShop();
  const data=SHOPS[region]||SHOPS["Sydney, NSW, Australia"];
  const ingredients=getRecipeIngredientsForShop(recipe);
  return ingredients.map((ingredient,idx)=>{
    const type=getIngredientType(ingredient.name);
    const target=getTargetMacros(ingredient.name);
    const base=data.items.find(item=>getIngredientType(item.name)===type) || {name:ingredient.name,brand:'Local',amount:ingredient.amount||'1 item',store:data.stores[0]?.name||'Nearby store',avail:true,price:4.99,sub:null};
    const candidates=['exact','value','premium'].map(v=>makeCandidate(base,v,target,region));
    const selected=candidates.slice().sort((a,b)=>scoreCandidate(a,target,state.shopMode)-scoreCandidate(b,target,state.shopMode))[0];
    return {...selected, ingredientName:ingredient.name, target, idx};
  });
}

function getQtyBucket(region){
  const recipe=getRecipeForShop();
  const bucket=`${region}__recipe_${recipe.id}`;
  if(!state.qtyState[bucket])state.qtyState[bucket]={};
  return {bucket, qty:state.qtyState[bucket]};
}

function renderShopSummary(items,recipe){
  const regionValue=document.getElementById('shopRegion')?.value || "Sydney, NSW, Australia";
  const totals=items.reduce((acc,item,idx)=>{
    const {qty}=getQtyBucket(regionValue);
    const q=qty[idx]||1;
    acc.cals+=item.cals*q;
    acc.protein+=item.protein*q;
    acc.sodium+=item.sodium*q;
    acc.cost+=item.price*q;
    return acc;
  },{cals:0,protein:0,sodium:0,cost:0});

  const recipeCals=getRecipeMacroValue(recipe,'cals','calories');
  const recipeProtein=getRecipeMacroValue(recipe,'protein','protein_g');
  const deltaCals=Math.round(totals.cals-recipeCals);
  const deltaProtein=(totals.protein-recipeProtein).toFixed(1);
  const deltaSodium=Math.round(totals.sodium-((recipe.sodium)||500));

  document.getElementById('shopMiniSummary').innerHTML=`
    <div class="shop-metric"><div class="shop-metric-label">Estimated total</div><div class="shop-metric-value">$${totals.cost.toFixed(2)}</div><div class="shop-metric-sub">${SHOP_MODE_LABELS[state.shopMode]}</div></div>
    <div class="shop-metric"><div class="shop-metric-label">Macro delta</div><div class="shop-metric-value">${deltaCals>0?'+':''}${deltaCals}</div><div class="shop-metric-sub">cal vs target</div></div>
    <div class="shop-match-note"><strong>Smart basket:</strong> ${recipe.title} is being localised for <strong>${regionValue}</strong>. This basket keeps protein ${Number(deltaProtein)>=0?'+':''}${deltaProtein}g and sodium ${deltaSodium>0?'+':''}${deltaSodium}mg from the current target while prioritising <strong>${SHOP_MODE_LABELS[state.shopMode]}</strong>.</div>`;
}

function setShopMode(mode,btn){
  state.shopMode=mode;
  document.querySelectorAll('.shop-mode-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  refreshShopList();
}

/* ═══════════════════ SHOPPING ═══════════════════ */
function refreshShopList(){
  const region=document.getElementById('shopRegion')?.value || "Sydney, NSW, Australia";
  const data=SHOPS[region]||SHOPS["Sydney, NSW, Australia"];
  const recipe=getRecipeForShop();
  const items=getOptimisedItems(region);
  const avail=items.filter(i=>i.avail).length;
  const total=items.length||1;
  const circ=264;

  document.getElementById('shopRecipeName').textContent=recipe.title;
  document.getElementById('ringNum').textContent=avail+'/'+items.length;
  document.getElementById('ringFill').setAttribute('stroke-dasharray',Math.round(avail/total*circ)+' '+circ);

  document.getElementById('nearbyStores').innerHTML=data.stores.map(s=>`
    <div class="store-item">
      <div><div class="store-name">${s.name}</div><div class="store-dist">${s.dist} away · ${s.items} items</div></div>
      <div class="store-items">${s.items} items</div>
    </div>`).join('');

  const {bucket,qty}=getQtyBucket(region);
  const rows=document.getElementById('shopListRows');
  rows.innerHTML=items.map((item,i)=>{
    if(!qty[i])qty[i]=1;
    const key=bucket+'_'+i;
    const calDelta=Math.round((item.cals-item.target.cals)*qty[i]);
    const proteinDelta=((item.protein-item.target.protein)*qty[i]).toFixed(1);
    const sodiumDelta=Math.round((item.sodium-item.target.sodium)*qty[i]);
    return `<div class="shop-item-row" id="shoprow${i}">
      <div class="shop-check ${state.checkState[key]?'ticked':''}" onclick="toggleCheck('${key}',${i})" id="chk${i}">${state.checkState[key]?'✓':''}</div>
      <div class="shop-item-info">
        <div class="shop-item-name ${state.checkState[key]?'done':''}" id="shopname${i}">${item.ingredientName} → ${item.brand}</div>
        <div class="shop-item-meta">
          <span class="shop-brand-tag">${item.amount}</span>
          <span class="shop-store-tag">${item.store}</span>
          <span style="font-size:11px;color:${item.avail?'var(--forest)':'var(--rust)'};font-family:var(--font-mono);font-weight:600">${item.avail?'● In stock':'✗ Fallback'}</span>
        </div>
        <div class="shop-item-delta">Δ ${calDelta>=0?'+':''}${calDelta} cal · ${Number(proteinDelta)>=0?'+':''}${proteinDelta}g protein · ${sodiumDelta>=0?'+':''}${sodiumDelta}mg sodium</div>
        ${item.sub?`<div class="shop-unavail">⚠ ${item.sub}</div>`:''}
      </div>
      <div class="shop-item-qty">
        <button class="qty-btn" onclick="changeQty('${bucket}',${i},-1)">−</button>
        <span class="qty-num" id="qty${i}">${qty[i]}</span>
        <button class="qty-btn" onclick="changeQty('${bucket}',${i},1)">+</button>
      </div>
      <div class="shop-item-price">$${(item.price*qty[i]).toFixed(2)}</div>
    </div>`;
  }).join('');

  renderShopSummary(items,recipe);
  updateCheckedCount();
  updateCartBadge();
}

function toggleCheck(key,i){
  state.checkState[key]=!state.checkState[key];
  const chk=document.getElementById('chk'+i);
  const nm=document.getElementById('shopname'+i);
  chk.className='shop-check'+(state.checkState[key]?' ticked':'');
  chk.textContent=state.checkState[key]?'✓':'';
  if(nm){nm.className='shop-item-name'+(state.checkState[key]?' done':'');}
  updateCheckedCount();
}


function changeQty(bucket,i,delta){
  if(!state.qtyState[bucket])state.qtyState[bucket]={};
  state.qtyState[bucket][i]=Math.max(1,(state.qtyState[bucket][i]||1)+delta);
  refreshShopList();
  const panel=document.getElementById('orderPanel');
  if(panel&&panel.classList.contains('open'))buildOrderPanel();
}

function updateCheckedCount(){
  const region=document.getElementById('shopRegion')?.value || "Sydney, NSW, Australia";
  const recipe=getRecipeForShop();
  const prefix=`${region}__recipe_${recipe.id}_`;
  const checked=Object.entries(state.checkState).filter(([k,v])=>k.startsWith(prefix)&&v).length;
  const el=document.getElementById('checkedCount');
  if(el)el.textContent=checked+' checked';
}

function updateCartBadge(){
  const region=document.getElementById('shopRegion')?.value || "Sydney, NSW, Australia";
  const {qty}=getQtyBucket(region);
  const items=getOptimisedItems(region);
  let count=0;
  items.forEach((_,i)=>count+=qty[i]||1);
  document.getElementById('cartBadge').textContent=count||0;
}

/* ═══════════════════ ORDER PANEL ═══════════════════ */
function openOrderPanel(){
  state.orderPlaced=false;
  buildOrderPanel();
  document.getElementById('orderPanel').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeOrderPanel(){
  document.getElementById('orderPanel').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function buildOrderPanel(){
  const region=document.getElementById('shopRegion')?.value || "Sydney, NSW, Australia";
  const items=getOptimisedItems(region);
  const {qty}=getQtyBucket(region);
  let subtotal=0;
  const avItems=items.filter(it=>it.avail);
  avItems.forEach((it)=>{subtotal+=(it.price*(qty[it.idx]||1));});
  const delivery=state.deliveryOpt==='express'?9.99:state.deliveryOpt==='scheduled'?4.99:0;
  const service=parseFloat((subtotal*0.05).toFixed(2));
  const total=(subtotal+delivery+service).toFixed(2);
  document.getElementById('orderTotalBtn').textContent=total;

  document.getElementById('orderPanelFooter').innerHTML=`<button class="btn-place-order" id="placeOrderBtn" onclick="placeOrder()">Place Order · $<span id="orderTotalBtn">${total}</span></button>`;
  document.getElementById('orderPanelBody').innerHTML=`
    <div class="order-section-title">Order Summary</div>
    ${avItems.map((it)=>{const q=qty[it.idx]||1;return`<div class="order-item"><div class="order-item-left"><div class="order-item-name">${it.ingredientName} → ${it.brand}</div><div class="order-item-brand">${it.store}</div><div class="order-item-qty">Qty: ${q} × $${it.price.toFixed(2)}</div></div><div class="order-item-price">$${(it.price*q).toFixed(2)}</div></div>`}).join('')}
    ${items.filter(it=>!it.avail).length?`<div style="background:#c24b2a0a;border:1px solid #c24b2a30;border-radius:var(--radius-sm);padding:12px;margin-top:12px;font-size:12px;color:var(--rust)">⚠ ${items.filter(it=>!it.avail).length} fallback item(s) were swapped to keep the basket purchasable nearby.</div>`:''}
    <div class="order-section-title">Delivery</div>
    <div class="delivery-options">
      <div class="delivery-opt ${state.deliveryOpt==='express'?'selected':''}" onclick="selectDelivery('express',this)">
        <div class="delivery-opt-radio"><div class="delivery-dot"></div></div>
        <div><div class="delivery-opt-name">Express (2–4h)</div><div class="delivery-opt-detail">Today · Direct from store</div></div>
        <div class="delivery-opt-price">$9.99</div>
      </div>
      <div class="delivery-opt ${state.deliveryOpt==='scheduled'?'selected':''}" onclick="selectDelivery('scheduled',this)">
        <div class="delivery-opt-radio"><div class="delivery-dot"></div></div>
        <div><div class="delivery-opt-name">Scheduled Delivery</div><div class="delivery-opt-detail">Choose a 2h window</div></div>
        <div class="delivery-opt-price">$4.99</div>
      </div>
      <div class="delivery-opt ${state.deliveryOpt==='pickup'?'selected':''}" onclick="selectDelivery('pickup',this)">
        <div class="delivery-opt-radio"><div class="delivery-dot"></div></div>
        <div><div class="delivery-opt-name">Click & Collect</div><div class="delivery-opt-detail">Ready in 1h at nearest store</div></div>
        <div class="delivery-opt-price">Free</div>
      </div>
    </div>
    <div class="order-section-title">Deliver To</div>
    <div class="address-input-group">
      <input class="addr-input" placeholder="Street address" value="42 Bondi Road">
      <input class="addr-input" placeholder="Suburb / City" value="Bondi, NSW 2026">
      <input class="addr-input" placeholder="Leave at door, ring bell, etc.">
    </div>
    <div class="order-section-title">Payment</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:14px;font-weight:500">💳 Visa ending 4242</div>
      <div style="font-size:12px;color:var(--gold);cursor:pointer;font-family:var(--font-mono)">Change</div>
    </div>
    <hr class="order-divider">
    <div class="order-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
    <div class="order-row"><span>Delivery</span><span>${delivery===0?'Free':'$'+delivery.toFixed(2)}</span></div>
    <div class="order-row"><span>Service fee</span><span>$${service.toFixed(2)}</span></div>
    <div class="order-total"><span>Total</span><span>$${total}</span></div>`;
}

function selectDelivery(opt,el){
  state.deliveryOpt=opt;
  document.querySelectorAll('.delivery-opt').forEach(d=>{
    d.classList.remove('selected');
    d.querySelector('.delivery-opt-radio .delivery-dot').style.display='none';
  });
  el.classList.add('selected');
  el.querySelector('.delivery-dot').style.display='block';
  buildOrderPanel();
}

function placeOrder(){
  const btn=document.getElementById('placeOrderBtn');
  btn.disabled=true;
  btn.textContent='Processing...';
  setTimeout(()=>{
    document.getElementById('orderPanelBody').innerHTML=`
      <div class="order-success">
        <div class="success-icon">✅</div>
        <div class="success-title">Order Placed!</div>
        <div class="success-sub">Your groceries are being picked. You'll receive an SMS when the shopper is on the way.</div>
        <div class="tracking-card">
          <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:var(--text3);text-transform:uppercase;margin-bottom:12px">Live Tracking</div>
          <div class="tracking-steps">
            <div class="tracking-step"><div class="track-dot track-active"></div><span class="track-label active">Order confirmed</span></div>
            <div class="tracking-step"><div class="track-dot track-active"></div><span class="track-label active">Shopper assigned — Jake at Woolworths</span></div>
            <div class="tracking-step"><div class="track-dot track-pending"></div><span class="track-label pending">Picking items...</span></div>
            <div class="tracking-step"><div class="track-dot track-pending"></div><span class="track-label pending">Out for delivery</span></div>
            <div class="tracking-step"><div class="track-dot track-pending"></div><span class="track-label pending">Delivered</span></div>
        </div>
            </div>
            <div style="margin-top:20px;font-size:13px;color:var(--text3);font-family:var(--font-mono)">Est. arrival: 2:45 PM · Order #MC-8821</div>
        </div>`;
        document.getElementById('orderPanelFooter').innerHTML=`<button onclick="closeOrderPanel();showView('home')" style="width:100%;padding:14px;background:var(--ink);border:none;border-radius:var(--radius);color:var(--paper);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer">Back to Recipes</button>`;
        showToast('Order #MC-8821 confirmed 🎉');
        document.getElementById('cartBadge').textContent='0';
    },2000);
}

export {
  refreshShopList,
  setShopMode,
  toggleCheck,
  changeQty,
  openOrderPanel,
  closeOrderPanel,
  selectDelivery,
  placeOrder,
};