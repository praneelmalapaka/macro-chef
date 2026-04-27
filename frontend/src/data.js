export const RECIPES=[
  {id:1,title:"High-Protein Chicken Tikka",author:"priyalifts",emoji:"🍛",diet:["high-protein"],country:"IN",cals:420,protein:52,carbs:18,fat:14,rating:4.8,reviews:234,ingredients:[{name:"Chicken Breast",amount:"200g",brand:"Ingham's"},{name:"Greek Yoghurt",amount:"100g",brand:"Chobani"},{name:"Tikka Masala Paste",amount:"30g",brand:"Patak's"},{name:"Basmati Rice",amount:"80g",brand:"SunRice"}],method:"1. Dice chicken into 3cm cubes.\n2. Mix yoghurt with tikka paste and marinate chicken for 2+ hours.\n3. Cook rice per packet instructions.\n4. Grill chicken at 220°C for 18–22 minutes, turning halfway.\n5. Rest 5 min before serving over rice.",comments:[{user:"JS",name:"Jake S",col:"#3d4a5c",text:"Made this last night — 52g protein confirmed on my macro tracker!",time:"2h ago",likes:14},{user:"AM",name:"Amy M",col:"#b8922a",text:"Swapped chicken for tofu. Still incredible.",time:"5h ago",likes:7}]},
  {id:2,title:"Keto Beef & Avocado Bowl",author:"ketomike",emoji:"🥑",diet:["keto","low-carb"],country:"US",cals:580,protein:42,carbs:8,fat:42,rating:4.6,reviews:189,ingredients:[{name:"Ground Beef 93%",amount:"150g",brand:"Laura's Lean"},{name:"Avocado",amount:"1 whole",brand:"Fresh"},{name:"Cheddar",amount:"40g",brand:"Tillamook"},{name:"Butter Lettuce",amount:"80g",brand:"Fresh"}],method:"1. Brown ground beef in a pan over high heat, seasoning with salt, pepper, and cumin.\n2. Slice avocado. Shred cheddar.\n3. Layer lettuce, beef, avocado, and cheese in a bowl.\n4. Drizzle with lime juice and serve immediately.",comments:[{user:"RK",name:"Rachel K",col:"#2d5a3d",text:"Perfect macro split for strict keto. Meal prepped 5 of these!",time:"1d ago",likes:22}]},
  {id:3,title:"Vegan Lentil & Quinoa Bowl",author:"plantpowered",emoji:"🌿",diet:["vegan","high-protein"],country:"AU",cals:380,protein:22,carbs:58,fat:8,rating:4.9,reviews:412,ingredients:[{name:"Red Lentils",amount:"100g",brand:"McKenzie's"},{name:"Quinoa",amount:"60g",brand:"Absolute Organic"},{name:"Baby Spinach",amount:"80g",brand:"Fresh"},{name:"Tahini",amount:"20g",brand:"Mayver's"}],method:"1. Rinse lentils and quinoa separately.\n2. Cook lentils 20 min in salted water, drain.\n3. Cook quinoa 15 min in 2x water ratio.\n4. Combine and toss with spinach and tahini dressing (tahini + lemon + garlic).",comments:[{user:"TO",name:"Tom O",col:"#c24b2a",text:"22g protein from plants is insane! Love this recipe.",time:"3h ago",likes:31},{user:"SF",name:"Sara F",col:"#5a3d7a",text:"Added roasted pumpkin seeds — 10/10.",time:"1d ago",likes:18}]},
  {id:4,title:"Overnight Oats Protein Stack",author:"fitnessfreya",emoji:"🥣",diet:["high-protein","bulking"],country:"AU",cals:520,protein:38,carbs:62,fat:12,rating:4.7,reviews:301,ingredients:[{name:"Rolled Oats",amount:"80g",brand:"Uncle Tobys"},{name:"Whey Protein",amount:"30g",brand:"Optimum Nutrition"},{name:"Banana",amount:"1 medium",brand:"Fresh"},{name:"Almond Milk",amount:"200ml",brand:"Milklab"}],method:"1. Mix oats, protein powder, and almond milk in a jar.\n2. Seal and refrigerate overnight (min 6 hours).\n3. Top with sliced banana and a drizzle of honey.\n4. Consume cold or microwave 60 sec.",comments:[{user:"BW",name:"Ben W",col:"#3d4a5c",text:"My go-to pre-workout meal. 38g protein before I even lift!",time:"6h ago",likes:9}]},
  {id:5,title:"Japanese Salmon Teriyaki",author:"tokyocooks",emoji:"🐟",diet:["low-carb","high-protein"],country:"JP",cals:440,protein:46,carbs:22,fat:18,rating:4.9,reviews:567,ingredients:[{name:"Atlantic Salmon",amount:"180g",brand:"Tassal"},{name:"Soy Sauce",amount:"30ml",brand:"Kikkoman"},{name:"Mirin",amount:"20ml",brand:"Obento"},{name:"Broccolini",amount:"120g",brand:"Fresh"}],method:"1. Mix soy sauce, mirin, and a tsp of sugar for teriyaki glaze.\n2. Marinate salmon 15 minutes.\n3. Heat pan to medium-high. Sear salmon 4 min each side, glazing frequently.\n4. Steam broccolini 3 min. Serve alongside with remaining glaze.",comments:[{user:"LN",name:"Lily N",col:"#2d5a3d",text:"Restaurant quality at home. Used the Localiser to find Kikkoman in AU!",time:"12h ago",likes:45},{user:"DR",name:"Dan R",col:"#b8922a",text:"Used the localiser feature — worked perfectly for me in Melbourne.",time:"2d ago",likes:12}]},
  {id:6,title:"Bulking Pasta Bolognese",author:"massmonster",emoji:"🍝",diet:["bulking"],country:"US",cals:780,protein:55,carbs:88,fat:22,rating:4.5,reviews:98,ingredients:[{name:"Lean Ground Beef",amount:"200g",brand:"Laura's Lean"},{name:"Rigatoni Pasta",amount:"120g",brand:"Barilla"},{name:"Tomato Passata",amount:"200g",brand:"Mutti"},{name:"Parmesan",amount:"30g",brand:"Zanetti"}],method:"1. Brown beef with onion and garlic.\n2. Add passata, simmer 20 min, season well.\n3. Cook pasta al dente per packet.\n4. Combine and top with grated parmesan.",comments:[]}
];

export const LOCALISER={
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

export const SHOPS={
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

export const FEED=[
  {user:"JS",name:"Jake S",col:"#3d4a5c",recipe:"High-Protein Chicken Tikka",emoji:"🍛",rating:5,caption:"Finally nailed this on attempt #3. The Patak's tikka paste is the secret. Hit exactly 52g protein per serving — verified!",time:"2h ago",bg:"#3d4a5c0a"},
  {user:"AM",name:"Amy M",col:"#b8922a",recipe:"Vegan Lentil & Quinoa Bowl",emoji:"🌿",rating:5,caption:"22g plant-based protein in one bowl is genuinely crazy. Made it for meal prep — 4 serves in 25 minutes.",time:"5h ago",bg:"#b8922a0a"},
  {user:"RK",name:"Rachel K",col:"#2d5a3d",recipe:"Keto Beef & Avocado Bowl",emoji:"🥑",rating:4,caption:"Only 8g net carbs. I live on this recipe during cut season. Swapped iceberg for butter lettuce = 10/10.",time:"1d ago",bg:"#2d5a3d0a"},
  {user:"DR",name:"Dan R",col:"#c24b2a",recipe:"Japanese Salmon Teriyaki",emoji:"🐟",rating:5,caption:"Used the Localiser to swap Kikkoman — available at my local Asian grocer in 10 minutes. Flawless macro match.",time:"2d ago",bg:"#c24b2a0a"},
];

export const SUGGESTED=[
  {user:"PL",name:"priyalifts",col:"#b8922a",recipes:24,followers:"12.4k"},
  {user:"KM",name:"ketomike",col:"#3d4a5c",recipes:18,followers:"8.2k"},
  {user:"PP",name:"plantpowered",col:"#2d5a3d",recipes:31,followers:"22.1k"},
  {user:"FF",name:"fitnessfreya",col:"#c24b2a",recipes:15,followers:"9.7k"},
];

export const COUNTRIES=[
  {code:"AU",flag:"🇦🇺",name:"Australia"},
  {code:"GB",flag:"🇬🇧",name:"United Kingdom"},
  {code:"IN",flag:"🇮🇳",name:"India"},
  {code:"JP",flag:"🇯🇵",name:"Japan"},
  {code:"CA",flag:"🇨🇦",name:"Canada"},
];

export const TARGET_NUTRITION={
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

export const SHOP_MODE_LABELS={cheapest:'lowest total cost',nutrition:'closest macro match',closest:'closest stores first'};
