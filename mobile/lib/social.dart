part of 'main.dart';

class RecipePost {
  RecipePost({
    required this.id,
    required this.title,
    required this.description,
    required this.ingredients,
    required this.instructions,
    required this.calories,
    required this.tags,
    required this.visibility,
    required this.author,
    required this.likeCount,
    required this.commentCount,
    required this.saveCount,
    required this.likedByMe,
    required this.savedByMe,
    this.imageUrl,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final List<String> ingredients;
  final List<String> instructions;
  final int calories;
  final List<String> tags;
  final String visibility;
  final UserProfile author;
  final int likeCount;
  final int commentCount;
  final int saveCount;
  final bool likedByMe;
  final bool savedByMe;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory RecipePost.fromJson(Map<String, dynamic> json) {
    return RecipePost(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['imageUrl'],
      ingredients:
          (json['ingredients'] as List? ?? []).map((item) => '$item').toList(),
      instructions:
          (json['instructions'] as List? ?? []).map((item) => '$item').toList(),
      calories: (json['calories'] ?? 0).round(),
      tags: (json['tags'] as List? ?? []).map((item) => '$item').toList(),
      visibility: json['visibility'] ?? 'public',
      author: UserProfile.fromJson(json['author'] ?? <String, dynamic>{}),
      likeCount: (json['likeCount'] ?? 0).round(),
      commentCount: (json['commentCount'] ?? 0).round(),
      saveCount: (json['saveCount'] ?? 0).round(),
      likedByMe: json['likedByMe'] == true,
      savedByMe: json['savedByMe'] == true,
      createdAt: parseDate(json['createdAt']),
      updatedAt: parseDate(json['updatedAt']),
    );
  }
}

class RecipeComment {
  RecipeComment({
    required this.id,
    required this.recipeId,
    required this.body,
    required this.author,
    this.createdAt,
  });

  final String id;
  final String recipeId;
  final String body;
  final UserProfile author;
  final DateTime? createdAt;

  factory RecipeComment.fromJson(Map<String, dynamic> json) {
    return RecipeComment(
      id: json['id'].toString(),
      recipeId: json['recipeId'].toString(),
      body: json['body'] ?? '',
      author: UserProfile.fromJson(json['author'] ?? <String, dynamic>{}),
      createdAt: parseDate(json['createdAt']),
    );
  }
}

DateTime? parseDate(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse('$value')?.toLocal();
}

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
      if (query != null && query.trim().isNotEmpty) params['q'] = query.trim();
      if (effectiveHighProtein) params['highProtein'] = 'true';
      if (effectiveLowCalorie) params['lowCalorie'] = 'true';
      final payload =
          await api.request('/recipes?${Uri(queryParameters: params).query}');
      final loaded = (payload['recipes'] as List? ?? [])
          .map((item) => RecipePost.fromJson(item))
          .toList();
      feedNextOffset = payload['nextOffset'] as int?;
      feedRecipes = refresh ? loaded : mergeRecipes(feedRecipes, loaded);
    } catch (e) {
      recipeError = e.toString();
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
        await loadFeed(refresh: true, filter: feedFilter, sort: feedSort);
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
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

List<RecipePost> mergeRecipes(List<RecipePost> current, List<RecipePost> next) {
  final seen = current.map((recipe) => recipe.id).toSet();
  return [...current, ...next.where((recipe) => seen.add(recipe.id))];
}

List<RecipePost> replaceInRecipes(List<RecipePost> recipes, RecipePost recipe) {
  return recipes.map((item) => item.id == recipe.id ? recipe : item).toList();
}

List<RecipePost> replaceOrAddRecipe(
    List<RecipePost> recipes, RecipePost recipe) {
  final replaced = replaceInRecipes(recipes, recipe);
  return recipes.any((item) => item.id == recipe.id)
      ? replaced
      : [recipe, ...replaced];
}

class TopNavBar extends StatelessWidget {
  const TopNavBar({
    super.key,
    required this.onAdd,
    required this.onMenu,
    required this.onSearch,
  });

  final VoidCallback onAdd;
  final VoidCallback onMenu;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: Container(
        height: 58,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: AppColors.bg.withValues(alpha: 0.92),
          border: const Border(bottom: BorderSide(color: AppColors.line)),
        ),
        child: Row(
          children: [
            const BrandDots(),
            const Spacer(),
            NavIconButton(icon: Icons.add, onPressed: onAdd),
            const SizedBox(width: 10),
            NavIconButton(icon: Icons.menu, onPressed: onMenu),
            const SizedBox(width: 10),
            NavIconButton(icon: Icons.search, onPressed: onSearch),
          ],
        ),
      ),
    );
  }
}

class BrandDots extends StatelessWidget {
  const BrandDots({super.key});

  @override
  Widget build(BuildContext context) {
    const colors = [AppColors.gold, AppColors.blue, AppColors.green];
    return Row(
      children: List.generate(
        3,
        (index) => Container(
          width: 10,
          height: 10,
          margin: const EdgeInsets.only(right: 7),
          decoration: BoxDecoration(
            color: colors[index].withValues(alpha: 0.82),
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}

class NavIconButton extends StatelessWidget {
  const NavIconButton({super.key, required this.icon, required this.onPressed});
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onPressed,
      radius: 24,
      child: SizedBox(
        width: 34,
        height: 34,
        child:
            Icon(icon, color: AppColors.text.withValues(alpha: 0.82), size: 24),
      ),
    );
  }
}

class SlideOutMenu extends StatelessWidget {
  const SlideOutMenu({
    super.key,
    required this.open,
    required this.onClose,
    required this.onSelect,
  });

  final bool open;
  final VoidCallback onClose;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppState>().user;
    return IgnorePointer(
      ignoring: !open,
      child: Stack(
        children: [
          AnimatedOpacity(
            duration: const Duration(milliseconds: 220),
            opacity: open ? 1 : 0,
            child: GestureDetector(
              onTap: onClose,
              child: Container(color: Colors.black.withValues(alpha: 0.46)),
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            top: 0,
            bottom: 0,
            left: open ? 0 : -360,
            width:
                MediaQuery.of(context).size.width.clamp(0.0, 360.0).toDouble(),
            child: Material(
              color: AppColors.menu,
              child: SafeArea(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(24, 26, 24, 28),
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppColors.field,
                          child: Text(initials(user?.displayName ?? 'MC')),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user?.displayName ?? 'MacroChef',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 18)),
                              Text('@${user?.username ?? 'member'}',
                                  style: const TextStyle(
                                      color: AppColors.muted, fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const MenuDivider(),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: MenuColumn(items: const [
                            ['HOME', 'home'],
                            ['RECIPES', 'recipes'],
                            ['REVIEWS', 'reviews'],
                            ['LISTS', 'lists'],
                            ['TAGS', 'tags'],
                          ], onSelect: onSelect),
                        ),
                        const SizedBox(width: 34),
                        Expanded(
                          child: MenuColumn(items: const [
                            ['PROFILE', 'profile'],
                            ['DIARY', 'diary'],
                            ['SAVED', 'saved'],
                            ['LIKES', 'likes'],
                            ['NETWORK', 'network'],
                          ], onSelect: onSelect),
                        ),
                      ],
                    ),
                    const MenuDivider(),
                    MenuColumn(items: const [
                      ['CALORIE TRACKER', 'calories'],
                      ['FRIENDS', 'friends'],
                      ['SETTINGS', 'settings'],
                      ['SUBSCRIPTIONS', 'subscriptions'],
                      ['SIGN OUT', 'signout'],
                    ], onSelect: onSelect),
                    const MenuDivider(),
                    const Wrap(
                      spacing: 22,
                      runSpacing: 14,
                      children: [
                        MenuFooterLabel('ACTIVITY'),
                        MenuFooterLabel('RECIPES'),
                        MenuFooterLabel('LISTS'),
                        MenuFooterLabel('MEMBERS'),
                        MenuFooterLabel('JOURNAL'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MenuColumn extends StatelessWidget {
  const MenuColumn({super.key, required this.items, required this.onSelect});
  final List<List<String>> items;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: items
          .map((item) => MenuTextButton(
                label: item[0],
                onTap: () => onSelect(item[1]),
              ))
          .toList(),
    );
  }
}

class MenuTextButton extends StatelessWidget {
  const MenuTextButton({super.key, required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 11),
        child: Text(
          label,
          style: const TextStyle(
            letterSpacing: 0.8,
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppColors.text,
          ),
        ),
      ),
    );
  }
}

class MenuDivider extends StatelessWidget {
  const MenuDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Divider(height: 1, color: AppColors.line),
    );
  }
}

class MenuFooterLabel extends StatelessWidget {
  const MenuFooterLabel(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(label,
        style: const TextStyle(
            color: AppColors.muted, fontSize: 11, fontWeight: FontWeight.w700));
  }
}

class PremiumHomeScreen extends StatefulWidget {
  const PremiumHomeScreen({super.key});

  @override
  State<PremiumHomeScreen> createState() => _PremiumHomeScreenState();
}

class _PremiumHomeScreenState extends State<PremiumHomeScreen> {
  final controller = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = context.read<AppState>();
      state.loadDashboard(silent: true);
      state.loadFeed(refresh: true);
    });
    controller.addListener(_onScroll);
  }

  void _onScroll() {
    final state = context.read<AppState>();
    if (controller.position.pixels >
            controller.position.maxScrollExtent - 500 &&
        !state.recipesLoading &&
        state.feedNextOffset != null) {
      state.loadFeed();
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return RefreshIndicator(
      onRefresh: () async {
        await state.loadDashboard(silent: true);
        await state.loadFeed(refresh: true);
      },
      child: CustomScrollView(
        controller: controller,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(
                      title: "TODAY'S CALORIES", action: 'TRACKER'),
                  CalorieSummaryCard(
                      onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const CalorieTrackerScreen()),
                          )),
                  const SizedBox(height: 24),
                  const SectionHeader(
                      title: 'NEW FROM FRIENDS', action: 'ALL ACTIVITY'),
                  FeedFilterChips(state: state),
                  if (state.recipeError != null) ErrorText(state.recipeError!),
                ],
              ),
            ),
          ),
          if (state.recipesLoading && state.feedRecipes.isEmpty)
            const LoadingRecipeGrid()
          else if (state.feedRecipes.isEmpty)
            const SliverPadding(
              padding: EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: EmptyState(
                  title: 'No recipes yet',
                  message: 'Post a recipe or add friends to wake up the feed.',
                ),
              ),
            )
          else
            RecipeGrid(recipes: state.feedRecipes),
          if (state.recipesLoading && state.feedRecipes.isNotEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 28)),
        ],
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.action});
  final String title;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Text(title,
              style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8)),
          const SizedBox(width: 12),
          const Expanded(child: Divider(color: AppColors.line, height: 1)),
          if (action != null) ...[
            const SizedBox(width: 12),
            Text(action!,
                style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700)),
          ],
        ],
      ),
    );
  }
}

class CalorieSummaryCard extends StatelessWidget {
  const CalorieSummaryCard({super.key, this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final goal = state.user?.dailyCalorieGoal ?? 2200;
    final consumed = state.summary.totalCalories;
    final progress = goal == 0 ? 0.0 : (consumed / goal).clamp(0.0, 1.0);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          boxShadow: cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: BigMetric(
                      label: 'Consumed', value: '$consumed', sub: '$goal goal'),
                ),
                Expanded(
                  child: BigMetric(
                      label: 'Remaining',
                      value: '${state.remainingCalories}',
                      sub: 'cal'),
                ),
              ],
            ),
            const SizedBox(height: 14),
            LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              borderRadius: BorderRadius.circular(99),
              color: AppColors.gold,
              backgroundColor: AppColors.field,
            ),
            const SizedBox(height: 14),
            MacroRow(summary: state.summary, user: state.user),
          ],
        ),
      ),
    );
  }
}

class FeedFilterChips extends StatelessWidget {
  const FeedFilterChips({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          FilterChipButton(
              label: 'Recent',
              selected: state.feedFilter == 'all' && state.feedSort == 'recent',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'all',
                  sort: 'recent',
                  tag: '',
                  highProtein: false,
                  lowCalorie: false)),
          FilterChipButton(
              label: 'Friends',
              selected: state.feedFilter == 'friends',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'friends',
                  tag: '',
                  highProtein: false,
                  lowCalorie: false)),
          FilterChipButton(
              label: 'Public',
              selected: state.feedFilter == 'public',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'public',
                  tag: '',
                  highProtein: false,
                  lowCalorie: false)),
          FilterChipButton(
              label: 'Saved',
              selected: state.feedFilter == 'saved',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'saved',
                  tag: '',
                  highProtein: false,
                  lowCalorie: false)),
          FilterChipButton(
              label: 'High protein',
              selected:
                  state.feedHighProtein || state.selectedTag == 'high-protein',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'all',
                  tag: 'high-protein',
                  highProtein: true,
                  lowCalorie: false)),
          FilterChipButton(
              label: 'Low calorie',
              selected: state.feedLowCalorie,
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'all',
                  tag: '',
                  highProtein: false,
                  lowCalorie: true)),
          FilterChipButton(
              label: 'Popular',
              selected: state.feedSort == 'popular',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'all',
                  sort: 'popular',
                  tag: '',
                  highProtein: false,
                  lowCalorie: false)),
          FilterChipButton(
              label: 'Mine',
              selected: state.feedFilter == 'mine',
              onTap: () => state.loadFeed(
                  refresh: true,
                  filter: 'mine',
                  tag: '',
                  highProtein: false,
                  lowCalorie: false)),
        ],
      ),
    );
  }
}

class FilterChipButton extends StatelessWidget {
  const FilterChipButton({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        selected: selected,
        label: Text(label),
        onSelected: (_) => onTap(),
        backgroundColor: AppColors.field,
        selectedColor: AppColors.gold.withValues(alpha: 0.22),
        labelStyle: TextStyle(
          color: selected ? AppColors.text : AppColors.muted,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
        side: BorderSide(
            color: selected
                ? AppColors.gold.withValues(alpha: 0.6)
                : AppColors.line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
    );
  }
}

class RecipeGrid extends StatelessWidget {
  const RecipeGrid({super.key, required this.recipes});
  final List<RecipePost> recipes;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 230,
          childAspectRatio: 0.56,
          crossAxisSpacing: 13,
          mainAxisSpacing: 14,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => RecipeCard(recipe: recipes[index]),
          childCount: recipes.length,
        ),
      ),
    );
  }
}

class LoadingRecipeGrid extends StatelessWidget {
  const LoadingRecipeGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 230,
          childAspectRatio: 0.56,
          crossAxisSpacing: 13,
          mainAxisSpacing: 14,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => const LoadingSkeleton(),
          childCount: 6,
        ),
      ),
    );
  }
}

class RecipeCard extends StatelessWidget {
  const RecipeCard({super.key, required this.recipe});
  final RecipePost recipe;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => RecipeDetailScreen(recipe: recipe)),
        ),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            boxShadow: cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(16)),
                  child: RecipeImage(recipe: recipe, compact: true),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(11, 10, 11, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(recipe.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text('@${recipe.author.username}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: AppColors.muted, fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        PopularityDots(
                            score: recipe.likeCount + recipe.commentCount),
                        const Spacer(),
                        Text('${recipe.calories} cal',
                            style: const TextStyle(
                                color: AppColors.muted, fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TagRow(tags: recipe.tags.take(2).toList()),
                    const SizedBox(height: 8),
                    InteractionBar(recipe: recipe, compact: true),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class RecipeImage extends StatelessWidget {
  const RecipeImage({super.key, required this.recipe, this.compact = false});
  final RecipePost recipe;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final url = recipe.imageUrl;
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, __, ___) => RecipeImageFallback(recipe: recipe),
      );
    }
    return RecipeImageFallback(recipe: recipe);
  }
}

class RecipeImageFallback extends StatelessWidget {
  const RecipeImageFallback({super.key, required this.recipe});
  final RecipePost recipe;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1F332E), Color(0xFF16232F), Color(0xFF111821)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            recipe.title.isEmpty ? 'MC' : recipe.title[0].toUpperCase(),
            style: TextStyle(
              fontSize: 56,
              fontWeight: FontWeight.w900,
              color: AppColors.text.withValues(alpha: 0.84),
            ),
          ),
        ),
      ),
    );
  }
}

class PopularityDots extends StatelessWidget {
  const PopularityDots({super.key, required this.score});
  final int score;

  @override
  Widget build(BuildContext context) {
    final filled = score.clamp(0, 5);
    return Row(
      children: List.generate(
        5,
        (index) => Container(
          width: 6,
          height: 6,
          margin: const EdgeInsets.only(right: 3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: index < filled ? AppColors.gold : AppColors.field,
          ),
        ),
      ),
    );
  }
}

class TagRow extends StatelessWidget {
  const TagRow({super.key, required this.tags});
  final List<String> tags;

  @override
  Widget build(BuildContext context) {
    if (tags.isEmpty) return const SizedBox(height: 18);
    return Wrap(
      spacing: 5,
      runSpacing: 5,
      children: tags
          .map((tag) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.field,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(tag,
                    style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 10,
                        fontWeight: FontWeight.w700)),
              ))
          .toList(),
    );
  }
}

class InteractionBar extends StatelessWidget {
  const InteractionBar({super.key, required this.recipe, this.compact = false});
  final RecipePost recipe;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Row(
      children: [
        InteractionButton(
          icon: recipe.likedByMe ? Icons.favorite : Icons.favorite_border,
          label: compact ? '${recipe.likeCount}' : '${recipe.likeCount} likes',
          active: recipe.likedByMe,
          onTap: () => state.toggleLike(recipe),
        ),
        InteractionButton(
          icon: Icons.mode_comment_outlined,
          label: compact
              ? '${recipe.commentCount}'
              : '${recipe.commentCount} comments',
          onTap: () => showCommentSheet(context, recipe),
        ),
        const Spacer(),
        InteractionButton(
          icon: recipe.savedByMe ? Icons.bookmark : Icons.bookmark_border,
          label: compact ? '' : '${recipe.saveCount} saves',
          active: recipe.savedByMe,
          onTap: () => state.toggleSave(recipe),
        ),
      ],
    );
  }
}

class InteractionButton extends StatelessWidget {
  const InteractionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Padding(
        padding: const EdgeInsets.only(right: 9, top: 3, bottom: 3),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 17, color: active ? AppColors.gold : AppColors.muted),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 3),
              Text(label,
                  style: TextStyle(
                      color: active ? AppColors.text : AppColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w700)),
            ],
          ],
        ),
      ),
    );
  }
}

class RecipeDetailScreen extends StatelessWidget {
  const RecipeDetailScreen({super.key, required this.recipe});
  final RecipePost recipe;

  @override
  Widget build(BuildContext context) {
    final current = context
            .watch<AppState>()
            .feedRecipes
            .where((item) => item.id == recipe.id)
            .firstOrNull ??
        recipe;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(current.title, overflow: TextOverflow.ellipsis),
        backgroundColor: AppColors.bg,
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 28),
        children: [
          AspectRatio(
            aspectRatio: 1.18,
            child: RecipeImage(recipe: current),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(current.title,
                    style: const TextStyle(
                        fontSize: 28, fontWeight: FontWeight.w900)),
                const SizedBox(height: 6),
                Text(
                    'by @${current.author.username} | ${current.calories} cal | ${current.visibility}',
                    style: const TextStyle(color: AppColors.muted)),
                const SizedBox(height: 14),
                InteractionBar(recipe: current),
                const SizedBox(height: 18),
                if (current.description.isNotEmpty)
                  Text(current.description,
                      style: const TextStyle(height: 1.45, fontSize: 15)),
                const SizedBox(height: 22),
                TagRow(tags: current.tags),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Log calories',
                  onPressed: () async {
                    await context.read<AppState>().logRecipeAsFood(current);
                    if (context.mounted) showSnack(context, 'Recipe logged');
                  },
                ),
                const SizedBox(height: 26),
                const SectionHeader(title: 'INGREDIENTS'),
                ...current.ingredients.map((item) => DetailLine(text: item)),
                const SizedBox(height: 22),
                const SectionHeader(title: 'INSTRUCTIONS'),
                ...List.generate(
                  current.instructions.length,
                  (index) => DetailLine(
                      text: '${index + 1}. ${current.instructions[index]}'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DetailLine extends StatelessWidget {
  const DetailLine({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Text(text,
          style: const TextStyle(color: AppColors.text, height: 1.35)),
    );
  }
}

Future<void> showCreateRecipeSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    builder: (_) => const CreateRecipeForm(),
  );
}

class CreateRecipeForm extends StatefulWidget {
  const CreateRecipeForm({super.key});

  @override
  State<CreateRecipeForm> createState() => _CreateRecipeFormState();
}

class _CreateRecipeFormState extends State<CreateRecipeForm> {
  final title = TextEditingController();
  final description = TextEditingController();
  final imageUrl = TextEditingController();
  final ingredients = TextEditingController();
  final instructions = TextEditingController();
  final calories = TextEditingController();
  final tags = TextEditingController(text: 'high-protein');
  String visibility = 'public';

  @override
  void dispose() {
    for (final controller in [
      title,
      description,
      imageUrl,
      ingredients,
      instructions,
      calories,
      tags,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
            18, 14, 18, MediaQuery.of(context).viewInsets.bottom + 18),
        child: ListView(
          shrinkWrap: true,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text('Post recipe',
                      style:
                          TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                ),
                IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close)),
              ],
            ),
            const SizedBox(height: 10),
            AppField(controller: title, label: 'Recipe title'),
            AppField(controller: description, label: 'Description'),
            AppField(controller: imageUrl, label: 'Image URL optional'),
            AppField(
                controller: ingredients,
                label: 'Ingredients, one per line',
                keyboardType: TextInputType.multiline),
            AppField(
                controller: instructions,
                label: 'Steps, one per line',
                keyboardType: TextInputType.multiline),
            AppField(
                controller: calories,
                label: 'Calories',
                keyboardType: TextInputType.number),
            AppField(controller: tags, label: 'Tags, comma separated'),
            DropdownButtonFormField<String>(
              initialValue: visibility,
              decoration: const InputDecoration(labelText: 'Visibility'),
              items: const ['public', 'friends', 'private']
                  .map((value) =>
                      DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) =>
                  setState(() => visibility = value ?? visibility),
            ),
            const SizedBox(height: 14),
            if (state.error != null) ErrorText(state.error!),
            PrimaryButton(
              label: 'Publish recipe',
              loading: state.busy,
              onPressed: () async {
                final ingredientLines = splitLines(ingredients.text);
                final instructionLines = splitLines(instructions.text);
                if (title.text.trim().isEmpty ||
                    ingredientLines.isEmpty ||
                    instructionLines.isEmpty) {
                  showSnack(context, 'Add a title, ingredients, and steps');
                  return;
                }
                try {
                  await context.read<AppState>().createRecipe(
                        title: title.text,
                        description: description.text,
                        imageUrl: imageUrl.text,
                        ingredients: ingredientLines,
                        instructions: instructionLines,
                        calories: int.tryParse(calories.text) ?? 0,
                        tags: splitTags(tags.text),
                        visibility: visibility,
                      );
                  if (context.mounted) Navigator.pop(context);
                } catch (_) {}
              },
            ),
          ],
        ),
      ),
    );
  }
}

List<String> splitLines(String value) {
  return value
      .split('\n')
      .map((line) => line.trim())
      .where((line) => line.isNotEmpty)
      .toList();
}

List<String> splitTags(String value) {
  return value
      .split(',')
      .map((tag) => tag.trim().toLowerCase().replaceAll(RegExp(r'\s+'), '-'))
      .where((tag) => tag.isNotEmpty)
      .toList();
}

Future<void> showCommentSheet(BuildContext context, RecipePost recipe) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    builder: (_) => CommentSheet(recipe: recipe),
  );
}

class CommentSheet extends StatefulWidget {
  const CommentSheet({super.key, required this.recipe});
  final RecipePost recipe;

  @override
  State<CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<CommentSheet> {
  final body = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<AppState>().loadComments(widget.recipe.id));
  }

  @override
  void dispose() {
    body.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
            18, 14, 18, MediaQuery.of(context).viewInsets.bottom + 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                    child: Text('Comments',
                        style: TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w900))),
                IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close)),
              ],
            ),
            Flexible(
              child: state.activeComments.isEmpty
                  ? const EmptyState(
                      title: 'No comments yet',
                      message: 'Start the conversation around this recipe.',
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: state.activeComments.length,
                      itemBuilder: (context, index) {
                        final comment = state.activeComments[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                backgroundColor: AppColors.field,
                                child:
                                    Text(initials(comment.author.displayName)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('@${comment.author.username}',
                                        style: const TextStyle(
                                            color: AppColors.muted,
                                            fontWeight: FontWeight.w700)),
                                    const SizedBox(height: 4),
                                    Text(comment.body),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 10),
            AppField(controller: body, label: 'Add a comment'),
            PrimaryButton(
              label: 'Post comment',
              loading: state.busy,
              onPressed: () async {
                if (body.text.trim().isEmpty) return;
                await context
                    .read<AppState>()
                    .addComment(widget.recipe.id, body.text);
                body.clear();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class SearchDiscoverScreen extends StatefulWidget {
  const SearchDiscoverScreen({super.key});

  @override
  State<SearchDiscoverScreen> createState() => _SearchDiscoverScreenState();
}

class _SearchDiscoverScreenState extends State<SearchDiscoverScreen> {
  final search = TextEditingController();

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  Future<void> runSearch() async {
    final state = context.read<AppState>();
    await Future.wait([
      state.searchUsers(search.text),
      state.searchRecipes(search.text),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SectionHeader(title: 'DISCOVER'),
        TextField(
          controller: search,
          decoration: const InputDecoration(
              labelText: 'Search recipes, tags, or members',
              prefixIcon: Icon(Icons.search)),
          onSubmitted: (_) => runSearch(),
        ),
        const SizedBox(height: 12),
        PrimaryButton(
            label: 'Search', loading: state.busy, onPressed: runSearch),
        const SizedBox(height: 24),
        const SectionHeader(title: 'RECIPES'),
        if (state.recipeSearchResults.isEmpty)
          const EmptyState(
              title: 'Find your next cook',
              message: 'Search for a dish, tag, or creator.')
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: state.recipeSearchResults.length,
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 230,
              childAspectRatio: 0.56,
              crossAxisSpacing: 13,
              mainAxisSpacing: 14,
            ),
            itemBuilder: (context, index) =>
                RecipeCard(recipe: state.recipeSearchResults[index]),
          ),
        const SizedBox(height: 24),
        const SectionHeader(title: 'MEMBERS'),
        if (state.searchResults.isEmpty)
          const EmptyState(
              title: 'No members selected',
              message: 'Search by username or display name.')
        else
          ...state.searchResults.map((user) => FriendCard(
                user: user,
                action: 'REQUEST',
                onAction: () async {
                  await context
                      .read<AppState>()
                      .sendFriendRequest(user.username);
                  if (context.mounted) {
                    showSnack(context, 'Friend request sent');
                  }
                },
              )),
      ],
    );
  }
}

class FriendsNetworkScreen extends StatefulWidget {
  const FriendsNetworkScreen({super.key});

  @override
  State<FriendsNetworkScreen> createState() => _FriendsNetworkScreenState();
}

class _FriendsNetworkScreenState extends State<FriendsNetworkScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => context.read<AppState>().loadFriends());
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return RefreshIndicator(
      onRefresh: () => state.loadFriends(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'FRIEND REQUESTS'),
          if (state.incoming.isEmpty)
            const EmptyState(
                title: 'No requests',
                message: 'Incoming friend requests will land here.')
          else
            ...state.incoming.map((req) => AppCard(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Row(children: [
                    Expanded(child: UserMini(user: req.user)),
                    IconButton(
                        onPressed: () => state.acceptRequest(req.requestId),
                        icon: const Icon(Icons.check, color: AppColors.green)),
                    IconButton(
                        onPressed: () => state.rejectRequest(req.requestId),
                        icon: const Icon(Icons.close, color: AppColors.red)),
                  ]),
                )),
          const SizedBox(height: 24),
          const SectionHeader(title: 'NETWORK'),
          if (state.friends.isEmpty)
            const EmptyState(
                title: 'Build your table',
                message: 'Add friends to see their recipes and food activity.')
          else
            ...state.friends.map((friend) => FriendCard(
                  user: friend,
                  action: 'REMOVE',
                  onAction: () => state.removeFriend(friend.id),
                )),
          const SizedBox(height: 24),
          const SectionHeader(title: 'OUTGOING'),
          if (state.outgoing.isEmpty)
            const EmptyState(
                title: 'No pending requests',
                message: 'Sent requests will appear here.')
          else
            ...state.outgoing.map((req) => FriendCard(user: req.user)),
        ],
      ),
    );
  }
}

class FriendCard extends StatelessWidget {
  const FriendCard({super.key, required this.user, this.action, this.onAction});
  final UserProfile user;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) =>
                          FriendProfileScreen(username: user.username))),
              child: UserMini(user: user),
            ),
          ),
          if (action != null)
            TextButton(onPressed: onAction, child: Text(action!)),
        ],
      ),
    );
  }
}

class PremiumProfileScreen extends StatefulWidget {
  const PremiumProfileScreen({super.key});

  @override
  State<PremiumProfileScreen> createState() => _PremiumProfileScreenState();
}

class _PremiumProfileScreenState extends State<PremiumProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<AppState>().loadProfileRecipes());
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.user!;
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ProfileHeader(user: user),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: PrimaryButton(
                          label: 'Edit profile',
                          onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const EditProfileScreen()))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const SettingsPrivacyScreen())),
                        child: const Text('Settings'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                AppCard(child: MacroGoalList(user: user)),
                const SizedBox(height: 24),
                const SectionHeader(title: 'YOUR RECIPES'),
              ],
            ),
          ),
        ),
        if (state.profileRecipes.isEmpty)
          const SliverPadding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverToBoxAdapter(
              child: EmptyState(
                  title: 'No recipes posted',
                  message: 'Use the plus button to publish your first dish.'),
            ),
          )
        else
          RecipeGrid(recipes: state.profileRecipes),
      ],
    );
  }
}

class SavedRecipesScreen extends StatefulWidget {
  const SavedRecipesScreen({super.key});

  @override
  State<SavedRecipesScreen> createState() => _SavedRecipesScreenState();
}

class _SavedRecipesScreenState extends State<SavedRecipesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<AppState>().loadSavedRecipes());
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return RecipeCollectionScaffold(
      title: 'SAVED RECIPES',
      recipes: state.savedRecipes,
      emptyTitle: 'Nothing saved yet',
      emptyMessage: 'Bookmark recipes from the feed to collect them here.',
    );
  }
}

class LikesScreen extends StatefulWidget {
  const LikesScreen({super.key});

  @override
  State<LikesScreen> createState() => _LikesScreenState();
}

class _LikesScreenState extends State<LikesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<AppState>().loadLikedRecipes());
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return RecipeCollectionScaffold(
      title: 'LIKED RECIPES',
      recipes: state.likedRecipes,
      emptyTitle: 'No liked recipes',
      emptyMessage: 'Tap hearts on recipes you want to revisit.',
    );
  }
}

class RecipeCollectionScaffold extends StatelessWidget {
  const RecipeCollectionScaffold({
    super.key,
    required this.title,
    required this.recipes,
    required this.emptyTitle,
    required this.emptyMessage,
  });

  final String title;
  final List<RecipePost> recipes;
  final String emptyTitle;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: Text(title), backgroundColor: AppColors.bg),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverToBoxAdapter(child: SectionHeader(title: title)),
          ),
          if (recipes.isEmpty)
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: EmptyState(title: emptyTitle, message: emptyMessage),
              ),
            )
          else
            RecipeGrid(recipes: recipes),
        ],
      ),
    );
  }
}

class CalorieTrackerScreen extends StatelessWidget {
  const CalorieTrackerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('CALORIE TRACKER'),
        backgroundColor: AppColors.bg,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                firstDate: DateTime(2020),
                lastDate: DateTime.now().add(const Duration(days: 1)),
                initialDate: state.selectedDate,
              );
              if (picked != null && context.mounted) {
                await context.read<AppState>().setDate(picked);
              }
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showFoodLogSheet(context),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<AppState>().loadDashboard(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            const SectionHeader(title: "TODAY'S CALORIES"),
            const CalorieSummaryCard(),
            const SizedBox(height: 22),
            SectionHeader(
                title:
                    '${DateFormat('MMM d').format(state.selectedDate).toUpperCase()} FOOD LOG'),
            if (state.logs.isEmpty)
              const EmptyState(
                  title: 'No food logged',
                  message: 'Add a food or log calories from a recipe.')
            else
              ...state.logs.map((log) => FoodLogTile(log: log)),
          ],
        ),
      ),
    );
  }
}

class SettingsPrivacyScreen extends StatelessWidget {
  const SettingsPrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.user!;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar:
          AppBar(title: const Text('SETTINGS'), backgroundColor: AppColors.bg),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'PRIVACY'),
          AppCard(
            child: SwitchListTile(
              value: user.profileVisibility == 'private',
              title: const Text('Private profile'),
              subtitle: const Text(
                  'Only friends can view full profile, food logs, and non-private posts.'),
              onChanged: (value) => state.updateProfile(
                  {'profileVisibility': value ? 'private' : 'public'}),
            ),
          ),
          const SizedBox(height: 18),
          PrimaryButton(label: 'Sign out', onPressed: state.logout),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, required this.message});
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        boxShadow: cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text(message, style: const TextStyle(color: AppColors.muted)),
        ],
      ),
    );
  }
}

class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.field,
                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                skeletonLine(width: double.infinity),
                const SizedBox(height: 8),
                skeletonLine(width: 88),
                const SizedBox(height: 10),
                skeletonLine(width: double.infinity),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Widget skeletonLine({required double width}) {
  return Align(
    alignment: Alignment.centerLeft,
    child: Container(
      width: width,
      height: 12,
      decoration: BoxDecoration(
        color: AppColors.field,
        borderRadius: BorderRadius.circular(99),
      ),
    ),
  );
}

const cardShadow = [
  BoxShadow(
    color: Color(0x33000000),
    blurRadius: 18,
    offset: Offset(0, 10),
  ),
];
