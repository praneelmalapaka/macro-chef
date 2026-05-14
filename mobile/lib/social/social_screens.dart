part of '../main.dart';

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
            prefixIcon: Icon(Icons.search),
          ),
          onSubmitted: (_) => runSearch(),
        ),

        const SizedBox(height: 12),

        PrimaryButton(
          label: 'Search',
          loading: state.busy,
          onPressed: runSearch,
        ),

        const SizedBox(height: 24),

        const SectionHeader(title: 'RECIPES'),

        if (state.recipeSearchResults.isEmpty)
          const EmptyState(
            title: 'Find your next cook',
            message: 'Search for a dish, tag, or creator.',
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: state.recipeSearchResults.length,
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 320,
              childAspectRatio: 0.72,
              crossAxisSpacing: 13,
              mainAxisSpacing: 14,
            ),
            itemBuilder: (context, index) {
              return RecipeCard(recipe: state.recipeSearchResults[index]);
            },
          ),

        const SizedBox(height: 24),

        const SectionHeader(title: 'MEMBERS'),

        if (state.searchResults.isEmpty)
          const EmptyState(
            title: 'No members selected',
            message: 'Search by username or display name.',
          )
        else
          ...state.searchResults.map(
            (user) => FriendCard(
              user: user,
              action: 'REQUEST',
              onAction: () async {
                await context.read<AppState>().sendFriendRequest(user.username);

                if (context.mounted) {
                  showSnack(context, 'Friend request sent');
                }
              },
            ),
          ),
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

    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<AppState>().loadFriends(),
    );
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
              message: 'Incoming friend requests will land here.',
            )
          else
            ...state.incoming.map(
              (req) => AppCard(
                margin: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Expanded(child: UserMini(user: req.user)),
                    IconButton(
                      onPressed: () => state.acceptRequest(req.requestId),
                      icon: const Icon(Icons.check, color: AppColors.green),
                    ),
                    IconButton(
                      onPressed: () => state.rejectRequest(req.requestId),
                      icon: const Icon(Icons.close, color: AppColors.red),
                    ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 24),

          const SectionHeader(title: 'NETWORK'),

          if (state.friends.isEmpty)
            const EmptyState(
              title: 'Build your table',
              message: 'Add friends to see their recipes and food activity.',
            )
          else
            ...state.friends.map(
              (friend) => FriendCard(
                user: friend,
                action: 'REMOVE',
                onAction: () => state.removeFriend(friend.id),
              ),
            ),

          const SizedBox(height: 24),

          const SectionHeader(title: 'OUTGOING'),

          if (state.outgoing.isEmpty)
            const EmptyState(
              title: 'No pending requests',
              message: 'Sent requests will appear here.',
            )
          else
            ...state.outgoing.map(
              (req) => FriendCard(user: req.user),
            ),
        ],
      ),
    );
  }
}

class FriendCard extends StatelessWidget {
  const FriendCard({
    super.key,
    required this.user,
    this.action,
    this.onAction,
  });

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
              borderRadius: BorderRadius.circular(14),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => FriendProfileScreen(username: user.username),
                ),
              ),
              child: UserMini(user: user),
            ),
          ),
          if (action != null)
            TextButton(
              onPressed: onAction,
              child: Text(action!),
            ),
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
      (_) => context.read<AppState>().loadProfileRecipes(),
    );
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
                            builder: (_) => const EditProfileScreen(),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const SettingsPrivacyScreen(),
                          ),
                        ),
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
                message: 'Use the plus button to publish your first dish.',
              ),
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
      (_) => context.read<AppState>().loadSavedRecipes(),
    );
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
      (_) => context.read<AppState>().loadLikedRecipes(),
    );
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
      appBar: AppBar(
        title: Text(title),
        backgroundColor: AppColors.bg,
      ),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverToBoxAdapter(
              child: SectionHeader(title: title),
            ),
          ),
          if (recipes.isEmpty)
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: EmptyState(
                  title: emptyTitle,
                  message: emptyMessage,
                ),
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
                  '${DateFormat('MMM d').format(state.selectedDate).toUpperCase()} FOOD LOG',
            ),

            if (state.logs.isEmpty)
              const EmptyState(
                title: 'No food logged',
                message: 'Add a food or log calories from a recipe.',
              )
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
      appBar: AppBar(
        title: const Text('SETTINGS'),
        backgroundColor: AppColors.bg,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'PRIVACY'),

          AppCard(
            child: SwitchListTile(
              value: user.profileVisibility == 'private',
              title: const Text('Private profile'),
              subtitle: const Text(
                'Only friends can view full profile, food logs, and non-private posts.',
              ),
              onChanged: (value) {
                state.updateProfile({
                  'profileVisibility': value ? 'private' : 'public',
                });
              },
            ),
          ),

          const SizedBox(height: 18),

          PrimaryButton(
            label: 'Sign out',
            onPressed: state.logout,
          ),
        ],
      ),
    );
  }
}