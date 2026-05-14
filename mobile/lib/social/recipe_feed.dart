part of '../main.dart';

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
  const NavIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
  });

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
        child: Icon(
          icon,
          color: AppColors.text.withValues(alpha: 0.82),
          size: 24,
        ),
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
            width: MediaQuery.of(context).size.width.clamp(0.0, 360.0),
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
                              Text(
                                user?.displayName ?? 'MacroChef',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 18,
                                ),
                              ),
                              Text(
                                '@${user?.username ?? 'member'}',
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 12,
                                ),
                              ),
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
                          child: MenuColumn(
                            items: const [
                              ['HOME', 'home'],
                              ['RECIPES', 'recipes'],
                              ['REVIEWS', 'reviews'],
                              ['LISTS', 'lists'],
                              ['TAGS', 'tags'],
                            ],
                            onSelect: onSelect,
                          ),
                        ),
                        const SizedBox(width: 34),
                        Expanded(
                          child: MenuColumn(
                            items: const [
                              ['PROFILE', 'profile'],
                              ['DIARY', 'diary'],
                              ['SAVED', 'saved'],
                              ['LIKES', 'likes'],
                              ['NETWORK', 'network'],
                            ],
                            onSelect: onSelect,
                          ),
                        ),
                      ],
                    ),
                    const MenuDivider(),
                    MenuColumn(
                      items: const [
                        ['CALORIE TRACKER', 'calories'],
                        ['FRIENDS', 'friends'],
                        ['SETTINGS', 'settings'],
                        ['SUBSCRIPTIONS', 'subscriptions'],
                        ['SIGN OUT', 'signout'],
                      ],
                      onSelect: onSelect,
                    ),
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
  const MenuColumn({
    super.key,
    required this.items,
    required this.onSelect,
  });

  final List<List<String>> items;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: items
          .map(
            (item) => MenuTextButton(
              label: item[0],
              onTap: () => onSelect(item[1]),
            ),
          )
          .toList(),
    );
  }
}

class MenuTextButton extends StatelessWidget {
  const MenuTextButton({
    super.key,
    required this.label,
    required this.onTap,
  });

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
    return Text(
      label,
      style: const TextStyle(
        color: AppColors.muted,
        fontSize: 11,
        fontWeight: FontWeight.w700,
      ),
    );
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
                    title: "TODAY'S CALORIES",
                    action: 'TRACKER',
                  ),
                  CalorieSummaryCard(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const CalorieTrackerScreen(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const SectionHeader(
                    title: 'NEW FROM FRIENDS',
                    action: 'ALL ACTIVITY',
                  ),
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
  const SectionHeader({
    super.key,
    required this.title,
    this.action,
  });

  final String title;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.muted,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(child: Divider(color: AppColors.line, height: 1)),
          if (action != null) ...[
            const SizedBox(width: 12),
            Text(
              action!,
              style: const TextStyle(
                color: AppColors.muted,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
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
                    label: 'Consumed',
                    value: '$consumed',
                    sub: '$goal goal',
                  ),
                ),
                Expanded(
                  child: BigMetric(
                    label: 'Remaining',
                    value: '${state.remainingCalories}',
                    sub: 'cal',
                  ),
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
              lowCalorie: false,
            ),
          ),
          FilterChipButton(
            label: 'Friends',
            selected: state.feedFilter == 'friends',
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'friends',
              tag: '',
              highProtein: false,
              lowCalorie: false,
            ),
          ),
          FilterChipButton(
            label: 'Public',
            selected: state.feedFilter == 'public',
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'public',
              tag: '',
              highProtein: false,
              lowCalorie: false,
            ),
          ),
          FilterChipButton(
            label: 'Saved',
            selected: state.feedFilter == 'saved',
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'saved',
              tag: '',
              highProtein: false,
              lowCalorie: false,
            ),
          ),
          FilterChipButton(
            label: 'High protein',
            selected:
                state.feedHighProtein || state.selectedTag == 'high-protein',
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'all',
              tag: 'high-protein',
              highProtein: true,
              lowCalorie: false,
            ),
          ),
          FilterChipButton(
            label: 'Low calorie',
            selected: state.feedLowCalorie,
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'all',
              tag: '',
              highProtein: false,
              lowCalorie: true,
            ),
          ),
          FilterChipButton(
            label: 'Popular',
            selected: state.feedSort == 'popular',
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'all',
              sort: 'popular',
              tag: '',
              highProtein: false,
              lowCalorie: false,
            ),
          ),
          FilterChipButton(
            label: 'Mine',
            selected: state.feedFilter == 'mine',
            onTap: () => state.loadFeed(
              refresh: true,
              filter: 'mine',
              tag: '',
              highProtein: false,
              lowCalorie: false,
            ),
          ),
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
              : AppColors.line,
        ),
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
          maxCrossAxisExtent: 320,
          childAspectRatio: 0.72,
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
          maxCrossAxisExtent: 320,
          childAspectRatio: 0.72,
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
    final username = recipe.author.username.isEmpty
        ? 'member'
        : recipe.author.username;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => RecipeDetailScreen(recipe: recipe),
          ),
        ),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: cardShadowLg,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              fit: StackFit.expand,
              children: [
                RecipeImage(recipe: recipe, compact: true),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.04),
                        Colors.black.withValues(alpha: 0.18),
                        Colors.black.withValues(alpha: 0.76),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  top: 14,
                  left: 14,
                  right: 14,
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.88),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${recipe.calories} cal',
                          style: const TextStyle(
                            color: AppColors.ink,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.35),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          recipe.savedByMe
                              ? Icons.bookmark
                              : Icons.bookmark_border,
                          size: 18,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recipe.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 22,
                          height: 1.05,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor:
                                Colors.white.withValues(alpha: 0.18),
                            child: Text(
                              username[0].toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '@$username',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.82),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TagRow(tags: recipe.tags.take(2).toList()),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          _Metric(
                            icon: Icons.favorite,
                            value: '${recipe.likeCount}',
                          ),
                          const SizedBox(width: 14),
                          _Metric(
                            icon: Icons.mode_comment_outlined,
                            value: '${recipe.commentCount}',
                          ),
                          const Spacer(),
                          const Icon(
                            Icons.arrow_forward,
                            size: 18,
                            color: Colors.white70,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.icon,
    required this.value,
  });

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white70),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class RecipeImage extends StatelessWidget {
  const RecipeImage({
    super.key,
    required this.recipe,
    this.compact = false,
  });

  final RecipePost recipe;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final url = recipe.imageUrl;

    if (url != null && url.isNotEmpty) {
      if (url.startsWith('http')) {
        return Image.network(
          url,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
          errorBuilder: (_, __, ___) => RecipeImageFallback(recipe: recipe),
        );
      }

      return Image.file(
        File(url),
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
    final first = recipe.title.isEmpty ? 'MC' : recipe.title[0].toUpperCase();

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.cream, AppColors.warm, AppColors.paper],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          first,
          style: TextStyle(
            fontSize: 56,
            fontWeight: FontWeight.w900,
            color: AppColors.ink.withValues(alpha: 0.72),
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
          .map(
            (tag) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.goldDim,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                tag,
                style: const TextStyle(
                  color: AppColors.gold,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class InteractionBar extends StatelessWidget {
  const InteractionBar({
    super.key,
    required this.recipe,
    this.compact = false,
  });

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
            Icon(
              icon,
              size: 17,
              color: active ? AppColors.gold : AppColors.muted,
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 3),
              Text(
                label,
                style: TextStyle(
                  color: active ? AppColors.text : AppColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ],
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