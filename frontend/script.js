const API_BASE = "http://localhost:5000";
let backendRecipes = [];

/* ═══════════════════ DATA ═══════════════════ */
const RECIPES=[
  {id:1,title:"High-Protein Chicken Tikka",author:"priyalifts",emoji:"🍛",diet:["high-protein"],country:"IN",cals:420,protein:52,carbs:18,fat:14,rating:4.8,reviews:234,ingredients:[{name:"Chicken Breast",amount:"200g",brand:"Ingham's"},{name:"Greek Yoghurt",amount:"100g",brand:"Chobani"},{name:"Tikka Masala Paste",amount:"30g",brand:"Patak's"},{name:"Basmati Rice",amount:"80g",brand:"SunRice"}],method:"1. Dice chicken into 3cm cubes.\n2. Mix yoghurt with tikka paste and marinate chicken for 2+ hours.\n3. Cook rice per packet instructions.\n4. Grill chicken at 220°C for 18–22 minutes, turning halfway.\n5. Rest 5 min before serving over rice.",comments:[{user:"JS",name:"Jake S",col:"#3d4a5c",text:"Made this last night — 52g protein confirmed on my macro tracker!",time:"2h ago",likes:14},{user:"AM",name:"Amy M",col:"#b8922a",text:"Swapped chicken for tofu. Still incredible.",time:"5h ago",likes:7}]},
  {id:2,title:"Keto Beef & Avocado Bowl",author:"ketomike",emoji:"🥑",diet:["keto","low-carb"],country:"US",cals:580,protein:42,carbs:8,fat:42,rating:4.6,reviews:189,ingredients:[{name:"Ground Beef 93%",amount:"150g",brand:"Laura's Lean"},{name:"Avocado",amount:"1 whole",brand:"Fresh"},{name:"Cheddar",amount:"40g",brand:"Tillamook"},{name:"Butter Lettuce",amount:"80g",brand:"Fresh"}],method:"1. Brown ground beef in a pan over high heat, seasoning with salt, pepper, and cumin.\n2. Slice avocado. Shred cheddar.\n3. Layer lettuce, beef, avocado, and cheese in a bowl.\n4. Drizzle with lime juice and serve immediately.",comments:[{user:"RK",name:"Rachel K",col:"#2d5a3d",text:"Perfect macro split for strict keto. Meal prepped 5 of these!",time:"1d ago",likes:22}]},
  {id:3,title:"Vegan Lentil & Quinoa Bowl",author:"plantpowered",emoji:"🌿",diet:["vegan","high-protein"],country:"AU",cals:380,protein:22,carbs:58,fat:8,rating:4.9,reviews:412,ingredients:[{name:"Red Lentils",amount:"100g",brand:"McKenzie's"},{name:"Quinoa",amount:"60g",brand:"Absolute Organic"},{name:"Baby Spinach",amount:"80g",brand:"Fresh"},{name:"Tahini",amount:"20g",brand:"Mayver's"}],method:"1. Rinse lentils and quinoa separately.\n2. Cook lentils 20 min in salted water, drain.\n3. Cook quinoa 15 min in 2x water ratio.\n4. Combine and toss with spinach and tahini dressing (tahini + lemon + garlic).",comments:[{user:"TO",name:"Tom O",col:"#c24b2a",text:"22g protein from plants is insane! Love this recipe.",time:"3h ago",likes:31},{user:"SF",name:"Sara F",col:"#5a3d7a",text:"Added roasted pumpkin seeds — 10/10.",time:"1d ago",likes:18}]},
  {id:4,title:"Overnight Oats Protein Stack",author:"fitnessfreya",emoji:"🥣",diet:["high-protein","bulking"],country:"AU",cals:520,protein:38,carbs:62,fat:12,rating:4.7,reviews:301,ingredients:[{name:"Rolled Oats",amount:"80g",brand:"Uncle Tobys"},{name:"Whey Protein",amount:"30g",brand:"Optimum Nutrition"},{name:"Banana",amount:"1 medium",brand:"Fresh"},{name:"Almond Milk",amount:"200ml",brand:"Milklab"}],method:"1. Mix oats, protein powder, and almond milk in a jar.\n2. Seal and refrigerate overnight (min 6 hours).\n3. Top with sliced banana and a drizzle of honey.\n4. Consume cold or microwave 60 sec.",comments:[{user:"BW",name:"Ben W",col:"#3d4a5c",text:"My go-to pre-workout meal. 38g protein before I even lift!",time:"6h ago",likes:9}]},
  {id:5,title:"Japanese Salmon Teriyaki",author:"tokyocooks",emoji:"🐟",diet:["low-carb","high-protein"],country:"JP",cals:440,protein:46,carbs:22,fat:18,rating:4.9,reviews:567,ingredients:[{name:"Atlantic Salmon",amount:"180g",brand:"Tassal"},{name:"Soy Sauce",amount:"30ml",brand:"Kikkoman"},{name:"Mirin",amount:"20ml",brand:"Obento"},{name:"Broccolini",amount:"120g",brand:"Fresh"}],method:"1. Mix soy sauce, mirin, and a tsp of sugar for teriyaki glaze.\n2. Marinate salmon 15 minutes.\n3. Heat pan to medium-high. Sear salmon 4 min each side, glazing frequently.\n4. Steam broccolini 3 min. Serve alongside with remaining glaze.",comments:[{user:"LN",name:"Lily N",col:"#2d5a3d",text:"Restaurant quality at home. Used the Localiser to find Kikkoman in AU!",time:"12h ago",likes:45},{user:"DR",name:"Dan R",col:"#b8922a",text:"Used the localiser feature — worked perfectly for me in Melbourne.",time:"2d ago",likes:12}]},
  {id:6,title:"Bulking Pasta Bolognese",author:"massmonster",emoji:"🍝",diet:["bulking"],country:"US",cals:780,protein:55,carbs:88,fat:22,rating:4.5,reviews:98,ingredients:[{name:"Lean Ground Beef",amount:"200g",brand:"Laura's Lean"},{name:"Rigatoni Pasta",amount:"120g",brand:"Barilla"},{name:"Tomato Passata",amount:"200g",brand:"Mutti"},{name:"Parmesan",amount:"30g",brand:"Zanetti"}],method:"1. Brown beef with onion and garlic.\n2. Add passata, simmer 20 min, season well.\n3. Cook pasta al dente per packet.\n4. Combine and top with grated parmesan.",comments:[]}
];

const LOCALISER={
  AU:[
    {ing:"Chicken Breast",us:"Tyson",local:"Ingham's",match:"exact",diff:"0%"},
    {ing:"Greek Yoghurt",us:"Fage",local:"Chobani AU",match:"exact",diff:"0%"},
    {ing:"Protein Powder",us:"Quest",local:"Optimum Nutrition AU",match:"good",diff:"~2g protein"},
    {ing:"Oats",us:"Quaker",local:"Uncle Tobys",match:"exact",diff:"0%"},
    {ing:"Almond Milk",us:"Silk",local:"Milklab",match:"exact",diff:"0%"},
    {ing:"Cheddar Cheese",us:"Tillamook",local:"Bega Tasty",match:"good",diff:"~1g fat"},
    {ing:"Ground Beef",us:"Laura's Lean",local:"Coles Finest 5% Fat",match:"exact",diff:"0%"},
  ],
  GB:[
    {ing:"Chicken Breast",us:"Tyson",local:"Waitrose Essential",match:"exact",diff:"0%"},
    {ing:"Greek Yoghurt",us:"Fage",local:"Fage UK",match:"exact",diff:"0%"},
    {ing:"Protein Powder",us:"Quest",local:"MyProtein Impact Whey",match:"good",diff:"~3g protein"},
    {ing:"Oats",us:"Quaker",local:"Quaker UK",match:"exact",diff:"0%"},
    {ing:"Almond Milk",us:"Silk",local:"Alpro Almond",match:"good",diff:"~0.5g fat"},
    {ing:"Cheddar Cheese",us:"Tillamook",local:"Cathedral City Mature",match:"exact",diff:"0%"},
    {ing:"Ground Beef",us:"Laura's Lean",local:"Waitrose British Lean",match:"exact",diff:"0%"},
  ],
  IN:[
    {ing:"Chicken Breast",us:"Tyson",local:"Venky's",match:"exact",diff:"0%"},
    {ing:"Greek Yoghurt",us:"Fage",local:"Epigamia Greek Yoghurt",match:"good",diff:"~2g protein"},
    {ing:"Protein Powder",us:"Quest",local:"MuscleBlaze Whey",match:"good",diff:"~2g protein"},
    {ing:"Oats",us:"Quaker",local:"Quaker India",match:"exact",diff:"0%"},
    {ing:"Almond Milk",us:"Silk",local:"So Good",match:"ok",diff:"~3g carbs"},
    {ing:"Cheddar Cheese",us:"Tillamook",local:"Amul Processed Cheddar",match:"good",diff:"~1g fat"},
    {ing:"Ground Beef",us:"Laura's Lean",local:"Nandus Lean Minced",match:"good",diff:"~2g fat"},
  ],
  JP:[
    {ing:"Chicken Breast",us:"Tyson",local:"Ito-Yokado Fresh",match:"exact",diff:"0%"},
    {ing:"Greek Yoghurt",us:"Fage",local:"Meiji Bulgarian Yoghurt",match:"good",diff:"~1g carbs"},
    {ing:"Protein Powder",us:"Quest",local:"DNS Whey",match:"good",diff:"~2g protein"},
    {ing:"Oats",us:"Quaker",local:"Quaker Japan",match:"exact",diff:"0%"},
    {ing:"Almond Milk",us:"Silk",local:"Kikkoman Almond Milk",match:"exact",diff:"0%"},
    {ing:"Cheddar Cheese",us:"Tillamook",local:"Snow Brand Sliced",match:"good",diff:"~1g fat"},
    {ing:"Ground Beef",us:"Laura's Lean",local:"Costco Japan Lean Beef",match:"exact",diff:"0%"},
  ],
  CA:[
    {ing:"Chicken Breast",us:"Tyson",local:"No Name Chicken",match:"exact",diff:"0%"},
    {ing:"Greek Yoghurt",us:"Fage",local:"Liberté Méditerranée",match:"exact",diff:"0%"},
    {ing:"Protein Powder",us:"Quest",local:"Kaizen Naturals Whey",match:"good",diff:"~2g protein"},
    {ing:"Oats",us:"Quaker",local:"Quaker CA",match:"exact",diff:"0%"},
    {ing:"Almond Milk",us:"Silk",local:"Silk Canada",match:"exact",diff:"0%"},
    {ing:"Cheddar Cheese",us:"Tillamook",local:"Black Diamond Cheddar",match:"exact",diff:"0%"},
    {ing:"Ground Beef",us:"Laura's Lean",local:"President's Choice Lean",match:"good",diff:"~1g fat"},
  ]
};

const SHOPS={
  "Sydney, NSW, Australia":{
    stores:[{name:"Woolworths Bondi Junction",dist:"0.4km",items:6},{name:"Coles Bondi",dist:"0.7km",items:5},{name:"Chemist Warehouse",dist:"1.1km",items:2},{name:"Asian Grocery · Haymarket",dist:"3.2km",items:7}],
    items:[
      {name:"Chicken Breast",brand:"Ingham's",amount:"500g",store:"Woolworths Bondi Junction",avail:true,price:8.50,sub:null},
      {name:"Greek Yoghurt",brand:"Chobani",amount:"500g",store:"Coles Bondi",avail:true,price:6.00,sub:null},
      {name:"Tikka Masala Paste",brand:"Patak's",amount:"285g",store:"Woolworths Bondi Junction",avail:true,price:4.20,sub:null},
      {name:"Basmati Rice",brand:"SunRice",amount:"1kg",store:"Woolworths Bondi Junction",avail:true,price:3.80,sub:null},
      {name:"Protein Powder",brand:"Optimum Nutrition",amount:"907g",store:"Chemist Warehouse",avail:true,price:59.99,sub:null},
      {name:"Rolled Oats",brand:"Uncle Tobys",amount:"1kg",store:"Coles Bondi",avail:true,price:3.40,sub:null},
      {name:"Mirin",brand:"Obento",amount:"300ml",store:"Asian Grocery · Haymarket",avail:false,price:5.50,sub:"Sub: dry sherry + pinch sugar (same macros)"},
      {name:"Tahini",brand:"Mayver's",amount:"385g",store:"Woolworths Bondi Junction",avail:true,price:8.00,sub:null},
    ]
  },
  "Melbourne, VIC, Australia":{
    stores:[{name:"Coles Melbourne Central",dist:"0.3km",items:7},{name:"Woolworths CBD",dist:"0.5km",items:6},{name:"Nutrition Warehouse Richmond",dist:"2.1km",items:3}],
    items:[
      {name:"Chicken Breast",brand:"Ingham's",amount:"500g",store:"Coles Melbourne Central",avail:true,price:8.20,sub:null},
      {name:"Greek Yoghurt",brand:"Chobani",amount:"500g",store:"Woolworths CBD",avail:true,price:5.90,sub:null},
      {name:"Tikka Masala Paste",brand:"Patak's",amount:"285g",store:"Coles Melbourne Central",avail:true,price:4.10,sub:null},
      {name:"Basmati Rice",brand:"SunRice",amount:"1kg",store:"Coles Melbourne Central",avail:true,price:3.70,sub:null},
      {name:"Protein Powder",brand:"Optimum Nutrition",amount:"907g",store:"Nutrition Warehouse Richmond",avail:true,price:57.99,sub:null},
      {name:"Rolled Oats",brand:"Uncle Tobys",amount:"1kg",store:"Woolworths CBD",avail:true,price:3.30,sub:null},
      {name:"Mirin",brand:"Obento",amount:"300ml",store:"Asian Grocery · Richmond",avail:false,price:5.50,sub:"Sub: dry sherry + pinch sugar"},
      {name:"Tahini",brand:"Mayver's",amount:"385g",store:"Coles Melbourne Central",avail:true,price:7.90,sub:null},
    ]
  },
  "London, UK":{
    stores:[{name:"Waitrose Kensington",dist:"0.6km",items:6},{name:"Tesco Express",dist:"0.2km",items:5},{name:"Sainsbury's Local",dist:"0.8km",items:4}],
    items:[
      {name:"Chicken Breast",brand:"Waitrose Essential",amount:"400g",store:"Waitrose Kensington",avail:true,price:5.20,sub:null},
      {name:"Greek Yoghurt",brand:"Fage UK",amount:"500g",store:"Tesco Express",avail:true,price:3.80,sub:null},
      {name:"Tikka Masala Paste",brand:"Patak's UK",amount:"285g",store:"Tesco Express",avail:true,price:2.90,sub:null},
      {name:"Basmati Rice",brand:"Tilda",amount:"1kg",store:"Sainsbury's Local",avail:true,price:3.50,sub:null},
      {name:"Protein Powder",brand:"MyProtein Impact",amount:"1kg",store:"Online — myprotein.com",avail:true,price:34.99,sub:null},
      {name:"Rolled Oats",brand:"Quaker UK",amount:"1kg",store:"Tesco Express",avail:true,price:1.80,sub:null},
      {name:"Mirin",brand:"Kikkoman",amount:"300ml",store:"Japan Centre Soho",avail:false,price:4.20,sub:"Sub: dry sherry + honey"},
      {name:"Tahini",brand:"Belazu",amount:"300g",store:"Waitrose Kensington",avail:true,price:4.50,sub:null},
    ]
  },
  "New York, USA":{
    stores:[{name:"Whole Foods SoHo",dist:"0.3km",items:8},{name:"Trader Joe's",dist:"0.8km",items:7},{name:"GNC Fifth Ave",dist:"1.2km",items:4}],
    items:[
      {name:"Chicken Breast",brand:"Tyson",amount:"1lb",store:"Whole Foods SoHo",avail:true,price:6.99,sub:null},
      {name:"Greek Yoghurt",brand:"Fage",amount:"17.6oz",store:"Trader Joe's",avail:true,price:5.49,sub:null},
      {name:"Tikka Masala Paste",brand:"Patak's",amount:"10oz",store:"Whole Foods SoHo",avail:true,price:4.99,sub:null},
      {name:"Basmati Rice",brand:"Royal",amount:"2lb",store:"Trader Joe's",avail:true,price:4.29,sub:null},
      {name:"Protein Powder",brand:"Quest",amount:"2lb",store:"GNC Fifth Ave",avail:true,price:44.99,sub:null},
      {name:"Rolled Oats",brand:"Quaker",amount:"2lb",store:"Whole Foods SoHo",avail:true,price:3.99,sub:null},
      {name:"Mirin",brand:"Kikkoman",amount:"10fl oz",store:"H Mart Koreatown",avail:true,price:3.79,sub:null},
      {name:"Tahini",brand:"Soom Foods",amount:"16oz",store:"Whole Foods SoHo",avail:true,price:9.99,sub:null},
    ]
  },
  "Toronto, Canada":{
    stores:[{name:"Loblaws Bay St",dist:"0.4km",items:7},{name:"Metro",dist:"0.6km",items:5},{name:"T&T Supermarket",dist:"1.8km",items:8}],
    items:[
      {name:"Chicken Breast",brand:"No Name",amount:"500g",store:"Loblaws Bay St",avail:true,price:7.99,sub:null},
      {name:"Greek Yoghurt",brand:"Liberté",amount:"500g",store:"Metro",avail:true,price:5.49,sub:null},
      {name:"Tikka Masala Paste",brand:"Patak's CA",amount:"285g",store:"Loblaws Bay St",avail:true,price:4.49,sub:null},
      {name:"Basmati Rice",brand:"Uncle Ben's",amount:"1kg",store:"Loblaws Bay St",avail:true,price:4.29,sub:null},
      {name:"Protein Powder",brand:"Kaizen",amount:"2lb",store:"GNC",avail:true,price:49.99,sub:null},
      {name:"Rolled Oats",brand:"Quaker CA",amount:"1kg",store:"Metro",avail:true,price:3.89,sub:null},
      {name:"Mirin",brand:"Kikkoman",amount:"300ml",store:"T&T Supermarket",avail:false,price:4.99,sub:"Sub: white wine + sugar"},
      {name:"Tahini",brand:"Nuts to You",amount:"365g",store:"Whole Foods",avail:true,price:7.99,sub:null},
    ]
  }
};

const FEED=[
  {user:"JS",name:"Jake S",col:"#3d4a5c",recipe:"High-Protein Chicken Tikka",emoji:"🍛",rating:5,caption:"Finally nailed this on attempt #3. The Patak's tikka paste is the secret. Hit exactly 52g protein per serving — verified!",time:"2h ago",bg:"#3d4a5c0a"},
  {user:"AM",name:"Amy M",col:"#b8922a",recipe:"Vegan Lentil & Quinoa Bowl",emoji:"🌿",rating:5,caption:"22g plant-based protein in one bowl is genuinely crazy. Made it for meal prep — 4 serves in 25 minutes.",time:"5h ago",bg:"#b8922a0a"},
  {user:"RK",name:"Rachel K",col:"#2d5a3d",recipe:"Keto Beef & Avocado Bowl",emoji:"🥑",rating:4,caption:"Only 8g net carbs. I live on this recipe during cut season. Swapped iceberg for butter lettuce = 10/10.",time:"1d ago",bg:"#2d5a3d0a"},
  {user:"DR",name:"Dan R",col:"#c24b2a",recipe:"Japanese Salmon Teriyaki",emoji:"🐟",rating:5,caption:"Used the Localiser to swap Kikkoman — available at my local Asian grocer in 10 minutes. Flawless macro match.",time:"2d ago",bg:"#c24b2a0a"},
];

const SUGGESTED=[
  {user:"PL",name:"priyalifts",col:"#b8922a",recipes:24,followers:"12.4k"},
  {user:"KM",name:"ketomike",col:"#3d4a5c",recipes:18,followers:"8.2k"},
  {user:"PP",name:"plantpowered",col:"#2d5a3d",recipes:31,followers:"22.1k"},
  {user:"FF",name:"fitnessfreya",col:"#c24b2a",recipes:15,followers:"9.7k"},
];

const COUNTRIES=[
  {code:"AU",flag:"🇦🇺",name:"Australia"},
  {code:"GB",flag:"🇬🇧",name:"United Kingdom"},
  {code:"IN",flag:"🇮🇳",name:"India"},
  {code:"JP",flag:"🇯🇵",name:"Japan"},
  {code:"CA",flag:"🇨🇦",name:"Canada"},
];

const TARGET_NUTRITION={
  chicken:{cals:165,protein:31,sodium:74},
  yoghurt:{cals:59,protein:10,sodium:36},
  tikka:{cals:80,protein:2,sodium:520},
  rice:{cals:130,protein:2.7,sodium:1},
  beef:{cals:217,protein:26,sodium:72},
  avocado:{cals:160,protein:2,sodium:7},
  cheese:{cals:113,protein:7,sodium:174},
  lettuce:{cals:17,protein:1.2,sodium:28},
  lentils:{cals:116,protein:9,sodium:2},
  quinoa:{cals:120,protein:4.4,sodium:7},
  spinach:{cals:23,protein:2.9,sodium:79},
  tahini:{cals:89,protein:2.6,sodium:17},
  oats:{cals:389,protein:16.9,sodium:2},
  whey:{cals:120,protein:24,sodium:50},
  banana:{cals:89,protein:1.1,sodium:1},
  almondmilk:{cals:15,protein:0.6,sodium:40},
  salmon:{cals:208,protein:20,sodium:59},
  soy:{cals:53,protein:8,sodium:5493},
  mirin:{cals:241,protein:0.3,sodium:6},
  broccolini:{cals:34,protein:2.8,sodium:33},
  pasta:{cals:131,protein:5,sodium:1},
  passata:{cals:29,protein:1.4,sodium:240},
  parmesan:{cals:431,protein:38,sodium:1529},
  generic:{cals:80,protein:5,sodium:120}
};

const SHOP_MODE_LABELS={cheapest:'lowest total cost',nutrition:'closest macro match',closest:'closest stores first'};

/* ═══════════════════ STATE ═══════════════════ */
let currentDiet="all";
let currentCountry="AU";
let currentRecipe=null;
let followState={};
let qtyState={};
let checkState={};
let tempComments={};
let deliveryOpt="express";
let orderPlaced=false;
let shopMode="cheapest";

/* ═══════════════════ API ═══════════════════ */
async function fetchRecipesFromBackend() {
  const res = await fetch(`${API_BASE}/api/recipes`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return await res.json();
}

async function loadRecipes() {
  try {
    backendRecipes = await fetchRecipesFromBackend();
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

/* ═══════════════════ NAVIGATION ═══════════════════ */
function showView(v){
  document.querySelectorAll('.page-view').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  const navEl=document.getElementById('nav-'+v);
  if(navEl)navEl.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ═══════════════════ RECIPE GRID ═══════════════════ */
const tagMap={
  'high-protein':{cls:'tag-protein',label:'High Protein'},
  'keto':{cls:'tag-keto',label:'Keto'},
  'vegan':{cls:'tag-vegan',label:'Vegan'},
  'low-carb':{cls:'tag-low',label:'Low Carb'},
  'bulking':{cls:'tag-bulk',label:'Bulking'},
  'vegetarian':{cls:'tag-vegan',label:'Vegetarian'},
  'low-sodium':{cls:'tag-low',label:'Low Sodium'},
  'low-sugar':{cls:'tag-low',label:'Low Sugar'},
  'quick':{cls:'tag-bulk',label:'Quick'},
  'requires-oven':{cls:'tag-keto',label:'Requires Oven'},
  'cutting':{cls:'tag-low',label:'Cutting'},
};

function setDiet(d,el){
  currentDiet=d;
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  filterRecipes();
}

function filterRecipes(){
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const grid=document.getElementById('recipeGrid');
  const filtered=backendRecipes.filter(r=>{
    const tags=(r.tags||[]).map(t=>t.slug);
    const dm=currentDiet==='all'||tags.includes(currentDiet);
    const sm=!q||r.title.toLowerCase().includes(q)||(r.description||'').toLowerCase().includes(q)||tags.some(t=>t.includes(q));
    return dm&&sm;
  });
  grid.innerHTML='';
  if(!filtered.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text3);font-family:var(--font-mono)">No recipes found. Try a different filter.</div>';
    return;
  }
  filtered.forEach(r=>grid.appendChild(buildBackendCard(r)));
}

function buildBackendCard(r){
  const d=document.createElement('div');
  d.className='recipe-card';
  const dietTags=(r.tags||[]).map(t=>`<span class="tag ${tagMap[t.slug]?.cls||''}">${tagMap[t.slug]?.label||t.name}</span>`).join('');
  const imageContent=r.image_url
    ? `<img src="${r.image_url}" alt="${r.title}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span style="font-size:72px;position:relative;z-index:1">🍽️</span>`;

  d.innerHTML=`
    <div class="card-img" style="background:#f9f6f0">
      ${imageContent}
      <div class="card-verified">✓ COMMUNITY</div>
    </div>
    <div class="card-body">
      <div class="card-tags">${dietTags}</div>
      <div class="card-title">${r.title}</div>
      <div class="card-author" style="font-family:var(--font-mono)">${r.description||'Community recipe'}</div>
      <div class="macro-strip">
        <div class="macro-box"><div class="macro-val">${r.calories??'-'}</div><div class="macro-lbl">Cal</div></div>
        <div class="macro-box"><div class="macro-val">${r.protein_g??'-'}g</div><div class="macro-lbl">Protein</div></div>
        <div class="macro-box"><div class="macro-val">${r.carbs_g??'-'}g</div><div class="macro-lbl">Carbs</div></div>
        <div class="macro-box"><div class="macro-val">${r.fat_g??'-'}g</div><div class="macro-lbl">Fat</div></div>
      </div>
      <div class="card-footer">
        <div class="rating-row">★ New <span class="rating-count">(community)</span></div>
        <div class="card-btns">
          <button class="card-btn" onclick="event.stopPropagation();goLocaliseByRecipeId('${r.id}')">🌍 Localise</button>
          <button class="card-btn shop" onclick="event.stopPropagation();goShopByRecipeId('${r.id}')">🛒 Order</button>
        </div>
      </div>
    </div>`;
  d.onclick=()=>openBackendDetail(r);
  return d;
}

function openBackendDetail(r){
  currentRecipe=r;
  const detailEmoji=document.getElementById('detailEmoji');
  if(detailEmoji){
    detailEmoji.innerHTML=r.image_url
      ? `<img src="${r.image_url}" alt="${r.title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
      : '🍽️';
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

function switchDetailTab(tab,el){
  document.querySelectorAll('.detail-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('detailIngredients').style.display=tab==='ingredients'?'block':'none';
  document.getElementById('detailMethod').style.display=tab==='method'?'block':'none';
  document.getElementById('detailComments').style.display=tab==='comments'?'block':'none';
}

function renderDetailComments(id){
  const c=tempComments[id]||[];
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
  if(!tempComments[id])tempComments[id]=[];
  tempComments[id].push({user:"JD",name:"You",col:"#b8922a",text:txt,time:"just now",likes:0});
  renderDetailComments(id);
  switchDetailTab('comments',document.querySelectorAll('.detail-tab')[2]);
}

function getRecipeById(id){
  return backendRecipes.find(r=>String(r.id)===String(id)) || currentRecipe || backendRecipes[0] || RECIPES[0];
}

function goToShopRecipe(){
  if(currentRecipe){
    const id=currentRecipe.id;
    goShopByRecipeId(id);
  }
}

function goLocalise(id){
  const found=RECIPES.find(r=>r.id===id)||currentRecipe||RECIPES[0];
  currentRecipe=found;
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=currentRecipe.title;
  showView('localiser');
}

function goLocaliseByRecipeId(id){
  currentRecipe=getRecipeById(id);
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=currentRecipe.title;
  showView('localiser');
}

function goShop(id){
  const found=RECIPES.find(r=>r.id===id)||currentRecipe||RECIPES[0];
  currentRecipe=found;
  const title=document.getElementById('shopRecipeName');
  if(title)title.textContent=currentRecipe.title;
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=currentRecipe.title;
  showView('shopping');
  refreshShopList();
}

function goShopByRecipeId(id){
  currentRecipe=getRecipeById(id);
  const title=document.getElementById('shopRecipeName');
  if(title)title.textContent=currentRecipe.title;
  const label=document.getElementById('localiserRecipeName');
  if(label)label.textContent=currentRecipe.title;
  showView('shopping');
  refreshShopList();
}

/* ═══════════════════ FEED ═══════════════════ */
function renderFeed(){
  document.getElementById('feedPosts').innerHTML=FEED.map((p,i)=>`
    <div class="feed-post">
      <div class="feed-post-header">
        <div class="feed-av" style="background:${p.col}18;color:${p.col}">${p.user}</div>
        <div style="flex:1">
          <div class="feed-post-name">${p.name}</div>
          <div class="feed-post-meta">made <span style="color:var(--gold)">${p.recipe}</span> · ${p.time}</div>
        </div>
        <button class="btn-follow ${followState['f'+i]?'following':''}" onclick="toggleFollow('f'+i,this)">${followState['f'+i]?'Following':'Follow'}</button>
      </div>
      <div class="feed-post-img" style="background:${p.bg}">${p.emoji}</div>
      <div class="feed-post-actions">
        <div class="star-rating" id="fstars${i}">${[1,2,3,4,5].map(s=>`<span class="star ${s<=p.rating?'lit':''}" onclick="rateFeedPost(${i},${s})">★</span>`).join('')}</div>
        <button class="action-btn" onclick="this.textContent=this.textContent==='🤍'?'❤️':'🤍'">🤍</button>
        <button class="action-btn">💬</button>
        <button class="action-btn">🔗</button>
      </div>
      <div class="feed-post-body">
        <div class="feed-recipe-tag">// ${p.recipe}</div>
        <div class="feed-caption">${p.caption}</div>
      </div>
    </div>`).join('');
  document.getElementById('suggestedChefs').innerHTML=SUGGESTED.map(u=>`
    <div class="follow-item">
      <div class="follow-av" style="background:${u.col}18;color:${u.col}">${u.user}</div>
      <div><div class="follow-name">@${u.name}</div><div class="follow-sub">${u.recipes} recipes · ${u.followers}</div></div>
      <button class="btn-follow ${followState[u.name]?'following':''}" onclick="toggleFollow('${u.name}',this)">${followState[u.name]?'✓':'Follow'}</button>
    </div>`).join('');
}

function toggleFollow(k,btn){
  followState[k]=!followState[k];
  btn.textContent=followState[k]?'Following':'Follow';
  btn.className='btn-follow'+(followState[k]?' following':'');
  if(followState[k])showToast('Now following!');
}

function rateFeedPost(i,r){
  document.querySelectorAll(`#fstars${i} .star`).forEach((s,idx)=>{s.className='star'+(idx<r?' lit':'')});
  showToast('Rating saved ★'.repeat(r));
}

/* ═══════════════════ LOCALISER ═══════════════════ */
function renderCountryGrid(){
  document.getElementById('countryGrid').innerHTML=COUNTRIES.map(c=>`
    <div class="country-card ${c.code===currentCountry?'active':''}" onclick="selectCountry('${c.code}',this)">
      <div class="country-flag">${c.flag}</div>
      <div class="country-name">${c.name}</div>
    </div>`).join('');
}

function selectCountry(code,el){
  currentCountry=code;
  document.querySelectorAll('.country-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  const c=COUNTRIES.find(x=>x.code===code);
  document.getElementById('locCountryLabel').textContent=c?c.name:code;
  renderSwapRows();
}

function renderSwapRows(){
  const data=LOCALISER[currentCountry]||LOCALISER.AU;
  document.getElementById('swapRows').innerHTML=data.map(d=>`
    <div class="swap-row">
      <div class="swap-td"><div class="swap-ingredient">${d.ing}</div></div>
      <div class="swap-td"><div class="brand-us">${d.us}</div></div>
      <div class="swap-td"><div class="brand-local">${d.local}</div></div>
      <div class="swap-td"><span class="match-chip ${d.match==='exact'?'match-exact':d.match==='good'?'match-good':'match-ok'}">${d.match==='exact'?'✓ Exact':'≈ Close'}</span></div>
      <div class="swap-td"><span class="diff-text" style="color:${d.diff==='0%'?'var(--forest)':'var(--gold)'}">${d.diff==='0%'?'±0':d.diff}</span></div>
    </div>`).join('');
}

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
  return currentRecipe||backendRecipes[0]||RECIPES[0];
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
    const selected=candidates.slice().sort((a,b)=>scoreCandidate(a,target,shopMode)-scoreCandidate(b,target,shopMode))[0];
    return {...selected, ingredientName:ingredient.name, target, idx};
  });
}

function getQtyBucket(region){
  const recipe=getRecipeForShop();
  const bucket=`${region}__recipe_${recipe.id}`;
  if(!qtyState[bucket])qtyState[bucket]={};
  return {bucket, qty:qtyState[bucket]};
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
    <div class="shop-metric"><div class="shop-metric-label">Estimated total</div><div class="shop-metric-value">$${totals.cost.toFixed(2)}</div><div class="shop-metric-sub">${SHOP_MODE_LABELS[shopMode]}</div></div>
    <div class="shop-metric"><div class="shop-metric-label">Macro delta</div><div class="shop-metric-value">${deltaCals>0?'+':''}${deltaCals}</div><div class="shop-metric-sub">cal vs target</div></div>
    <div class="shop-match-note"><strong>Smart basket:</strong> ${recipe.title} is being localised for <strong>${regionValue}</strong>. This basket keeps protein ${Number(deltaProtein)>=0?'+':''}${deltaProtein}g and sodium ${deltaSodium>0?'+':''}${deltaSodium}mg from the current target while prioritising <strong>${SHOP_MODE_LABELS[shopMode]}</strong>.</div>`;
}

function setShopMode(mode,btn){
  shopMode=mode;
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
      <div class="shop-check ${checkState[key]?'ticked':''}" onclick="toggleCheck('${key}',${i})" id="chk${i}">${checkState[key]?'✓':''}</div>
      <div class="shop-item-info">
        <div class="shop-item-name ${checkState[key]?'done':''}" id="shopname${i}">${item.ingredientName} → ${item.brand}</div>
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
  checkState[key]=!checkState[key];
  const chk=document.getElementById('chk'+i);
  const nm=document.getElementById('shopname'+i);
  chk.className='shop-check'+(checkState[key]?' ticked':'');
  chk.textContent=checkState[key]?'✓':'';
  if(nm){nm.className='shop-item-name'+(checkState[key]?' done':'');}
  updateCheckedCount();
}

function changeQty(bucket,i,delta){
  if(!qtyState[bucket])qtyState[bucket]={};
  qtyState[bucket][i]=Math.max(1,(qtyState[bucket][i]||1)+delta);
  refreshShopList();
  const panel=document.getElementById('orderPanel');
  if(panel&&panel.classList.contains('open'))buildOrderPanel();
}

function updateCheckedCount(){
  const region=document.getElementById('shopRegion')?.value || "Sydney, NSW, Australia";
  const recipe=getRecipeForShop();
  const prefix=`${region}__recipe_${recipe.id}_`;
  const checked=Object.entries(checkState).filter(([k,v])=>k.startsWith(prefix)&&v).length;
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
  orderPlaced=false;
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
  const delivery=deliveryOpt==='express'?9.99:deliveryOpt==='scheduled'?4.99:0;
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
      <div class="delivery-opt ${deliveryOpt==='express'?'selected':''}" onclick="selectDelivery('express',this)">
        <div class="delivery-opt-radio"><div class="delivery-dot"></div></div>
        <div><div class="delivery-opt-name">Express (2–4h)</div><div class="delivery-opt-detail">Today · Direct from store</div></div>
        <div class="delivery-opt-price">$9.99</div>
      </div>
      <div class="delivery-opt ${deliveryOpt==='scheduled'?'selected':''}" onclick="selectDelivery('scheduled',this)">
        <div class="delivery-opt-radio"><div class="delivery-dot"></div></div>
        <div><div class="delivery-opt-name">Scheduled Delivery</div><div class="delivery-opt-detail">Choose a 2h window</div></div>
        <div class="delivery-opt-price">$4.99</div>
      </div>
      <div class="delivery-opt ${deliveryOpt==='pickup'?'selected':''}" onclick="selectDelivery('pickup',this)">
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
  deliveryOpt=opt;
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

/* ═══════════════════ UPLOAD ═══════════════════ */
function addIngRow(){
  const list=document.getElementById('uploadIngredients');
  const row=document.createElement('div');
  row.className='ingredient-entry';
  row.innerHTML=`<input class="form-input" placeholder="Ingredient name"><input class="form-input" placeholder="Amount"><input class="form-input" placeholder="Brand name" oninput="checkBrand(this)"><span></span>`;
  list.appendChild(row);
}

function checkBrand(inp){
  const parent=inp.parentElement;
  const existing=parent.querySelector('.brand-verify');
  if(inp.value.length>2){
    if(!existing){
      const s=document.createElement('span');
      s.className='brand-verify';
      s.textContent='✓ Verified';
      parent.appendChild(s);
    }
  }else{
    if(existing)existing.remove();
  }
}

function simUpload(dz){
  dz.innerHTML=`<div class="drop-icon">✅</div><div class="drop-text" style="color:var(--forest)">Photo uploaded</div><div class="drop-sub">recipe_photo.jpg · 3.2MB</div>`;
}

async function submitRecipe(){
  const title=document.getElementById('upName')?.value.trim();
  const method=document.querySelector('.form-textarea')?.value.trim();
  const st=document.getElementById('uploadStatus');

  const rows=document.querySelectorAll('#uploadIngredients .ingredient-entry');
  const ingredients=[];

  rows.forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const name=inputs[0]?.value.trim();
    const amount=inputs[1]?.value.trim();
    const brandName=inputs[2]?.value.trim();

    if(name){
      ingredients.push({
        name,
        amount,
        unit:"",
        brandName
      });
    }
  });

  const selects=document.querySelectorAll('.form-select');
  const dietValue=selects[0]?.value || '';

  const tagSlugMap={
    "High Protein":"high-protein",
    "Keto":"keto",
    "Vegan":"vegan",
    "Low Carb":"low-carb",
    "Bulking":"bulking",
    "Cutting":"cutting"
  };

  const tags=tagSlugMap[dietValue] ? [tagSlugMap[dietValue]] : [];

  const numberInputs=document.querySelectorAll('.form-input[type="number"]');
  const prepTimeMinutes=numberInputs[0]?.value ? Number(numberInputs[0].value) : null;
  const servings=numberInputs[1]?.value ? Number(numberInputs[1].value) : null;
  const calories=numberInputs[2]?.value ? Number(numberInputs[2].value) : null;
  const proteinG=numberInputs[3]?.value ? Number(numberInputs[3].value) : null;
  const carbsG=numberInputs[4]?.value ? Number(numberInputs[4].value) : null;
  const fatG=numberInputs[5]?.value ? Number(numberInputs[5].value) : null;

  if(!title || !method || ingredients.length===0){
    st.innerHTML='<span style="color:var(--rust)">Please add a title, method, and at least one ingredient</span>';
    return;
  }

  const recipe={
    title,
    description:"",
    method,
    prepTimeMinutes,
    cookTimeMinutes:null,
    servings,
    calories,
    proteinG,
    carbsG,
    fatG,
    imageUrl:"https://placehold.co/600x400",
    ingredients,
    tags
  };

  try{
    st.innerHTML='<span style="color:var(--text2)">⏳ Uploading recipe...</span>';

    const res=await fetch(`${API_BASE}/api/recipes`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(recipe)
    });

    const data=await res.json();

    if(!res.ok){
      throw new Error(data.error || "Failed to create recipe");
    }

    st.innerHTML='<span class="detail-verified" style="font-size:13px">✓ Recipe live!</span>';
    await loadRecipes();
    showToast('Recipe uploaded successfully!');
    showView('home');
  }catch(err){
    console.error(err);
    st.innerHTML=`<span style="color:var(--rust)">${err.message}</span>`;
  }
}

/* ═══════════════════ TOAST ═══════════════════ */
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

/* ═══════════════════ INIT ═══════════════════ */
currentRecipe=RECIPES[0];
const localiserLabel=document.getElementById('localiserRecipeName');
if(localiserLabel)localiserLabel.textContent=currentRecipe.title;
renderFeed();
renderCountryGrid();
renderSwapRows();
refreshShopList();
loadRecipes();