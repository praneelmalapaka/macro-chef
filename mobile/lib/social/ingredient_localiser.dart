part of '../main.dart';

class IngredientLocaliserScreen extends StatefulWidget {
  const IngredientLocaliserScreen({
    super.key,
    required this.recipe,
  });

  final RecipePost recipe;

  @override
  State<IngredientLocaliserScreen> createState() =>
      _IngredientLocaliserScreenState();
}

class _IngredientLocaliserScreenState extends State<IngredientLocaliserScreen> {
  String countryCode = 'AU';
  bool loading = false;
  String? error;
  List<LocalisedIngredient> results = [];

  @override
  void initState() {
    super.initState();
    localiseIngredients();
  }

  Future<void> localiseIngredients() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final payload = await context.read<AppState>().api.request(
        '/ingredients/localise',
        method: 'POST',
        body: {
          'ingredients': widget.recipe.ingredients,
          'countryCode': countryCode,
        },
      );

      final rawResults = payload['results'] as List? ?? [];

      setState(() {
        results = rawResults
            .map((item) => LocalisedIngredient.fromJson(item))
            .toList();
      });
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  String searchUrl(String ingredient, String store) {
    final query = Uri.encodeComponent(ingredient);

    if (store == 'coles') {
      return 'https://www.coles.com.au/search/products?q=$query';
    }

    if (store == 'woolworths') {
      return 'https://www.woolworths.com.au/shop/search/products?searchTerm=$query';
    }

    return 'https://www.google.com/search?q=$query';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Replicate Recipe'),
        backgroundColor: AppColors.bg,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(title: 'LOCALISE INGREDIENTS'),
                Text(
                  widget.recipe.title,
                  style: const TextStyle(
                    fontSize: 26,
                    height: 1.05,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Turn this recipe into a local shopping list with equivalent ingredients, brand hints, and store suggestions.',
                  style: TextStyle(
                    color: AppColors.muted,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),
                DropdownButtonFormField<String>(
                  value: countryCode,
                  decoration: const InputDecoration(labelText: 'Country'),
                  items: const [
                    DropdownMenuItem(value: 'AU', child: Text('Australia')),
                    DropdownMenuItem(value: 'UK', child: Text('United Kingdom')),
                    DropdownMenuItem(value: 'US', child: Text('United States')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => countryCode = value);
                    localiseIngredients();
                  },
                ),
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
          else if (results.isEmpty)
            const EmptyState(
              title: 'No ingredients found',
              message: 'This recipe does not have ingredients to localise yet.',
            )
          else ...[
            const SectionHeader(title: 'SHOPPING LIST'),
            ...results.map(
              (item) => LocalisedIngredientCard(
                item: item,
                searchUrl: searchUrl,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class LocalisedIngredientCard extends StatelessWidget {
  const LocalisedIngredientCard({
    super.key,
    required this.item,
    required this.searchUrl,
  });

  final LocalisedIngredient item;
  final String Function(String ingredient, String store) searchUrl;

  @override
  Widget build(BuildContext context) {
    final equivalent = item.local.isEmpty ? item.original : item.local;

    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Checkbox(
                value: false,
                onChanged: (_) {
                  showSnack(context, 'Checklist persistence is coming next.');
                },
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.original,
                      style: const TextStyle(
                        color: AppColors.faint,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      equivalent,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 21,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: item.matched ? AppColors.goldDim : AppColors.field,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  item.matched
                      ? '${(item.confidence * 100).round()}%'
                      : 'NEW',
                  style: TextStyle(
                    color: item.matched ? AppColors.gold : AppColors.muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (item.brandSuggestion != null &&
              item.brandSuggestion!.trim().isNotEmpty)
            _LocaliserMetaRow(
              icon: Icons.verified_outlined,
              label: 'Brand',
              value: item.brandSuggestion!,
            ),
          if (item.storeHint != null && item.storeHint!.trim().isNotEmpty)
            _LocaliserMetaRow(
              icon: Icons.storefront,
              label: 'Where',
              value: item.storeHint!,
            ),
          if (item.notes != null && item.notes!.trim().isNotEmpty)
            _LocaliserMetaRow(
              icon: Icons.info_outline,
              label: 'Note',
              value: item.notes!,
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    showSnack(
                      context,
                      'Open link manually for now: ${searchUrl(equivalent, 'coles')}',
                    );
                  },
                  child: const Text('Search Coles'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    showSnack(
                      context,
                      'Open link manually for now: ${searchUrl(equivalent, 'woolworths')}',
                    );
                  },
                  child: const Text('Search Woolies'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LocaliserMetaRow extends StatelessWidget {
  const _LocaliserMetaRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 17, color: AppColors.gold),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(
              color: AppColors.muted,
              fontWeight: FontWeight.w800,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: AppColors.text),
            ),
          ),
        ],
      ),
    );
  }
}