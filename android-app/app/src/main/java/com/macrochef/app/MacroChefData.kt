package com.macrochef.app

import androidx.compose.ui.graphics.Color

enum class AppView(val label: String) {
    Home("Discover"),
    Detail("Detail"),
    Feed("Feed"),
    Upload("Upload"),
    Localiser("Localise"),
    Shopping("Shop"),
}

enum class DetailTab(val label: String) {
    Ingredients("Ingredients"),
    Method("Method"),
    Comments("Comments"),
}

enum class DeliveryOption(
    val label: String,
    val detail: String,
    val price: Double,
) {
    Express("Express (2-4h)", "Today · Direct from store", 9.99),
    Scheduled("Scheduled Delivery", "Choose a 2h window", 4.99),
    Pickup("Click & Collect", "Ready in 1h at nearest store", 0.0),
}

data class Ingredient(
    val name: String,
    val amount: String,
    val brand: String,
)

data class CommentEntry(
    val user: String,
    val name: String,
    val accent: Color,
    val text: String,
    val time: String,
    val likes: Int,
)

data class Recipe(
    val id: Int,
    val title: String,
    val author: String,
    val emoji: String,
    val diet: List<String>,
    val country: String,
    val calories: Int,
    val protein: Int,
    val carbs: Int,
    val fat: Int,
    val rating: Double,
    val reviews: Int,
    val ingredients: List<Ingredient>,
    val method: String,
    val comments: List<CommentEntry>,
)

data class SwapItem(
    val ingredient: String,
    val usBrand: String,
    val localBrand: String,
    val match: String,
    val diff: String,
)

data class FeedPost(
    val user: String,
    val name: String,
    val accent: Color,
    val recipe: String,
    val emoji: String,
    val rating: Int,
    val caption: String,
    val time: String,
    val background: Color,
)

data class SuggestedChef(
    val user: String,
    val name: String,
    val accent: Color,
    val recipes: Int,
    val followers: String,
)

data class CountryOption(
    val code: String,
    val flag: String,
    val name: String,
)

data class StoreAvailability(
    val name: String,
    val distance: String,
    val items: Int,
)

data class ShopItem(
    val name: String,
    val brand: String,
    val amount: String,
    val store: String,
    val available: Boolean,
    val price: Double,
    val substitute: String?,
)

data class RegionShop(
    val stores: List<StoreAvailability>,
    val items: List<ShopItem>,
)

data class UploadIngredientInput(
    val name: String = "",
    val amount: String = "",
    val brand: String = "",
)

object MacroChefData {
    val recipes = listOf(
        Recipe(
            id = 1,
            title = "High-Protein Chicken Tikka",
            author = "priyalifts",
            emoji = "🍛",
            diet = listOf("high-protein"),
            country = "IN",
            calories = 420,
            protein = 52,
            carbs = 18,
            fat = 14,
            rating = 4.8,
            reviews = 234,
            ingredients = listOf(
                Ingredient("Chicken Breast", "200g", "Ingham's"),
                Ingredient("Greek Yoghurt", "100g", "Chobani"),
                Ingredient("Tikka Masala Paste", "30g", "Patak's"),
                Ingredient("Basmati Rice", "80g", "SunRice"),
            ),
            method = "1. Dice chicken into 3cm cubes.\n2. Mix yoghurt with tikka paste and marinate chicken for 2+ hours.\n3. Cook rice per packet instructions.\n4. Grill chicken at 220C for 18-22 minutes, turning halfway.\n5. Rest 5 minutes before serving over rice.",
            comments = listOf(
                CommentEntry("JS", "Jake S", Slate, "Made this last night. 52g protein confirmed on my macro tracker!", "2h ago", 14),
                CommentEntry("AM", "Amy M", Gold, "Swapped chicken for tofu. Still incredible.", "5h ago", 7),
            ),
        ),
        Recipe(
            id = 2,
            title = "Keto Beef & Avocado Bowl",
            author = "ketomike",
            emoji = "🥑",
            diet = listOf("keto", "low-carb"),
            country = "US",
            calories = 580,
            protein = 42,
            carbs = 8,
            fat = 42,
            rating = 4.6,
            reviews = 189,
            ingredients = listOf(
                Ingredient("Ground Beef 93%", "150g", "Laura's Lean"),
                Ingredient("Avocado", "1 whole", "Fresh"),
                Ingredient("Cheddar", "40g", "Tillamook"),
                Ingredient("Butter Lettuce", "80g", "Fresh"),
            ),
            method = "1. Brown ground beef in a pan over high heat, seasoning with salt, pepper, and cumin.\n2. Slice avocado and shred cheddar.\n3. Layer lettuce, beef, avocado, and cheese in a bowl.\n4. Drizzle with lime juice and serve immediately.",
            comments = listOf(
                CommentEntry("RK", "Rachel K", Forest, "Perfect macro split for strict keto. Meal prepped 5 of these!", "1d ago", 22),
            ),
        ),
        Recipe(
            id = 3,
            title = "Vegan Lentil & Quinoa Bowl",
            author = "plantpowered",
            emoji = "🌿",
            diet = listOf("vegan", "high-protein"),
            country = "AU",
            calories = 380,
            protein = 22,
            carbs = 58,
            fat = 8,
            rating = 4.9,
            reviews = 412,
            ingredients = listOf(
                Ingredient("Red Lentils", "100g", "McKenzie's"),
                Ingredient("Quinoa", "60g", "Absolute Organic"),
                Ingredient("Baby Spinach", "80g", "Fresh"),
                Ingredient("Tahini", "20g", "Mayver's"),
            ),
            method = "1. Rinse lentils and quinoa separately.\n2. Cook lentils for 20 minutes in salted water, then drain.\n3. Cook quinoa for 15 minutes in a 2:1 water ratio.\n4. Combine and toss with spinach and tahini dressing.",
            comments = listOf(
                CommentEntry("TO", "Tom O", Rust, "22g protein from plants is insane. Love this recipe.", "3h ago", 31),
                CommentEntry("SF", "Sara F", Color(0xFF5A3D7A), "Added roasted pumpkin seeds. 10/10.", "1d ago", 18),
            ),
        ),
        Recipe(
            id = 4,
            title = "Overnight Oats Protein Stack",
            author = "fitnessfreya",
            emoji = "🥣",
            diet = listOf("high-protein", "bulking"),
            country = "AU",
            calories = 520,
            protein = 38,
            carbs = 62,
            fat = 12,
            rating = 4.7,
            reviews = 301,
            ingredients = listOf(
                Ingredient("Rolled Oats", "80g", "Uncle Tobys"),
                Ingredient("Whey Protein", "30g", "Optimum Nutrition"),
                Ingredient("Banana", "1 medium", "Fresh"),
                Ingredient("Almond Milk", "200ml", "Milklab"),
            ),
            method = "1. Mix oats, protein powder, and almond milk in a jar.\n2. Seal and refrigerate overnight for at least 6 hours.\n3. Top with sliced banana and a drizzle of honey.\n4. Consume cold or microwave for 60 seconds.",
            comments = listOf(
                CommentEntry("BW", "Ben W", Slate, "My go-to pre-workout meal. 38g protein before I even lift!", "6h ago", 9),
            ),
        ),
        Recipe(
            id = 5,
            title = "Japanese Salmon Teriyaki",
            author = "tokyocooks",
            emoji = "🐟",
            diet = listOf("low-carb", "high-protein"),
            country = "JP",
            calories = 440,
            protein = 46,
            carbs = 22,
            fat = 18,
            rating = 4.9,
            reviews = 567,
            ingredients = listOf(
                Ingredient("Atlantic Salmon", "180g", "Tassal"),
                Ingredient("Soy Sauce", "30ml", "Kikkoman"),
                Ingredient("Mirin", "20ml", "Obento"),
                Ingredient("Broccolini", "120g", "Fresh"),
            ),
            method = "1. Mix soy sauce, mirin, and a teaspoon of sugar for the teriyaki glaze.\n2. Marinate salmon for 15 minutes.\n3. Heat pan to medium-high and sear salmon for 4 minutes each side, glazing often.\n4. Steam broccolini for 3 minutes and serve with remaining glaze.",
            comments = listOf(
                CommentEntry("LN", "Lily N", Forest, "Restaurant quality at home. Used the Localiser to find Kikkoman in AU!", "12h ago", 45),
                CommentEntry("DR", "Dan R", Gold, "Used the Localiser feature. Worked perfectly for me in Melbourne.", "2d ago", 12),
            ),
        ),
        Recipe(
            id = 6,
            title = "Bulking Pasta Bolognese",
            author = "massmonster",
            emoji = "🍝",
            diet = listOf("bulking"),
            country = "US",
            calories = 780,
            protein = 55,
            carbs = 88,
            fat = 22,
            rating = 4.5,
            reviews = 98,
            ingredients = listOf(
                Ingredient("Lean Ground Beef", "200g", "Laura's Lean"),
                Ingredient("Rigatoni Pasta", "120g", "Barilla"),
                Ingredient("Tomato Passata", "200g", "Mutti"),
                Ingredient("Parmesan", "30g", "Zanetti"),
            ),
            method = "1. Brown beef with onion and garlic.\n2. Add passata, simmer for 20 minutes, and season well.\n3. Cook pasta al dente per packet instructions.\n4. Combine and top with grated parmesan.",
            comments = emptyList(),
        ),
    )

    val localiser = mapOf(
        "AU" to listOf(
            SwapItem("Chicken Breast", "Tyson", "Ingham's", "exact", "0%"),
            SwapItem("Greek Yoghurt", "Fage", "Chobani AU", "exact", "0%"),
            SwapItem("Protein Powder", "Quest", "Optimum Nutrition AU", "good", "~2g protein"),
            SwapItem("Oats", "Quaker", "Uncle Tobys", "exact", "0%"),
            SwapItem("Almond Milk", "Silk", "Milklab", "exact", "0%"),
            SwapItem("Cheddar Cheese", "Tillamook", "Bega Tasty", "good", "~1g fat"),
            SwapItem("Ground Beef", "Laura's Lean", "Coles Finest 5% Fat", "exact", "0%"),
        ),
        "GB" to listOf(
            SwapItem("Chicken Breast", "Tyson", "Waitrose Essential", "exact", "0%"),
            SwapItem("Greek Yoghurt", "Fage", "Fage UK", "exact", "0%"),
            SwapItem("Protein Powder", "Quest", "MyProtein Impact Whey", "good", "~3g protein"),
            SwapItem("Oats", "Quaker", "Quaker UK", "exact", "0%"),
            SwapItem("Almond Milk", "Silk", "Alpro Almond", "good", "~0.5g fat"),
            SwapItem("Cheddar Cheese", "Tillamook", "Cathedral City Mature", "exact", "0%"),
            SwapItem("Ground Beef", "Laura's Lean", "Waitrose British Lean", "exact", "0%"),
        ),
        "IN" to listOf(
            SwapItem("Chicken Breast", "Tyson", "Venky's", "exact", "0%"),
            SwapItem("Greek Yoghurt", "Fage", "Epigamia Greek Yoghurt", "good", "~2g protein"),
            SwapItem("Protein Powder", "Quest", "MuscleBlaze Whey", "good", "~2g protein"),
            SwapItem("Oats", "Quaker", "Quaker India", "exact", "0%"),
            SwapItem("Almond Milk", "Silk", "So Good", "ok", "~3g carbs"),
            SwapItem("Cheddar Cheese", "Tillamook", "Amul Processed Cheddar", "good", "~1g fat"),
            SwapItem("Ground Beef", "Laura's Lean", "Nandus Lean Minced", "good", "~2g fat"),
        ),
        "JP" to listOf(
            SwapItem("Chicken Breast", "Tyson", "Ito-Yokado Fresh", "exact", "0%"),
            SwapItem("Greek Yoghurt", "Fage", "Meiji Bulgarian Yoghurt", "good", "~1g carbs"),
            SwapItem("Protein Powder", "Quest", "DNS Whey", "good", "~2g protein"),
            SwapItem("Oats", "Quaker", "Quaker Japan", "exact", "0%"),
            SwapItem("Almond Milk", "Silk", "Kikkoman Almond Milk", "exact", "0%"),
            SwapItem("Cheddar Cheese", "Tillamook", "Snow Brand Sliced", "good", "~1g fat"),
            SwapItem("Ground Beef", "Laura's Lean", "Costco Japan Lean Beef", "exact", "0%"),
        ),
        "CA" to listOf(
            SwapItem("Chicken Breast", "Tyson", "No Name Chicken", "exact", "0%"),
            SwapItem("Greek Yoghurt", "Fage", "Liberte Mediterranee", "exact", "0%"),
            SwapItem("Protein Powder", "Quest", "Kaizen Naturals Whey", "good", "~2g protein"),
            SwapItem("Oats", "Quaker", "Quaker CA", "exact", "0%"),
            SwapItem("Almond Milk", "Silk", "Silk Canada", "exact", "0%"),
            SwapItem("Cheddar Cheese", "Tillamook", "Black Diamond Cheddar", "exact", "0%"),
            SwapItem("Ground Beef", "Laura's Lean", "President's Choice Lean", "good", "~1g fat"),
        ),
    )

    val shops = linkedMapOf(
        "Sydney, NSW, Australia" to RegionShop(
            stores = listOf(
                StoreAvailability("Woolworths Bondi Junction", "0.4km", 6),
                StoreAvailability("Coles Bondi", "0.7km", 5),
                StoreAvailability("Chemist Warehouse", "1.1km", 2),
                StoreAvailability("Asian Grocery - Haymarket", "3.2km", 7),
            ),
            items = listOf(
                ShopItem("Chicken Breast", "Ingham's", "500g", "Woolworths Bondi Junction", true, 8.50, null),
                ShopItem("Greek Yoghurt", "Chobani", "500g", "Coles Bondi", true, 6.00, null),
                ShopItem("Tikka Masala Paste", "Patak's", "285g", "Woolworths Bondi Junction", true, 4.20, null),
                ShopItem("Basmati Rice", "SunRice", "1kg", "Woolworths Bondi Junction", true, 3.80, null),
                ShopItem("Protein Powder", "Optimum Nutrition", "907g", "Chemist Warehouse", true, 59.99, null),
                ShopItem("Rolled Oats", "Uncle Tobys", "1kg", "Coles Bondi", true, 3.40, null),
                ShopItem("Mirin", "Obento", "300ml", "Asian Grocery - Haymarket", false, 5.50, "Sub: dry sherry + pinch sugar (same macros)"),
                ShopItem("Tahini", "Mayver's", "385g", "Woolworths Bondi Junction", true, 8.00, null),
            ),
        ),
        "Melbourne, VIC, Australia" to RegionShop(
            stores = listOf(
                StoreAvailability("Coles Melbourne Central", "0.3km", 7),
                StoreAvailability("Woolworths CBD", "0.5km", 6),
                StoreAvailability("Nutrition Warehouse Richmond", "2.1km", 3),
            ),
            items = listOf(
                ShopItem("Chicken Breast", "Ingham's", "500g", "Coles Melbourne Central", true, 8.20, null),
                ShopItem("Greek Yoghurt", "Chobani", "500g", "Woolworths CBD", true, 5.90, null),
                ShopItem("Tikka Masala Paste", "Patak's", "285g", "Coles Melbourne Central", true, 4.10, null),
                ShopItem("Basmati Rice", "SunRice", "1kg", "Coles Melbourne Central", true, 3.70, null),
                ShopItem("Protein Powder", "Optimum Nutrition", "907g", "Nutrition Warehouse Richmond", true, 57.99, null),
                ShopItem("Rolled Oats", "Uncle Tobys", "1kg", "Woolworths CBD", true, 3.30, null),
                ShopItem("Mirin", "Obento", "300ml", "Asian Grocery - Richmond", false, 5.50, "Sub: dry sherry + pinch sugar"),
                ShopItem("Tahini", "Mayver's", "385g", "Coles Melbourne Central", true, 7.90, null),
            ),
        ),
        "London, UK" to RegionShop(
            stores = listOf(
                StoreAvailability("Waitrose Kensington", "0.6km", 6),
                StoreAvailability("Tesco Express", "0.2km", 5),
                StoreAvailability("Sainsbury's Local", "0.8km", 4),
            ),
            items = listOf(
                ShopItem("Chicken Breast", "Waitrose Essential", "400g", "Waitrose Kensington", true, 5.20, null),
                ShopItem("Greek Yoghurt", "Fage UK", "500g", "Tesco Express", true, 3.80, null),
                ShopItem("Tikka Masala Paste", "Patak's UK", "285g", "Tesco Express", true, 2.90, null),
                ShopItem("Basmati Rice", "Tilda", "1kg", "Sainsbury's Local", true, 3.50, null),
                ShopItem("Protein Powder", "MyProtein Impact", "1kg", "Online - myprotein.com", true, 34.99, null),
                ShopItem("Rolled Oats", "Quaker UK", "1kg", "Tesco Express", true, 1.80, null),
                ShopItem("Mirin", "Kikkoman", "300ml", "Japan Centre Soho", false, 4.20, "Sub: dry sherry + honey"),
                ShopItem("Tahini", "Belazu", "300g", "Waitrose Kensington", true, 4.50, null),
            ),
        ),
        "New York, USA" to RegionShop(
            stores = listOf(
                StoreAvailability("Whole Foods SoHo", "0.3km", 8),
                StoreAvailability("Trader Joe's", "0.8km", 7),
                StoreAvailability("GNC Fifth Ave", "1.2km", 4),
            ),
            items = listOf(
                ShopItem("Chicken Breast", "Tyson", "1lb", "Whole Foods SoHo", true, 6.99, null),
                ShopItem("Greek Yoghurt", "Fage", "17.6oz", "Trader Joe's", true, 5.49, null),
                ShopItem("Tikka Masala Paste", "Patak's", "10oz", "Whole Foods SoHo", true, 4.99, null),
                ShopItem("Basmati Rice", "Royal", "2lb", "Trader Joe's", true, 4.29, null),
                ShopItem("Protein Powder", "Quest", "2lb", "GNC Fifth Ave", true, 44.99, null),
                ShopItem("Rolled Oats", "Quaker", "2lb", "Whole Foods SoHo", true, 3.99, null),
                ShopItem("Mirin", "Kikkoman", "10fl oz", "H Mart Koreatown", true, 3.79, null),
                ShopItem("Tahini", "Soom Foods", "16oz", "Whole Foods SoHo", true, 9.99, null),
            ),
        ),
        "Toronto, Canada" to RegionShop(
            stores = listOf(
                StoreAvailability("Loblaws Bay St", "0.4km", 7),
                StoreAvailability("Metro", "0.6km", 5),
                StoreAvailability("T&T Supermarket", "1.8km", 8),
            ),
            items = listOf(
                ShopItem("Chicken Breast", "No Name", "500g", "Loblaws Bay St", true, 7.99, null),
                ShopItem("Greek Yoghurt", "Liberte", "500g", "Metro", true, 5.49, null),
                ShopItem("Tikka Masala Paste", "Patak's CA", "285g", "Loblaws Bay St", true, 4.49, null),
                ShopItem("Basmati Rice", "Uncle Ben's", "1kg", "Loblaws Bay St", true, 4.29, null),
                ShopItem("Protein Powder", "Kaizen", "2lb", "GNC", true, 49.99, null),
                ShopItem("Rolled Oats", "Quaker CA", "1kg", "Metro", true, 3.89, null),
                ShopItem("Mirin", "Kikkoman", "300ml", "T&T Supermarket", false, 4.99, "Sub: white wine + sugar"),
                ShopItem("Tahini", "Nuts to You", "365g", "Whole Foods", true, 7.99, null),
            ),
        ),
    )

    val feed = listOf(
        FeedPost("JS", "Jake S", Slate, "High-Protein Chicken Tikka", "🍛", 5, "Finally nailed this on attempt #3. The Patak's tikka paste is the secret. Hit exactly 52g protein per serving - verified!", "2h ago", Slate.copy(alpha = 0.06f)),
        FeedPost("AM", "Amy M", Gold, "Vegan Lentil & Quinoa Bowl", "🌿", 5, "22g plant-based protein in one bowl is genuinely crazy. Made it for meal prep - 4 serves in 25 minutes.", "5h ago", Gold.copy(alpha = 0.06f)),
        FeedPost("RK", "Rachel K", Forest, "Keto Beef & Avocado Bowl", "🥑", 4, "Only 8g net carbs. I live on this recipe during cut season. Swapped iceberg for butter lettuce = 10/10.", "1d ago", Forest.copy(alpha = 0.06f)),
        FeedPost("DR", "Dan R", Rust, "Japanese Salmon Teriyaki", "🐟", 5, "Used the Localiser to swap Kikkoman - available at my local Asian grocer in 10 minutes. Flawless macro match.", "2d ago", Rust.copy(alpha = 0.06f)),
    )

    val suggested = listOf(
        SuggestedChef("PL", "priyalifts", Gold, 24, "12.4k"),
        SuggestedChef("KM", "ketomike", Slate, 18, "8.2k"),
        SuggestedChef("PP", "plantpowered", Forest, 31, "22.1k"),
        SuggestedChef("FF", "fitnessfreya", Rust, 15, "9.7k"),
    )

    val countries = listOf(
        CountryOption("AU", "🇦🇺", "Australia"),
        CountryOption("GB", "🇬🇧", "United Kingdom"),
        CountryOption("IN", "🇮🇳", "India"),
        CountryOption("JP", "🇯🇵", "Japan"),
        CountryOption("CA", "🇨🇦", "Canada"),
    )
}
