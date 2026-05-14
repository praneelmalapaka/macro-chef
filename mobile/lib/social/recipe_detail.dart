part of '../main.dart';

class RecipeDetailScreen extends StatelessWidget {
  const RecipeDetailScreen({
    super.key,
    required this.recipe,
  });

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
        title: Text(
          current.title,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: AppColors.bg,
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 28),
        children: [
          AspectRatio(
            aspectRatio: 1.12,
            child: Stack(
              fit: StackFit.expand,
              children: [
                RecipeImage(recipe: current),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.12),
                        Colors.black.withValues(alpha: 0.68),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 18,
                  right: 18,
                  bottom: 18,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        current.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          height: 1,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor:
                                Colors.white.withValues(alpha: 0.18),
                            child: Text(
                              current.author.username[0].toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '@${current.author.username}',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.86),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.gold,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              '${current.calories} cal',
                              style: const TextStyle(
                                color: AppColors.ink,
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InteractionBar(recipe: current),

                const SizedBox(height: 18),

                if (current.description.isNotEmpty)
                  Text(
                    current.description,
                    style: const TextStyle(
                      height: 1.5,
                      fontSize: 15,
                      color: AppColors.text,
                    ),
                  ),

                const SizedBox(height: 18),

                TagRow(tags: current.tags),

                const SizedBox(height: 26),

                Row(
                  children: [
                    Expanded(
                      child: PrimaryButton(
                        label: 'Log calories',
                        onPressed: () async {
                          await context
                              .read<AppState>()
                              .logRecipeAsFood(current);

                          if (context.mounted) {
                            showSnack(context, 'Recipe logged');
                          }
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.public),
                        label: const Text('Replicate recipe'),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  IngredientLocaliserScreen(recipe: current),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 30),

                const SectionHeader(title: 'INGREDIENTS'),

                ...current.ingredients.map(
                  (item) => DetailLine(text: item),
                ),

                const SizedBox(height: 28),

                const SectionHeader(title: 'INSTRUCTIONS'),

                ...List.generate(
                  current.instructions.length,
                  (index) => DetailLine(
                    text: '${index + 1}. ${current.instructions[index]}',
                  ),
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
  const DetailLine({
    super.key,
    required this.text,
  });

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.text,
          height: 1.45,
          fontSize: 14,
        ),
      ),
    );
  }
}

Future<void> showCommentSheet(
  BuildContext context,
  RecipePost recipe,
) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    builder: (_) => CommentSheet(recipe: recipe),
  );
}

class CommentSheet extends StatefulWidget {
  const CommentSheet({
    super.key,
    required this.recipe,
  });

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
      (_) => context.read<AppState>().loadComments(widget.recipe.id),
    );
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
          18,
          14,
          18,
          MediaQuery.of(context).viewInsets.bottom + 18,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Comments',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),

            const SizedBox(height: 8),

            Flexible(
              child: state.activeComments.isEmpty
                  ? const EmptyState(
                      title: 'No comments yet',
                      message:
                          'Start the conversation around this recipe.',
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: state.activeComments.length,
                      itemBuilder: (context, index) {
                        final comment = state.activeComments[index];

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.field,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                backgroundColor: AppColors.goldDim,
                                child: Text(
                                  initials(comment.author.displayName),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '@${comment.author.username}',
                                      style: const TextStyle(
                                        color: AppColors.muted,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      comment.body,
                                      style: const TextStyle(height: 1.4),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),

            const SizedBox(height: 12),

            AppField(
              controller: body,
              label: 'Add a comment',
            ),

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