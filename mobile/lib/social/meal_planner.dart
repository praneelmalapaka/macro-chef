part of '../main.dart';

class MealPlanItem {
  MealPlanItem({
    required this.id,
    required this.mealType,
    required this.plannedFor,
    required this.recipeId,
    required this.title,
    required this.calories,
    this.description = '',
    this.imageUrl,
  });

  final String id;
  final String mealType;
  final DateTime plannedFor;
  final String recipeId;
  final String title;
  final int calories;
  final String description;
  final String? imageUrl;

  factory MealPlanItem.fromJson(Map<String, dynamic> json) {
    return MealPlanItem(
      id: json['id'].toString(),
      mealType: json['meal_type'] ?? json['mealType'] ?? 'snack',
      plannedFor: DateTime.parse(json['planned_for'] ?? json['plannedFor'])
          .toLocal(),
      recipeId: json['recipe_id']?.toString() ?? json['recipeId'].toString(),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['image_url'] ?? json['imageUrl'],
      calories: (json['calories'] ?? 0).round(),
    );
  }
}

class MealPlanShoppingItem {
  const MealPlanShoppingItem({
    required this.recipeId,
    required this.recipeTitle,
    required this.ingredient,
    required this.localName,
    required this.matched,
    required this.confidence,
    this.brandSuggestion,
    this.storeHint,
    this.notes,
    this.rankedSubstitutes = const [],
    this.ontology,
  });

  final String recipeId;
  final String recipeTitle;
  final String ingredient;
  final String localName;
  final bool matched;
  final double confidence;
  final String? brandSuggestion;
  final String? storeHint;
  final String? notes;
  final List<dynamic> rankedSubstitutes;
  final Map<String, dynamic>? ontology;

  factory MealPlanShoppingItem.fromJson(Map<String, dynamic> json) {

    return MealPlanShoppingItem(
      recipeId: json['recipeId'].toString(),
      recipeTitle: json['recipeTitle'] ?? '',
      ingredient: json['ingredient'] ?? '',
      localName: json['localName'] ?? json['ingredient'] ?? '',
      matched: json['matched'] == true,
      confidence: (json['confidence'] ?? 0).toDouble(),
      brandSuggestion: json['brandSuggestion'],
      storeHint: json['storeHint'],
      notes: json['notes'],
      rankedSubstitutes: json['rankedSubstitutes'] as List? ?? [],
      ontology: json['ontology'] as Map<String, dynamic>?,
    );
  }
}

extension MealPlanActions on AppState {
  Future<void> loadMealPlans(DateTime date) async {
    await _run(() async {
      selectedDate = date;

      final key = DateFormat('yyyy-MM-dd').format(date);
      final payload = await api.request('/meal-plans/$key');

      mealPlans = (payload['mealPlans'] as List? ?? [])
          .map((item) => MealPlanItem.fromJson(item))
          .toList();
    }, silent: true);
  }

  Future<void> addRecipeToMealPlan({
    required RecipePost recipe,
    required String mealType,
    required DateTime plannedFor,
  }) async {
    await _run(() async {
      final body = {
        'recipeId': recipe.id,
        'mealType': mealType,
        'plannedFor': DateFormat('yyyy-MM-dd').format(plannedFor),
      };

      await api.request('/meal-plans', method: 'POST', body: body);
      await loadMealPlans(plannedFor);
    });
  }

  Future<void> removeMealPlanItem(String id) async {
    await _run(() async {
      await api.request('/meal-plans/$id', method: 'DELETE');
      await loadMealPlans(selectedDate);
    });
  }

  Future<List<MealPlanShoppingItem>> loadMealPlanShoppingList(
    DateTime date,
  ) async {
    final key = DateFormat('yyyy-MM-dd').format(date);
    final payload = await api.request(
      '/meal-plans/$key/shopping-list?countryCode=AU',
    );

    return (payload['items'] as List? ?? [])
        .map((item) => MealPlanShoppingItem.fromJson(item))
        .toList();
  }

  Future<void> sendSubstituteFeedback({
    required MealPlanShoppingItem item,
    required Map<String, dynamic> substitute,
    required String feedback,
  }) async {
    await api.request(
      '/ingredients/substitute-feedback',
      method: 'POST',
      body: {
        'rawIngredient': item.ingredient,
        'canonicalIngredientId': item.ontology?['ingredient']?['id'],
        'substituteIngredientId': substitute['ingredientId'],
        'substituteDisplayName': substitute['displayName'],
        'regionCode': 'AU',
        'recipeTitle': item.recipeTitle,
        'feedback': feedback,
        'rankingScore': substitute['score'],
        'reasons': substitute['reasons'] ?? [],
        'warnings': substitute['warnings'] ?? [],
      },
    );
  }

  List<MealPlanItem> mealPlansFor(String mealType) {
    return mealPlans.where((item) => item.mealType == mealType).toList();
  }

  int mealPlanCaloriesFor(String mealType) {
    return mealPlansFor(mealType)
        .fold<int>(0, (total, item) => total + item.calories);
  }

  int get mealPlanTotalCalories {
    return mealPlans.fold<int>(0, (total, item) => total + item.calories);
  }
}

class MealPlannerScreen extends StatefulWidget {
  const MealPlannerScreen({super.key});

  @override
  State<MealPlannerScreen> createState() => _MealPlannerScreenState();
}

class _MealPlannerScreenState extends State<MealPlannerScreen> {
  late DateTime selectedDate;

  @override
  void initState() {
    super.initState();
    selectedDate = DateTime.now();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<AppState>().loadMealPlans(selectedDate);
    });
  }

  Future<void> pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );

    if (picked == null) return;

    setState(() => selectedDate = picked);
    if (!mounted) return;
    await context.read<AppState>().loadMealPlans(picked);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final totalCalories = state.mealPlanTotalCalories;
    final goal = state.user?.dailyCalorieGoal ?? 2200;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Meal Planner'),
        backgroundColor: AppColors.bg,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: pickDate,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => state.loadMealPlans(selectedDate),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'PLANNED DAY'),
                  Text(
                    DateFormat('EEEE, MMM d').format(selectedDate),
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: BigMetric(
                          label: 'Planned',
                          value: '$totalCalories',
                          sub: '$goal goal',
                        ),
                      ),
                      Expanded(
                        child: BigMetric(
                          label: 'Remaining',
                          value: '${goal - totalCalories}',
                          sub: 'cal',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  LinearProgressIndicator(
                    value: goal == 0
                        ? 0
                        : (totalCalories / goal).clamp(0.0, 1.0),
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(99),
                    color: AppColors.gold,
                    backgroundColor: AppColors.field,
                  ),
                  const SizedBox(height: 14),
                  PrimaryButton(
                    label: 'Generate shopping list',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MealPlanShoppingListScreen(
                            date: selectedDate,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 22),

            MealSlotSection(
              title: 'Breakfast',
              mealType: 'breakfast',
              items: state.mealPlansFor('breakfast'),
              calories: state.mealPlanCaloriesFor('breakfast'),
              selectedDate: selectedDate,
            ),

            MealSlotSection(
              title: 'Lunch',
              mealType: 'lunch',
              items: state.mealPlansFor('lunch'),
              calories: state.mealPlanCaloriesFor('lunch'),
              selectedDate: selectedDate,
            ),

            MealSlotSection(
              title: 'Dinner',
              mealType: 'dinner',
              items: state.mealPlansFor('dinner'),
              calories: state.mealPlanCaloriesFor('dinner'),
              selectedDate: selectedDate,
            ),

            MealSlotSection(
              title: 'Snacks',
              mealType: 'snack',
              items: state.mealPlansFor('snack'),
              calories: state.mealPlanCaloriesFor('snack'),
              selectedDate: selectedDate,
            ),
          ],
        ),
      ),
    );
  }
}

class MealSlotSection extends StatelessWidget {
  const MealSlotSection({
    super.key,
    required this.title,
    required this.mealType,
    required this.items,
    required this.calories,
    required this.selectedDate,
  });

  final String title;
  final String mealType;
  final List<MealPlanItem> items;
  final int calories;
  final DateTime selectedDate;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: SectionHeader(
                  title: title.toUpperCase(),
                  action: '$calories CAL',
                ),
              ),
              IconButton(
                tooltip: 'Add recipe',
                icon: const Icon(Icons.add_circle_outline),
                onPressed: () {
                  showMealRecipePicker(
                    context,
                    mealType: mealType,
                    selectedDate: selectedDate,
                  );
                },
              ),
            ],
          ),

          if (items.isEmpty)
            Text(
              'No recipe planned yet.',
              style: TextStyle(
                color: AppColors.muted.withValues(alpha: 0.9),
              ),
            )
          else
            ...items.map((item) => MealPlanTile(item: item)),
        ],
      ),
    );
  }
}

class MealPlanTile extends StatelessWidget {
  const MealPlanTile({super.key, required this.item});

  final MealPlanItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.field,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: AppColors.warm,
              borderRadius: BorderRadius.circular(14),
            ),
            clipBehavior: Clip.antiAlias,
            child: item.imageUrl == null || item.imageUrl!.isEmpty
                ? const Icon(Icons.restaurant_menu, color: AppColors.gold)
                : Image.network(
                    item.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.restaurant_menu,
                      color: AppColors.gold,
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${item.calories} cal',
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.rust),
            onPressed: () {
              context.read<AppState>().removeMealPlanItem(item.id);
            },
          ),
        ],
      ),
    );
  }
}

Future<void> showMealRecipePicker(
  BuildContext context, {
  required String mealType,
  required DateTime selectedDate,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    builder: (_) => MealRecipePicker(
      mealType: mealType,
      selectedDate: selectedDate,
    ),
  );
}

class MealRecipePicker extends StatefulWidget {
  const MealRecipePicker({
    super.key,
    required this.mealType,
    required this.selectedDate,
  });

  final String mealType;
  final DateTime selectedDate;

  @override
  State<MealRecipePicker> createState() => _MealRecipePickerState();
}

class _MealRecipePickerState extends State<MealRecipePicker> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = context.read<AppState>();

      if (state.feedRecipes.isEmpty) {
        state.loadFeed(refresh: true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final recipes = state.feedRecipes;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          18,
          14,
          18,
          MediaQuery.of(context).viewInsets.bottom + 18,
        ),
        child: ListView(
          shrinkWrap: true,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Add to ${widget.mealType}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),

            const SizedBox(height: 10),

            if (recipes.isEmpty)
              const EmptyState(
                title: 'No recipes available',
                message: 'Create or load recipes first, then add them here.',
              )
            else
              ...recipes.map(
                (recipe) => AppCard(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          recipe.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      Text(
                        '${recipe.calories} cal',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline),
                        onPressed: () async {
                          final navigator = Navigator.of(context);
                          final messenger = ScaffoldMessenger.of(context);
                          final state = context.read<AppState>();

                          await state.addRecipeToMealPlan(
                            recipe: recipe,
                            mealType: widget.mealType,
                            plannedFor: widget.selectedDate,
                          );

                          if (!mounted) return;

                          navigator.pop();
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('Added to meal plan'),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

Future<void> showMealTypePicker(BuildContext context, RecipePost recipe, {
  DateTime? plannedFor,
  }) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.card,
    builder: (_) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Add to meal plan',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 14),
            for (final mealType in ['breakfast', 'lunch', 'dinner', 'snack'])
              ListTile(
                title: Text(mealType),
                trailing: const Icon(Icons.add),
                onTap: () async {
                  if (int.tryParse(recipe.id) == null) {
                    showSnack(
                      context,
                      'Demo recipes cannot be added to meal plans yet. Create a real recipe first.',
                    );
                    return;
                  }

                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  final state = context.read<AppState>();

                  await state.addRecipeToMealPlan(
                    recipe: recipe,
                    mealType: mealType,
                    plannedFor: plannedFor ?? DateTime.now(),
                  );

                  navigator.pop();

                  messenger.showSnackBar(
                    SnackBar(content: Text('Added to $mealType')),
                  );
                },
              ),
          ],
        ),
      ),
    ),
  );
}

class MealPlanShoppingListScreen extends StatefulWidget {
  const MealPlanShoppingListScreen({
    super.key,
    required this.date,
  });

  final DateTime date;

  @override
  State<MealPlanShoppingListScreen> createState() =>
      _MealPlanShoppingListScreenState();
}

class _MealPlanShoppingListScreenState
    extends State<MealPlanShoppingListScreen> {
  bool loading = true;
  String? error;
  List<MealPlanShoppingItem> items = [];
  final checked = <String>{};

  @override
  void initState() {
    super.initState();
    loadShoppingList();
  }

  Future<void> loadShoppingList() async {
    setState(() {
      loading = true;
      error = null;
      checked.clear();
    });

    try {
      final loaded =
          await context.read<AppState>().loadMealPlanShoppingList(widget.date);

      setState(() => items = loaded);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  String shoppingListText() {
    final buffer = StringBuffer();

    buffer.writeln('MacroChef meal plan shopping list');
    buffer.writeln(DateFormat('EEEE, MMM d').format(widget.date));
    buffer.writeln('');

    for (final item in items) {
      buffer.writeln(
        '- ${item.ingredient} → ${item.localName} (${item.recipeTitle})',
      );

      if (item.brandSuggestion != null &&
          item.brandSuggestion!.trim().isNotEmpty) {
        buffer.writeln('  Brand: ${item.brandSuggestion}');
      }

      if (item.storeHint != null && item.storeHint!.trim().isNotEmpty) {
        buffer.writeln('  Where: ${item.storeHint}');
      }
    }

    return buffer.toString();
  }

  Future<void> copyList() async {
    await Clipboard.setData(ClipboardData(text: shoppingListText()));

    if (mounted) {
      showSnack(context, 'Shopping list copied');
    }
  }

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<MealPlanShoppingItem>>{};

    for (final item in items) {
      grouped.putIfAbsent(item.recipeTitle, () => []).add(item);
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Shopping List'),
        backgroundColor: AppColors.bg,
        actions: [
          if (items.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.copy),
              onPressed: copyList,
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: loadShoppingList,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'MEAL PLAN SHOPPING LIST'),
                  Text(
                    DateFormat('EEEE, MMM d').format(widget.date),
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${items.length} ingredient${items.length == 1 ? '' : 's'} from your planned recipes.',
                    style: const TextStyle(
                      color: AppColors.muted,
                      height: 1.4,
                    ),
                  ),
                  if (items.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    PrimaryButton(
                      label: 'Copy shopping list',
                      onPressed: copyList,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (loading)
              const Padding(
                padding: EdgeInsets.all(28),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (error != null)
              ErrorText(error!)
            else if (items.isEmpty)
              const EmptyState(
                title: 'No shopping list yet',
                message:
                    'Add recipes to your meal plan first, then generate a list.',
              )
            else
              ...grouped.entries.map(
                (entry) => AppCard(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.key,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...entry.value.map(
                        (item) {
                          final key =
                              '${item.recipeId}:${item.recipeTitle}:${item.ingredient}';

                          final topSubstitute = item.rankedSubstitutes.isNotEmpty
                              ? item.rankedSubstitutes.first as Map<String, dynamic>
                              : null;

                          final products = topSubstitute?['products'] as List? ?? [];

                          return CheckboxListTile(
                            value: checked.contains(key),
                            activeColor: AppColors.gold,
                            contentPadding: EdgeInsets.zero,
                            title: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.localName,
                                  style: TextStyle(
                                    color: AppColors.text,
                                    fontWeight: FontWeight.w800,
                                    decoration: checked.contains(key)
                                        ? TextDecoration.lineThrough
                                        : TextDecoration.none,
                                  ),
                                ),
                                if (item.ingredient != item.localName)
                                  Text(
                                    'Original: ${item.ingredient}',
                                    style: const TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                if (item.brandSuggestion != null &&
                                    item.brandSuggestion!.trim().isNotEmpty)
                                  Text(
                                    'Brand: ${item.brandSuggestion}',
                                    style: const TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                if (item.storeHint != null &&
                                    item.storeHint!.trim().isNotEmpty)
                                  Text(
                                    'Where: ${item.storeHint}',
                                    style: const TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                if (topSubstitute != null) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    'Suggested: ${topSubstitute['displayName']}',
                                    style: const TextStyle(
                                      color: AppColors.forest,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  if (products.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    const Text(
                                      'Available products:',
                                      style: TextStyle(
                                        color: AppColors.muted,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    ...products.take(2).map((product) {
                                      final productMap = product as Map<String, dynamic>;

                                      return Text(
                                        '• ${productMap['brand']} ${productMap['name']} (${productMap['retailer']})',
                                        style: const TextStyle(
                                          color: AppColors.muted,
                                          fontSize: 12,
                                        ),
                                      );
                                    }),
                                  ],
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.thumb_up_alt_outlined, size: 18),
                                        onPressed: () async {
                                          await context.read<AppState>().sendSubstituteFeedback(
                                                item: item,
                                                substitute: topSubstitute,
                                                feedback: 'helpful',
                                              );

                                          if (context.mounted) {
                                            showSnack(context, 'Feedback saved');
                                          }
                                        },
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.thumb_down_alt_outlined, size: 18),
                                        onPressed: () async {
                                          await context.read<AppState>().sendSubstituteFeedback(
                                                item: item,
                                                substitute: topSubstitute,
                                                feedback: 'bad',
                                              );

                                          if (context.mounted) {
                                            showSnack(context, 'Feedback saved');
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                ] else if (!item.matched) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    '⚠ Ingredient not yet recognised by MacroChef',
                                    style: TextStyle(
                                      color: Colors.orange.shade700,
                                      fontSize: 12,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ] else ...[
                                  const SizedBox(height: 6),
                                  const Text(
                                    'No substitute suggestion available yet',
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 12,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            onChanged: (_) {
                              setState(() {
                                if (checked.contains(key)) {
                                  checked.remove(key);
                                } else {
                                  checked.add(key);
                                }
                              });
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}