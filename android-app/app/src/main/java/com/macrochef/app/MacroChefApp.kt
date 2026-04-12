package com.macrochef.app

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

private data class OrderTotals(
    val subtotal: Double,
    val delivery: Double,
    val service: Double,
    val total: Double,
)

@Composable
fun MacroChefApp() {
    val recipes = remember { MacroChefData.recipes }
    val feed = remember { MacroChefData.feed }
    val suggested = remember { MacroChefData.suggested }
    val countries = remember { MacroChefData.countries }
    val localiser = remember { MacroChefData.localiser }
    val shops = remember { MacroChefData.shops }

    var currentViewName by rememberSaveable { mutableStateOf(AppView.Home.name) }
    var currentRecipeId by rememberSaveable { mutableStateOf(recipes.first().id) }
    var currentDiet by rememberSaveable { mutableStateOf("all") }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var detailTabName by rememberSaveable { mutableStateOf(DetailTab.Ingredients.name) }
    var currentCountry by rememberSaveable { mutableStateOf(countries.first().code) }
    var selectedRegion by rememberSaveable { mutableStateOf(shops.keys.first()) }
    var showOrderSheet by rememberSaveable { mutableStateOf(false) }
    var orderPlaced by rememberSaveable { mutableStateOf(false) }
    var deliveryOptionName by rememberSaveable { mutableStateOf(DeliveryOption.Express.name) }
    var uploadName by rememberSaveable { mutableStateOf("") }
    var uploadPrepTime by rememberSaveable { mutableStateOf("") }
    var uploadServings by rememberSaveable { mutableStateOf("") }
    var uploadDiet by rememberSaveable { mutableStateOf("High Protein") }
    var uploadCountry by rememberSaveable { mutableStateOf("Australia") }
    var uploadCalories by rememberSaveable { mutableStateOf("") }
    var uploadProtein by rememberSaveable { mutableStateOf("") }
    var uploadCarbs by rememberSaveable { mutableStateOf("") }
    var uploadFat by rememberSaveable { mutableStateOf("") }
    var uploadMethod by rememberSaveable { mutableStateOf("") }
    var uploadStatus by rememberSaveable { mutableStateOf("") }
    var uploadPhotoAdded by rememberSaveable { mutableStateOf(false) }
    var newComment by rememberSaveable { mutableStateOf("") }
    var orderAddress by rememberSaveable { mutableStateOf("42 Bondi Road") }
    var orderCity by rememberSaveable { mutableStateOf("Bondi, NSW 2026") }
    var orderNote by rememberSaveable { mutableStateOf("") }
    var uploadRows by remember {
        mutableStateOf(
            listOf(
                UploadIngredientInput(),
                UploadIngredientInput(),
                UploadIngredientInput(),
            ),
        )
    }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val commentsByRecipe = remember {
        mutableStateMapOf<Int, SnapshotStateList<CommentEntry>>().apply {
            recipes.forEach { recipe ->
                put(recipe.id, recipe.comments.toMutableStateList())
            }
        }
    }
    val feedRatings = remember {
        mutableStateMapOf<Int, Int>().apply {
            feed.forEachIndexed { index, post -> put(index, post.rating) }
        }
    }
    val likedFeedPosts = remember { mutableStateMapOf<Int, Boolean>() }
    val followState = remember { mutableStateMapOf<String, Boolean>() }
    val quantityState = remember { mutableStateMapOf<String, Int>() }
    val checkedState = remember { mutableStateMapOf<String, Boolean>() }
    val cartCountOverrides = remember { mutableStateMapOf<String, Int>() }
    val commentLikeState = remember { mutableStateMapOf<String, Boolean>() }

    val currentView = AppView.valueOf(currentViewName)
    val detailTab = DetailTab.valueOf(detailTabName)
    val deliveryOption = DeliveryOption.valueOf(deliveryOptionName)
    val currentRecipe = recipes.first { it.id == currentRecipeId }
    val currentComments = commentsByRecipe.getOrPut(currentRecipeId) { mutableListOf<CommentEntry>().toMutableStateList() }
    val currentRegionShop = shops[selectedRegion] ?: shops.values.first()
    val activeCartCount = cartCountOverrides[selectedRegion] ?: currentRegionShop.items.indices.sumOf { index ->
        quantityState[quantityKey(selectedRegion, index)] ?: 1
    }

    BackHandler(enabled = showOrderSheet || currentView != AppView.Home) {
        when {
            showOrderSheet -> showOrderSheet = false
            currentView == AppView.Detail -> {
                currentViewName = AppView.Home.name
                detailTabName = DetailTab.Ingredients.name
            }
            else -> currentViewName = AppView.Home.name
        }
    }

    Scaffold(
        containerColor = Paper,
        topBar = {
            AppTopBar(
                activeView = currentView,
                cartCount = activeCartCount,
                onNavigate = { view ->
                    currentViewName = view.name
                    if (view != AppView.Detail) {
                        detailTabName = DetailTab.Ingredients.name
                    }
                },
                onOpenOrder = {
                    orderPlaced = false
                    showOrderSheet = true
                },
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
        ) {
            when (currentView) {
                AppView.Home -> HomeScreen(
                    recipes = recipes,
                    searchQuery = searchQuery,
                    currentDiet = currentDiet,
                    onSearchChange = { searchQuery = it },
                    onDietChange = { currentDiet = it },
                    onRecipeOpen = { recipe ->
                        currentRecipeId = recipe.id
                        currentViewName = AppView.Detail.name
                        detailTabName = DetailTab.Ingredients.name
                    },
                    onLocalise = { recipe ->
                        currentRecipeId = recipe.id
                        currentViewName = AppView.Localiser.name
                    },
                    onShop = { recipe ->
                        currentRecipeId = recipe.id
                        currentViewName = AppView.Shopping.name
                    },
                    onShareRecipe = { currentViewName = AppView.Upload.name },
                )

                AppView.Detail -> DetailScreen(
                    recipe = currentRecipe,
                    comments = currentComments,
                    detailTab = detailTab,
                    commentDraft = newComment,
                    commentLikeState = commentLikeState,
                    onBack = {
                        currentViewName = AppView.Home.name
                        detailTabName = DetailTab.Ingredients.name
                    },
                    onTabChange = { detailTabName = it.name },
                    onCommentDraftChange = { newComment = it },
                    onPostComment = {
                        val trimmed = newComment.trim()
                        if (trimmed.isNotEmpty()) {
                            commentsByRecipe.getOrPut(currentRecipe.id) { mutableListOf<CommentEntry>().toMutableStateList() }
                                .add(CommentEntry("JD", "You", Gold, trimmed, "just now", 0))
                            newComment = ""
                            detailTabName = DetailTab.Comments.name
                            scope.launch { snackbarHostState.showSnackbar("Comment posted") }
                        }
                    },
                    onToggleCommentLike = { index ->
                        val key = "${currentRecipe.id}_$index"
                        commentLikeState[key] = !(commentLikeState[key] ?: false)
                    },
                    onShop = {
                        currentViewName = AppView.Shopping.name
                    },
                    onLocalise = {
                        currentViewName = AppView.Localiser.name
                    },
                )

                AppView.Feed -> FeedScreen(
                    feed = feed,
                    suggested = suggested,
                    ratings = feedRatings,
                    likedPosts = likedFeedPosts,
                    followState = followState,
                    onRate = { index, rating ->
                        feedRatings[index] = rating
                        scope.launch { snackbarHostState.showSnackbar("Rating saved ${"★".repeat(rating)}") }
                    },
                    onToggleLike = { index ->
                        likedFeedPosts[index] = !(likedFeedPosts[index] ?: false)
                    },
                    onToggleFollow = { key ->
                        val next = !(followState[key] ?: false)
                        followState[key] = next
                        if (next) {
                            scope.launch { snackbarHostState.showSnackbar("Now following!") }
                        }
                    },
                )

                AppView.Upload -> UploadScreen(
                    recipeName = uploadName,
                    prepTime = uploadPrepTime,
                    servings = uploadServings,
                    dietaryCategory = uploadDiet,
                    countryOfOrigin = uploadCountry,
                    calories = uploadCalories,
                    protein = uploadProtein,
                    carbs = uploadCarbs,
                    fat = uploadFat,
                    method = uploadMethod,
                    ingredientRows = uploadRows,
                    uploadStatus = uploadStatus,
                    uploadPhotoAdded = uploadPhotoAdded,
                    onRecipeNameChange = { uploadName = it },
                    onPrepTimeChange = { uploadPrepTime = it },
                    onServingsChange = { uploadServings = it },
                    onDietaryCategoryChange = { uploadDiet = it },
                    onCountryOfOriginChange = { uploadCountry = it },
                    onCaloriesChange = { uploadCalories = it },
                    onProteinChange = { uploadProtein = it },
                    onCarbsChange = { uploadCarbs = it },
                    onFatChange = { uploadFat = it },
                    onMethodChange = { uploadMethod = it },
                    onIngredientChange = { index, row -> uploadRows = uploadRows.updated(index, row) },
                    onAddIngredient = { uploadRows = uploadRows + UploadIngredientInput() },
                    onPhotoUpload = { uploadPhotoAdded = true },
                    onSubmit = {
                        if (uploadName.isBlank()) {
                            uploadStatus = "Please enter a recipe name"
                        } else {
                            uploadStatus = "Verifying macros via brand database..."
                            scope.launch {
                                delay(1200)
                                uploadStatus = "Macros verified · Recipe live!"
                                snackbarHostState.showSnackbar("Recipe submitted")
                            }
                        }
                    },
                )

                AppView.Localiser -> LocaliserScreen(
                    currentRecipe = currentRecipe,
                    countries = countries,
                    currentCountry = currentCountry,
                    swaps = localiser[currentCountry] ?: emptyList(),
                    onCountrySelected = { currentCountry = it },
                )

                AppView.Shopping -> ShoppingScreen(
                    recipe = currentRecipe,
                    regionShop = currentRegionShop,
                    regions = shops.keys.toList(),
                    selectedRegion = selectedRegion,
                    checkedState = checkedState,
                    quantityState = quantityState,
                    onRegionSelected = {
                        selectedRegion = it
                        orderPlaced = false
                    },
                    onToggleChecked = { index ->
                        val key = quantityKey(selectedRegion, index)
                        checkedState[key] = !(checkedState[key] ?: false)
                        cartCountOverrides.remove(selectedRegion)
                    },
                    onQuantityChange = { index, delta ->
                        val key = quantityKey(selectedRegion, index)
                        val current = quantityState[key] ?: 1
                        quantityState[key] = (current + delta).coerceAtLeast(1)
                        cartCountOverrides.remove(selectedRegion)
                    },
                    onOpenOrder = {
                        orderPlaced = false
                        showOrderSheet = true
                    },
                )
            }

            if (showOrderSheet) {
                val totals = calculateTotals(
                    regionShop = currentRegionShop,
                    selectedRegion = selectedRegion,
                    quantityState = quantityState,
                    deliveryOption = deliveryOption,
                )

                OrderBottomSheet(
                    recipe = currentRecipe,
                    region = selectedRegion,
                    regionShop = currentRegionShop,
                    totals = totals,
                    deliveryOption = deliveryOption,
                    orderPlaced = orderPlaced,
                    address = orderAddress,
                    city = orderCity,
                    note = orderNote,
                    quantityState = quantityState,
                    selectedRegion = selectedRegion,
                    onDismiss = { showOrderSheet = false },
                    onDeliveryChange = { deliveryOptionName = it.name },
                    onAddressChange = { orderAddress = it },
                    onCityChange = { orderCity = it },
                    onNoteChange = { orderNote = it },
                    onPlaceOrder = {
                        scope.launch {
                            delay(1200)
                            orderPlaced = true
                            cartCountOverrides[selectedRegion] = 0
                            snackbarHostState.showSnackbar("Order confirmed")
                        }
                    },
                    onDone = {
                        showOrderSheet = false
                        currentViewName = AppView.Home.name
                    },
                )
            }
        }
    }
}

@Composable
private fun AppTopBar(
    activeView: AppView,
    cartCount: Int,
    onNavigate: (AppView) -> Unit,
    onOpenOrder: () -> Unit,
) {
    Surface(
        color = Paper,
        shadowElevation = 6.dp,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = buildAnnotatedString {
                        append("Macro")
                        pushStyle(SpanStyle(color = Gold))
                        append("Chef")
                        pop()
                    },
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                    ),
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BadgedBox(
                        badge = {
                            if (cartCount > 0) {
                                Badge(
                                    containerColor = Gold,
                                    contentColor = Ink,
                                ) {
                                    Text(cartCount.toString())
                                }
                            }
                        },
                    ) {
                        Button(
                            onClick = onOpenOrder,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Ink,
                                contentColor = Paper,
                            ),
                            shape = RoundedCornerShape(12.dp),
                        ) {
                            Text("Order")
                        }
                    }

                    Avatar(text = "JD", accent = Gold)
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf(AppView.Home, AppView.Feed, AppView.Upload, AppView.Localiser, AppView.Shopping).forEach { view ->
                    FilterChip(
                        selected = activeView == view || (activeView == AppView.Detail && view == AppView.Home),
                        onClick = { onNavigate(view) },
                        label = { Text(view.label) },
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(
    recipes: List<Recipe>,
    searchQuery: String,
    currentDiet: String,
    onSearchChange: (String) -> Unit,
    onDietChange: (String) -> Unit,
    onRecipeOpen: (Recipe) -> Unit,
    onLocalise: (Recipe) -> Unit,
    onShop: (Recipe) -> Unit,
    onShareRecipe: () -> Unit,
) {
    val scrollState = rememberScrollState()
    val scope = rememberCoroutineScope()
    val filteredRecipes = remember(searchQuery, currentDiet, recipes) {
        recipes.filter { recipe ->
            val dietMatch = currentDiet == "all" || recipe.diet.contains(currentDiet)
            val query = searchQuery.trim().lowercase()
            val searchMatch = query.isBlank() ||
                recipe.title.lowercase().contains(query) ||
                recipe.author.lowercase().contains(query) ||
                recipe.diet.any { it.contains(query) }
            dietMatch && searchMatch
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(28.dp),
            tonalElevation = 1.dp,
            shadowElevation = 6.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                Eyebrow("// verified macros · global pantry")
                Text(
                    buildAnnotatedString {
                        append("Eat ")
                        pushStyle(SpanStyle(color = Gold, fontStyle = FontStyle.Italic))
                        append("precise.")
                        pop()
                        append("\nCook ")
                        pushStyle(SpanStyle(color = Gold, fontStyle = FontStyle.Italic))
                        append("global.")
                        pop()
                    },
                    style = MaterialTheme.typography.displayLarge,
                )
                Text(
                    "Every recipe verified by brand-level nutritional data. Browse, cook, order your ingredients - then let us handle the rest.",
                    style = MaterialTheme.typography.bodyLarge,
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = { scope.launch { scrollState.animateScrollTo(700) } },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Ink,
                            contentColor = Paper,
                        ),
                    ) {
                        Text("Browse Recipes")
                    }
                    OutlinedButton(onClick = onShareRecipe) {
                        Text("Share a Recipe")
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    StatBlock("2,841", "Recipes")
                    StatBlock("14k+", "Chefs")
                    StatBlock("99%", "Verified macros")
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    HeroFoodCell("🍛", SurfaceAlt)
                    HeroFoodCell("🥑", Warm)
                    HeroFoodCell("🐟", Warm)
                    HeroFoodCell("🌿", Cream)
                }
            }
        }

        HorizontalDivider(color = Border)

        SectionHeader(
            eyebrow = "// community recipes",
            title = "Find your next perfect meal",
            action = "View all 2,841",
        )

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchChange,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Search recipes, chefs, ingredients...") },
                    shape = RoundedCornerShape(14.dp),
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    listOf(
                        "all" to "All",
                        "high-protein" to "High Protein",
                        "keto" to "Keto",
                        "vegan" to "Vegan",
                        "low-carb" to "Low Carb",
                        "bulking" to "Bulking",
                    ).forEach { (key, label) ->
                        FilterChip(
                            selected = currentDiet == key,
                            onClick = { onDietChange(key) },
                            label = { Text(label) },
                        )
                    }
                }
            }
        }

        if (filteredRecipes.isEmpty()) {
            EmptyStateCard("No recipes found. Try a different filter.")
        } else {
            filteredRecipes.forEach { recipe ->
                RecipeCard(
                    recipe = recipe,
                    onOpen = { onRecipeOpen(recipe) },
                    onLocalise = { onLocalise(recipe) },
                    onShop = { onShop(recipe) },
                )
            }
        }

        FeatureStrip()
    }
}

@Composable
private fun DetailScreen(
    recipe: Recipe,
    comments: List<CommentEntry>,
    detailTab: DetailTab,
    commentDraft: String,
    commentLikeState: Map<String, Boolean>,
    onBack: () -> Unit,
    onTabChange: (DetailTab) -> Unit,
    onCommentDraftChange: (String) -> Unit,
    onPostComment: () -> Unit,
    onToggleCommentLike: (Int) -> Unit,
    onShop: () -> Unit,
    onLocalise: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        TextButton(
            onClick = onBack,
            modifier = Modifier.wrapContentWidth(),
        ) {
            Text("Back to recipes")
        }

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(26.dp),
            shadowElevation = 4.dp,
        ) {
            Column(
                modifier = Modifier.padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(22.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(SurfaceAlt, Warm),
                            ),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(recipe.emoji, fontSize = 80.sp)
                }

                TagRow(recipe.diet)
                Text(recipe.title, style = MaterialTheme.typography.displayMedium)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Avatar(text = recipe.author.take(2).uppercase(), accent = Gold)
                    Column {
                        Text("@${recipe.author}", style = MaterialTheme.typography.titleMedium)
                        Text("${recipe.reviews} reviews · ★ ${recipe.rating}", style = MaterialTheme.typography.bodyMedium)
                    }
                }

                VerifiedPill("Macros verified · Brand data confirmed")

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    MacroSummaryCard(recipe.calories.toString(), "Calories / serving")
                    MacroSummaryCard("${recipe.protein}g", "Protein")
                    MacroSummaryCard("${recipe.carbs}g", "Carbs")
                    MacroSummaryCard("${recipe.fat}g", "Fat")
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = onShop,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Gold,
                            contentColor = Ink,
                        ),
                    ) {
                        Text("Order Ingredients")
                    }
                    OutlinedButton(onClick = onLocalise) {
                        Text("Localise Recipe")
                    }
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            DetailTab.values().forEach { tab ->
                FilterChip(
                    selected = detailTab == tab,
                    onClick = { onTabChange(tab) },
                    label = { Text(tab.label) },
                )
            }
        }

        when (detailTab) {
            DetailTab.Ingredients -> {
                recipe.ingredients.forEach { ingredient ->
                    IngredientCard(ingredient)
                }
            }

            DetailTab.Method -> {
                Surface(
                    color = SurfaceMain,
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Text(
                        recipe.method,
                        modifier = Modifier.padding(18.dp),
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            }

            DetailTab.Comments -> {
                Surface(
                    color = SurfaceMain,
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Text("${comments.size} Comments", style = MaterialTheme.typography.titleMedium)
                        comments.forEachIndexed { index, comment ->
                            val liked = commentLikeState["${recipe.id}_$index"] ?: false
                            CommentCard(
                                comment = comment,
                                liked = liked,
                                onToggleLike = { onToggleCommentLike(index) },
                            )
                        }

                        OutlinedTextField(
                            value = commentDraft,
                            onValueChange = onCommentDraftChange,
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Add a comment...") },
                            shape = RoundedCornerShape(16.dp),
                        )
                        Button(
                            onClick = onPostComment,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Ink,
                                contentColor = Paper,
                            ),
                        ) {
                            Text("Post")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FeedScreen(
    feed: List<FeedPost>,
    suggested: List<SuggestedChef>,
    ratings: Map<Int, Int>,
    likedPosts: Map<Int, Boolean>,
    followState: Map<String, Boolean>,
    onRate: (Int, Int) -> Unit,
    onToggleLike: (Int) -> Unit,
    onToggleFollow: (String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        feed.forEachIndexed { index, post ->
            Surface(
                color = SurfaceMain,
                shape = RoundedCornerShape(24.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 18.dp, top = 18.dp, end = 18.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Avatar(post.user, post.accent)
                            Column {
                                Text(post.name, style = MaterialTheme.typography.titleMedium)
                                Text("made ${post.recipe} · ${post.time}", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                        val followKey = "feed_$index"
                        FollowButton(
                            following = followState[followKey] ?: false,
                            onClick = { onToggleFollow(followKey) },
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .background(post.background),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(post.emoji, fontSize = 90.sp)
                    }

                    Column(
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                (1..5).forEach { star ->
                                    val lit = star <= (ratings[index] ?: post.rating)
                                    Text(
                                        "★",
                                        color = if (lit) Gold else BorderStrong,
                                        fontSize = 24.sp,
                                        modifier = Modifier.clickable { onRate(index, star) },
                                    )
                                }
                            }
                            TextButton(onClick = { onToggleLike(index) }) {
                                Text(if (likedPosts[index] == true) "Loved" else "Like")
                            }
                        }

                        Text("// ${post.recipe}", style = MaterialTheme.typography.labelMedium.copy(color = Gold))
                        Text(post.caption, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Suggested Chefs", style = MaterialTheme.typography.titleMedium)
                suggested.forEach { chef ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Avatar(chef.user, chef.accent)
                            Column {
                                Text("@${chef.name}", style = MaterialTheme.typography.titleMedium)
                                Text("${chef.recipes} recipes · ${chef.followers}", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                        FollowButton(
                            following = followState[chef.name] ?: false,
                            onClick = { onToggleFollow(chef.name) },
                        )
                    }
                }

                HorizontalDivider(color = Border)
                Text("Your Stats", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatBlock("12", "Recipes")
                    StatBlock("847", "Followers")
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatBlock("4.8★", "Rating")
                    StatBlock("2.1k", "Cooked")
                }
            }
        }
    }
}

@Composable
private fun UploadScreen(
    recipeName: String,
    prepTime: String,
    servings: String,
    dietaryCategory: String,
    countryOfOrigin: String,
    calories: String,
    protein: String,
    carbs: String,
    fat: String,
    method: String,
    ingredientRows: List<UploadIngredientInput>,
    uploadStatus: String,
    uploadPhotoAdded: Boolean,
    onRecipeNameChange: (String) -> Unit,
    onPrepTimeChange: (String) -> Unit,
    onServingsChange: (String) -> Unit,
    onDietaryCategoryChange: (String) -> Unit,
    onCountryOfOriginChange: (String) -> Unit,
    onCaloriesChange: (String) -> Unit,
    onProteinChange: (String) -> Unit,
    onCarbsChange: (String) -> Unit,
    onFatChange: (String) -> Unit,
    onMethodChange: (String) -> Unit,
    onIngredientChange: (Int, UploadIngredientInput) -> Unit,
    onAddIngredient: () -> Unit,
    onPhotoUpload: () -> Unit,
    onSubmit: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Eyebrow("// share with the community")
        Text("Upload a Recipe", style = MaterialTheme.typography.displayMedium)
        Text(
            "Add brand names per ingredient and we'll verify your macros against live nutrition databases.",
            style = MaterialTheme.typography.bodyLarge,
        )

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                LabeledField("Recipe Name", recipeName, onRecipeNameChange, "e.g. High-Protein Chicken Tikka")
                LabeledField("Prep Time (mins)", prepTime, onPrepTimeChange, "30", KeyboardType.Number)
                LabeledField("Servings", servings, onServingsChange, "4", KeyboardType.Number)
                LabeledField("Dietary Category", dietaryCategory, onDietaryCategoryChange, "High Protein")
                LabeledField("Country of Origin", countryOfOrigin, onCountryOfOriginChange, "Australia")

                Text(
                    "Ingredients & Brands - brand names unlock macro verification",
                    style = MaterialTheme.typography.labelLarge.copy(color = TextMuted),
                )
                ingredientRows.forEachIndexed { index, row ->
                    Surface(
                        color = SurfaceAlt,
                        shape = RoundedCornerShape(18.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            LabeledField("Ingredient", row.name, { onIngredientChange(index, row.copy(name = it)) }, "Ingredient name")
                            LabeledField("Amount", row.amount, { onIngredientChange(index, row.copy(amount = it)) }, "Amount")
                            LabeledField("Brand", row.brand, { onIngredientChange(index, row.copy(brand = it)) }, "Brand name")
                            if (row.brand.length > 2) {
                                VerifiedPill("Verified")
                            }
                        }
                    }
                }
                OutlinedButton(onClick = onAddIngredient) {
                    Text("+ Add ingredient")
                }

                LabeledField("Calories (per serving)", calories, onCaloriesChange, "420", KeyboardType.Number)
                LabeledField("Protein (g)", protein, onProteinChange, "38", KeyboardType.Number)
                LabeledField("Carbs (g)", carbs, onCarbsChange, "32", KeyboardType.Number)
                LabeledField("Fat (g)", fat, onFatChange, "12", KeyboardType.Number)
                LabeledField("Method", method, onMethodChange, "Step-by-step cooking instructions...", singleLine = false)

                Surface(
                    color = SurfaceAlt,
                    shape = RoundedCornerShape(22.dp),
                    border = androidx.compose.foundation.BorderStroke(2.dp, BorderStrong),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onPhotoUpload() },
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(22.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(if (uploadPhotoAdded) "✅" else "📸", fontSize = 34.sp)
                        Text(
                            if (uploadPhotoAdded) "Photo uploaded" else "Tap to upload photo",
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            if (uploadPhotoAdded) "recipe_photo.jpg · 3.2MB" else "JPG, PNG, HEIC · max 20MB",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }

                Button(
                    onClick = onSubmit,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Ink,
                        contentColor = Paper,
                    ),
                ) {
                    Text("Submit for Verification")
                }

                if (uploadStatus.isNotBlank()) {
                    Text(
                        uploadStatus,
                        color = when {
                            uploadStatus.contains("live") -> Forest
                            uploadStatus.contains("Please") -> Rust
                            else -> TextMuted
                        },
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}

@Composable
private fun LocaliserScreen(
    currentRecipe: Recipe,
    countries: List<CountryOption>,
    currentCountry: String,
    swaps: List<SwapItem>,
    onCountrySelected: (String) -> Unit,
) {
    val currentCountryName = countries.firstOrNull { it.code == currentCountry }?.name ?: currentCountry

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Eyebrow("// ingredient intelligence")
        Text("Global Localiser", style = MaterialTheme.typography.displayMedium)
        Text(
            "Select your country. We'll swap every US brand with a local equivalent that keeps macros within 2%.",
            style = MaterialTheme.typography.bodyLarge,
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            countries.forEach { country ->
                FilterChip(
                    selected = currentCountry == country.code,
                    onClick = { onCountrySelected(country.code) },
                    label = { Text("${country.flag} ${country.name}") },
                )
            }
        }

        Text(
            "Showing ingredient swaps for ${currentRecipe.title} (US -> $currentCountryName)",
            style = MaterialTheme.typography.bodyLarge.copy(color = TextMuted),
        )

        swaps.forEach { item ->
            Surface(
                color = SurfaceMain,
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(item.ingredient, style = MaterialTheme.typography.labelLarge.copy(fontFamily = FontFamily.Monospace))
                    Text("US Brand: ${item.usBrand}", style = MaterialTheme.typography.bodyMedium)
                    Text("Local Brand: ${item.localBrand}", style = MaterialTheme.typography.bodyLarge.copy(color = Gold))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        MatchPill(item.match)
                        Text(
                            if (item.diff == "0%") "±0" else item.diff,
                            style = MaterialTheme.typography.labelLarge.copy(
                                color = if (item.diff == "0%") Forest else Gold,
                                fontFamily = FontFamily.Monospace,
                            ),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ShoppingScreen(
    recipe: Recipe,
    regionShop: RegionShop,
    regions: List<String>,
    selectedRegion: String,
    checkedState: Map<String, Boolean>,
    quantityState: Map<String, Int>,
    onRegionSelected: (String) -> Unit,
    onToggleChecked: (Int) -> Unit,
    onQuantityChange: (Int, Int) -> Unit,
    onOpenOrder: () -> Unit,
) {
    var regionMenuOpen by remember { mutableStateOf(false) }
    val availableCount = regionShop.items.count { it.available }
    val checkedCount = regionShop.items.indices.count { checkedState[quantityKey(selectedRegion, it)] == true }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Eyebrow("// smart grocery")
        Text("Shop & Order", style = MaterialTheme.typography.displayMedium)
        Text(
            "We find what's in stock near you and place the order. Delivery in 2-4 hours.",
            style = MaterialTheme.typography.bodyLarge,
        )

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Eyebrow("Shopping for")
                Text(recipe.title, style = MaterialTheme.typography.titleLarge)

                Box {
                    OutlinedButton(onClick = { regionMenuOpen = true }) {
                        Text(selectedRegion, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    DropdownMenu(
                        expanded = regionMenuOpen,
                        onDismissRequest = { regionMenuOpen = false },
                    ) {
                        regions.forEach { region ->
                            DropdownMenuItem(
                                text = { Text(region) },
                                onClick = {
                                    onRegionSelected(region)
                                    regionMenuOpen = false
                                },
                            )
                        }
                    }
                }

                AvailabilityRing(
                    available = availableCount,
                    total = regionShop.items.size,
                )

                Button(
                    onClick = onOpenOrder,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Gold,
                        contentColor = Ink,
                    ),
                ) {
                    Text("Place Order")
                }
            }
        }

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text("Nearby Stores", style = MaterialTheme.typography.titleMedium)
                regionShop.stores.forEach { store ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text(store.name, style = MaterialTheme.typography.titleMedium)
                            Text("${store.distance} away · ${store.items} items", style = MaterialTheme.typography.bodyMedium)
                        }
                        Text("${store.items} items", color = Gold, style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }

        Surface(
            color = SurfaceMain,
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Shopping List", style = MaterialTheme.typography.titleMedium)
                    Text("$checkedCount checked", style = MaterialTheme.typography.labelMedium)
                }

                regionShop.items.forEachIndexed { index, item ->
                    val quantity = quantityState[quantityKey(selectedRegion, index)] ?: 1
                    val checked = checkedState[quantityKey(selectedRegion, index)] ?: false
                    ShopItemRow(
                        item = item,
                        quantity = quantity,
                        checked = checked,
                        onToggleChecked = { onToggleChecked(index) },
                        onIncrement = { onQuantityChange(index, 1) },
                        onDecrement = { onQuantityChange(index, -1) },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OrderBottomSheet(
    recipe: Recipe,
    region: String,
    regionShop: RegionShop,
    totals: OrderTotals,
    deliveryOption: DeliveryOption,
    orderPlaced: Boolean,
    address: String,
    city: String,
    note: String,
    quantityState: Map<String, Int>,
    selectedRegion: String,
    onDismiss: () -> Unit,
    onDeliveryChange: (DeliveryOption) -> Unit,
    onAddressChange: (String) -> Unit,
    onCityChange: (String) -> Unit,
    onNoteChange: (String) -> Unit,
    onPlaceOrder: () -> Unit,
    onDone: () -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = SurfaceMain,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (orderPlaced) {
                Text("Order Placed!", style = MaterialTheme.typography.displayMedium)
                Text(
                    "Your groceries for ${recipe.title} are being picked. You'll receive a message when the shopper is on the way.",
                    style = MaterialTheme.typography.bodyLarge,
                )
                Surface(
                    color = SurfaceAlt,
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Eyebrow("Live tracking")
                        TrackingStep("Order confirmed", true)
                        TrackingStep("Shopper assigned - Jake at Woolworths", true)
                        TrackingStep("Picking items...", false)
                        TrackingStep("Out for delivery", false)
                        TrackingStep("Delivered", false)
                    }
                }
                Text("Est. arrival: 2:45 PM · Order #MC-8821", style = MaterialTheme.typography.labelMedium)
                Button(
                    onClick = onDone,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Ink,
                        contentColor = Paper,
                    ),
                ) {
                    Text("Back to Recipes")
                }
            } else {
                Text("Your Order", style = MaterialTheme.typography.displayMedium)
                Text("$region · ${recipe.title}", style = MaterialTheme.typography.bodyLarge)

                val availableItems = regionShop.items.withIndex().filter { it.value.available }
                availableItems.forEach { indexedValue ->
                    val quantity = quantityState[quantityKey(selectedRegion, indexedValue.index)] ?: 1
                    val item = indexedValue.value
                    Surface(
                        color = SurfaceAlt,
                        shape = RoundedCornerShape(18.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(item.name, style = MaterialTheme.typography.titleMedium)
                                Text(item.brand, style = MaterialTheme.typography.bodyMedium)
                                Text("Qty: $quantity × $${formatPrice(item.price)}", style = MaterialTheme.typography.bodyMedium)
                            }
                            Text(
                                "$${formatPrice(item.price * quantity)}",
                                style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Serif),
                            )
                        }
                    }
                }

                val unavailableCount = regionShop.items.count { !it.available }
                if (unavailableCount > 0) {
                    Surface(
                        color = Rust.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Rust.copy(alpha = 0.2f)),
                    ) {
                        Text(
                            "$unavailableCount unavailable item(s) excluded from order. Substitutes are noted in the shopping list.",
                            modifier = Modifier.padding(14.dp),
                            color = Rust,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }

                Text("Delivery", style = MaterialTheme.typography.titleMedium)
                DeliveryOption.values().forEach { option ->
                    Surface(
                        color = if (option == deliveryOption) GoldDim else SurfaceAlt,
                        shape = RoundedCornerShape(18.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (option == deliveryOption) Gold else Border,
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onDeliveryChange(option) },
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column {
                                Text(option.label, style = MaterialTheme.typography.titleMedium)
                                Text(option.detail, style = MaterialTheme.typography.bodyMedium)
                            }
                            Text(
                                if (option.price == 0.0) "Free" else "$${formatPrice(option.price)}",
                                style = MaterialTheme.typography.titleMedium,
                            )
                        }
                    }
                }

                LabeledField("Street address", address, onAddressChange, "42 Bondi Road")
                LabeledField("Suburb / City", city, onCityChange, "Bondi, NSW 2026")
                LabeledField("Delivery note (optional)", note, onNoteChange, "Leave at door, ring bell, etc.", singleLine = false)

                Surface(
                    color = SurfaceAlt,
                    shape = RoundedCornerShape(18.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("Visa ending 4242", style = MaterialTheme.typography.titleMedium)
                        Text("Change", style = MaterialTheme.typography.labelLarge.copy(color = Gold))
                    }
                }

                PriceRow("Subtotal", totals.subtotal)
                PriceRow("Delivery", totals.delivery)
                PriceRow("Service fee", totals.service)
                PriceRow("Total", totals.total, bold = true)

                Button(
                    onClick = onPlaceOrder,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Gold,
                        contentColor = Ink,
                    ),
                ) {
                    Text("Place Order · $${formatPrice(totals.total)}")
                }
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
private fun RecipeCard(
    recipe: Recipe,
    onOpen: () -> Unit,
    onLocalise: () -> Unit,
    onShop: () -> Unit,
) {
    Surface(
        color = SurfaceMain,
        shape = RoundedCornerShape(24.dp),
        shadowElevation = 4.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        modifier = Modifier.clickable { onOpen() },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(SurfaceAlt),
            ) {
                Text(
                    recipe.emoji,
                    fontSize = 72.sp,
                    modifier = Modifier.align(Alignment.Center),
                )
                SmallBadge(
                    text = "🌍 ${recipe.country}",
                    background = Ink.copy(alpha = 0.72f),
                    contentColor = Paper,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(14.dp),
                )
                SmallBadge(
                    text = "✓ VERIFIED",
                    background = Gold,
                    contentColor = Ink,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(14.dp),
                )
            }

            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                TagRow(recipe.diet)
                Text(recipe.title, style = MaterialTheme.typography.titleLarge)
                Text("@${recipe.author} · ${recipe.reviews} reviews", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MacroSummaryCard(recipe.calories.toString(), "Cal")
                    MacroSummaryCard("${recipe.protein}g", "Protein")
                    MacroSummaryCard("${recipe.carbs}g", "Carbs")
                    MacroSummaryCard("${recipe.fat}g", "Fat")
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("★ ${recipe.rating} (${recipe.reviews})", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = onLocalise) {
                            Text("Localise")
                        }
                        Button(
                            onClick = onShop,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Gold,
                                contentColor = Ink,
                            ),
                        ) {
                            Text("Order")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun IngredientCard(ingredient: Ingredient) {
    Surface(
        color = SurfaceMain,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(ingredient.name, style = MaterialTheme.typography.titleMedium)
                Text(ingredient.amount, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace))
            }
            SmallBadge(
                text = "◈ ${ingredient.brand}",
                background = GoldDim,
                contentColor = Gold,
            )
        }
    }
}

@Composable
private fun CommentCard(
    comment: CommentEntry,
    liked: Boolean,
    onToggleLike: () -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Avatar(comment.user, comment.accent)
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(comment.name, style = MaterialTheme.typography.titleMedium)
                Text(comment.time, style = MaterialTheme.typography.labelMedium)
            }
            Text(comment.text, style = MaterialTheme.typography.bodyLarge)
            TextButton(onClick = onToggleLike) {
                Text(if (liked) "♥ ${comment.likes + 1}" else "♡ ${comment.likes}")
            }
        }
    }
}

@Composable
private fun FollowButton(
    following: Boolean,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (following) Ink else Color.Transparent,
            contentColor = if (following) Paper else TextMuted,
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (following) Ink else BorderStrong,
        ),
    ) {
        Text(if (following) "Following" else "Follow")
    }
}

@Composable
private fun AvailabilityRing(
    available: Int,
    total: Int,
) {
    val progress = if (total == 0) 0f else available.toFloat() / total.toFloat()
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier.size(110.dp),
            contentAlignment = Alignment.Center,
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val strokeWidth = 12.dp.toPx()
                drawCircle(
                    color = Border,
                    style = Stroke(width = strokeWidth),
                )
                drawArc(
                    color = Gold,
                    startAngle = -90f,
                    sweepAngle = 360f * progress,
                    useCenter = false,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("$available/$total", style = MaterialTheme.typography.titleLarge)
                Text("in stock", style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
private fun ShopItemRow(
    item: ShopItem,
    quantity: Int,
    checked: Boolean,
    onToggleChecked: () -> Unit,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
) {
    Surface(
        color = if (checked) SurfaceAlt else SurfaceMain,
        shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(if (checked) Ink else Color.Transparent)
                    .border(1.5.dp, BorderStrong, RoundedCornerShape(6.dp))
                    .clickable { onToggleChecked() },
                contentAlignment = Alignment.Center,
            ) {
                if (checked) {
                    Text("✓", color = Paper, fontSize = 11.sp)
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(
                    "${item.name} · ${item.amount}",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (checked) TextSoft else TextMain,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    SmallBadge(item.brand, GoldDim, Gold)
                    Text(item.store, style = MaterialTheme.typography.labelMedium)
                }
                Text(
                    if (item.available) "● In stock" else "✗ Unavailable",
                    color = if (item.available) Forest else Rust,
                    style = MaterialTheme.typography.labelLarge.copy(fontFamily = FontFamily.Monospace),
                )
                if (item.substitute != null) {
                    Text(
                        item.substitute,
                        color = Rust,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    QtyButton("−", onDecrement)
                    Text(quantity.toString(), style = MaterialTheme.typography.labelLarge.copy(fontFamily = FontFamily.Monospace))
                    QtyButton("+", onIncrement)
                }
                Text(
                    "$${formatPrice(item.price * quantity)}",
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Serif),
                )
            }
        }
    }
}

@Composable
private fun QtyButton(text: String, onClick: () -> Unit) {
    Surface(
        color = Color.Transparent,
        shape = CircleShape,
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderStrong),
        modifier = Modifier
            .size(28.dp)
            .clickable { onClick() },
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(text, color = TextMuted)
        }
    }
}

@Composable
private fun FeatureStrip() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        FeatureCard("🔬", "Brand-verified macros", "Every ingredient is tied to a specific brand SKU, so the macros you see are the macros you get.")
        FeatureCard("🌍", "Global ingredient swaps", "US recipe? We replace unavailable brands with local equivalents that stay within 2% of the same macro profile.")
        FeatureCard("🛒", "Order in one tap", "Build your shopping list from any recipe, see what's in stock near you, and place a same-day delivery order.")
    }
}

@Composable
private fun FeatureCard(
    emoji: String,
    title: String,
    description: String,
) {
    Surface(
        color = SurfaceMain,
        shape = RoundedCornerShape(22.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Text(emoji, fontSize = 28.sp)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium)
                Text(description, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun RowScope.HeroFoodCell(
    emoji: String,
    background: Color,
) {
    Box(
        modifier = Modifier
            .weight(1f)
            .aspectRatio(1f)
            .clip(RoundedCornerShape(18.dp))
            .background(background),
        contentAlignment = Alignment.Center,
    ) {
        Text(emoji, fontSize = 42.sp)
    }
}

@Composable
private fun RowScope.StatBlock(
    value: String,
    label: String,
) {
    Surface(
        modifier = Modifier.weight(1f),
        color = SurfaceAlt,
        shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(value, style = MaterialTheme.typography.titleLarge)
            Text(label, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun MacroSummaryCard(
    value: String,
    label: String,
) {
    Surface(
        color = SurfaceAlt,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(value, style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Serif))
            Text(label, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun TagRow(tags: List<String>) {
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        tags.forEach { tag ->
            val (background, content) = when (tag) {
                "high-protein" -> GoldDim to Gold
                "keto" -> Slate.copy(alpha = 0.12f) to Slate
                "vegan" -> Forest.copy(alpha = 0.12f) to Forest
                "low-carb" -> Rust.copy(alpha = 0.12f) to Rust
                "bulking" -> Warm to Ink
                else -> Cream to TextMain
            }
            SmallBadge(tagLabel(tag), background, content)
        }
    }
}

@Composable
private fun VerifiedPill(text: String) {
    SmallBadge(
        text = "✓ $text",
        background = Forest.copy(alpha = 0.12f),
        contentColor = Forest,
    )
}

@Composable
private fun MatchPill(match: String) {
    val background = when (match) {
        "exact" -> Forest.copy(alpha = 0.12f)
        "good" -> GoldDim
        else -> Rust.copy(alpha = 0.12f)
    }
    val content = when (match) {
        "exact" -> Forest
        "good" -> Gold
        else -> Rust
    }
    SmallBadge(
        text = if (match == "exact") "✓ Exact" else "≈ Close",
        background = background,
        contentColor = content,
    )
}

@Composable
private fun SmallBadge(
    text: String,
    background: Color,
    contentColor: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .background(background)
            .padding(horizontal = 10.dp, vertical = 6.dp),
    ) {
        Text(
            text,
            color = contentColor,
            style = MaterialTheme.typography.labelLarge.copy(
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
            ),
        )
    }
}

@Composable
private fun SectionHeader(
    eyebrow: String,
    title: String,
    action: String,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Eyebrow(eyebrow)
        Text(title, style = MaterialTheme.typography.displayMedium)
        OutlinedButton(onClick = {}) {
            Text(action)
        }
    }
}

@Composable
private fun Eyebrow(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.labelMedium.copy(
            color = Gold,
            fontFamily = FontFamily.Monospace,
            letterSpacing = 1.4.sp,
        ),
    )
}

@Composable
private fun Avatar(
    text: String,
    accent: Color,
) {
    Box(
        modifier = Modifier
            .size(38.dp)
            .clip(CircleShape)
            .background(accent.copy(alpha = 0.16f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = accent, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun LabeledField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium.copy(
                color = TextMuted,
                fontFamily = FontFamily.Monospace,
            ),
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(placeholder) },
            singleLine = singleLine,
            minLines = if (singleLine) 1 else 4,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            shape = RoundedCornerShape(16.dp),
        )
    }
}

@Composable
private fun PriceRow(
    label: String,
    amount: Double,
    bold: Boolean = false,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            style = if (bold) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyLarge,
        )
        Text(
            if (amount == 0.0 && label == "Delivery") "Free" else "$${formatPrice(amount)}",
            style = if (bold) {
                MaterialTheme.typography.titleLarge.copy(fontSize = 22.sp)
            } else {
                MaterialTheme.typography.titleMedium
            },
        )
    }
}

@Composable
private fun TrackingStep(
    label: String,
    active: Boolean,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .clip(CircleShape)
                .background(if (active) Gold else Border),
        )
        Text(
            label,
            color = if (active) TextMain else TextSoft,
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun EmptyStateCard(message: String) {
    Surface(
        color = SurfaceMain,
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Text(
            message,
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            style = MaterialTheme.typography.bodyLarge,
            color = TextSoft,
        )
    }
}

private fun calculateTotals(
    regionShop: RegionShop,
    selectedRegion: String,
    quantityState: Map<String, Int>,
    deliveryOption: DeliveryOption,
): OrderTotals {
    var subtotal = 0.0
    regionShop.items.forEachIndexed { index, item ->
        if (item.available) {
            val quantity = quantityState[quantityKey(selectedRegion, index)] ?: 1
            subtotal += item.price * quantity
        }
    }
    val service = ((subtotal * 0.05) * 100.0).roundToInt() / 100.0
    val total = subtotal + deliveryOption.price + service
    return OrderTotals(subtotal, deliveryOption.price, service, total)
}

private fun quantityKey(region: String, index: Int): String = "$region|$index"

private fun tagLabel(tag: String): String = when (tag) {
    "high-protein" -> "High Protein"
    "low-carb" -> "Low Carb"
    "bulking" -> "Bulking"
    "keto" -> "Keto"
    "vegan" -> "Vegan"
    else -> tag
}

private fun formatPrice(value: Double): String = "%.2f".format(value)

private fun <T> List<T>.updated(index: Int, newValue: T): List<T> {
    return toMutableList().also { mutable ->
        mutable[index] = newValue
    }
}
