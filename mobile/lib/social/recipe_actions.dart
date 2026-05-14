part of '../main.dart';
extension RecipeActions on AppState {
  Future<void> loadFeed({
    bool refresh = false,
    String? filter,
    String? sort,
    String? tag,
    String? query,
    bool? highProtein,
    bool? lowCalorie,
  }) async {
    if (refresh) feedNextOffset = 0;

    final effectiveFilter = filter ?? feedFilter;
    final effectiveSort = sort ?? feedSort;
    final effectiveTag = tag == null ? selectedTag : (tag.isEmpty ? null : tag);
    final effectiveHighProtein = highProtein ?? feedHighProtein;
    final effectiveLowCalorie = lowCalorie ?? feedLowCalorie;

    feedFilter = effectiveFilter;
    feedSort = effectiveSort;
    selectedTag = effectiveTag;
    feedHighProtein = effectiveHighProtein;
    feedLowCalorie = effectiveLowCalorie;

    recipesLoading = true;
    recipeError = null;
    refreshUi();

    try {
      final params = <String, String>{
        'filter': effectiveFilter,
        'sort': effectiveSort,
        'limit': '20',
        'offset': '${feedNextOffset ?? 0}',
      };

      if (effectiveTag != null && effectiveTag.isNotEmpty) {
        params['tag'] = effectiveTag;
      }
      if (query != null && query.trim().isNotEmpty) {
        params['q'] = query.trim();
      }
      if (effectiveHighProtein) params['highProtein'] = 'true';
      if (effectiveLowCalorie) params['lowCalorie'] = 'true';

      final payload =
          await api.request('/recipes?${Uri(queryParameters: params).query}');

      var loaded = (payload['recipes'] as List? ?? [])
          .map((item) => RecipePost.fromJson(item))
          .toList();

      feedNextOffset = payload['nextOffset'] as int?;

      if (loaded.isEmpty && refresh && user != null) {
        loaded = demoRecipes(user!);
        feedNextOffset = null;
      }

      feedRecipes = refresh ? loaded : mergeRecipes(feedRecipes, loaded);
    } catch (e) {
      if (refresh && user != null) {
        feedRecipes = demoRecipes(user!);
        feedNextOffset = null;
      } else {
        recipeError = e.toString();
      }
    } finally {
      recipesLoading = false;
      refreshUi();
    }
  }

  Future<void> loadSavedRecipes() async {
    savedRecipes = await _loadRecipeList({'filter': 'saved', 'limit': '40'});
    refreshUi();
  }

  Future<void> loadLikedRecipes() async {
    likedRecipes = await _loadRecipeList({'filter': 'liked', 'limit': '40'});
    refreshUi();
  }

  Future<void> loadProfileRecipes() async {
    profileRecipes = await _loadRecipeList({'filter': 'mine', 'limit': '40'});
    refreshUi();
  }

  Future<void> searchRecipes(String query) async {
    if (query.trim().isEmpty) {
      recipeSearchResults = [];
      refreshUi();
      return;
    }
    recipeSearchResults = await _loadRecipeList({
      'q': query.trim(),
      'sort': 'popular',
      'limit': '30',
    });
    refreshUi();
  }

  Future<List<RecipePost>> _loadRecipeList(Map<String, String> params) async {
    final payload =
        await api.request('/recipes?${Uri(queryParameters: params).query}');
    return (payload['recipes'] as List? ?? [])
        .map((item) => RecipePost.fromJson(item))
        .toList();
  }

  Future<void> createRecipe({
    required String title,
    required String description,
    required String imageUrl,
    required List<String> ingredients,
    required List<String> instructions,
    required int calories,
    required List<String> tags,
    required String visibility,
  }) async {
    await _run(() async {
      final body = {
        'title': title.trim(),
        'description': description.trim(),
        if (imageUrl.trim().isNotEmpty) 'imageUrl': imageUrl.trim(),
        'ingredients': ingredients,
        'instructions': instructions,
        'calories': calories,
        'tags': tags,
        'visibility': visibility,
      };
      final payload = await api.request('/recipes', method: 'POST', body: body);
      final recipe = RecipePost.fromJson(payload['recipe']);
      feedRecipes = [recipe, ...feedRecipes];
      profileRecipes = [recipe, ...profileRecipes];
    });
  }

  Future<void> toggleLike(RecipePost recipe) async {
    final payload =
        await api.request('/recipes/${recipe.id}/like', method: 'POST');
    replaceRecipe(RecipePost.fromJson(payload['recipe']));
  }

  Future<void> toggleSave(RecipePost recipe) async {
    final payload =
        await api.request('/recipes/${recipe.id}/save', method: 'POST');
    replaceRecipe(RecipePost.fromJson(payload['recipe']));
  }

  Future<void> loadComments(String recipeId) async {
    activeComments = [];
    refreshUi();
    final payload = await api.request('/recipes/$recipeId/comments');
    activeComments = (payload['comments'] as List? ?? [])
        .map((item) => RecipeComment.fromJson(item))
        .toList();
    refreshUi();
  }

  Future<void> addComment(String recipeId, String body) async {
    await _run(() async {
      final payload = await api.request('/recipes/$recipeId/comments',
          method: 'POST', body: {'body': body.trim()});
      activeComments = [
        ...activeComments,
        RecipeComment.fromJson(payload['comment']),
      ];
      final recipe =
          feedRecipes.where((item) => item.id == recipeId).firstOrNull;
      if (recipe != null) {
        replaceRecipe(
          RecipePost(
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            calories: recipe.calories,
            tags: recipe.tags,
            visibility: recipe.visibility,
            author: recipe.author,
            likeCount: recipe.likeCount,
            commentCount: recipe.commentCount + 1,
            saveCount: recipe.saveCount,
            likedByMe: recipe.likedByMe,
            savedByMe: recipe.savedByMe,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
          ),
        );
      }
    }, silent: true);
  }

  Future<void> logRecipeAsFood(RecipePost recipe) async {
    await saveLog(
      foodName: recipe.title,
      calories: recipe.calories,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      mealType: 'other',
      consumedAt: DateTime.now(),
      servingSize: '1 recipe serving',
      notes: 'Logged from recipe by @${recipe.author.username}',
    );
  }

  void replaceRecipe(RecipePost recipe) {
    feedRecipes = replaceInRecipes(feedRecipes, recipe);
    profileRecipes = replaceInRecipes(profileRecipes, recipe);
    recipeSearchResults = replaceInRecipes(recipeSearchResults, recipe);
    savedRecipes = recipe.savedByMe
        ? replaceOrAddRecipe(savedRecipes, recipe)
        : savedRecipes.where((item) => item.id != recipe.id).toList();
    likedRecipes = recipe.likedByMe
        ? replaceOrAddRecipe(likedRecipes, recipe)
        : likedRecipes.where((item) => item.id != recipe.id).toList();
    refreshUi();
  }

  List<RecipePost> demoRecipes(UserProfile user) {
    return [
      RecipePost(
        id: 'demo-chicken-bowl',
        title: 'High Protein Chicken Bowl',
        description: 'A lean post-workout bowl with chicken, rice, avocado, and greens.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900',
        ingredients: ['200g chicken breast', '1 cup cooked rice', '1/2 avocado'],
        instructions: ['Grill chicken.', 'Cook rice.', 'Assemble bowl.'],
        calories: 620,
        tags: ['high-protein', 'meal-prep'],
        visibility: 'public',
        author: user,
        likeCount: 24,
        commentCount: 4,
        saveCount: 12,
        likedByMe: false,
        savedByMe: false,
      ),
    ];
  }
}