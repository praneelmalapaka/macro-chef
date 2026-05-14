part of '../main.dart';

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

  XFile? selectedImage;
  final picker = ImagePicker();

  String visibility = 'public';

  Future<void> pickImage() async {
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        selectedImage = image;
      });
    }
  }

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
                const Expanded(
                  child: Text(
                    'Post recipe',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),

            const SizedBox(height: 10),

            GestureDetector(
              onTap: pickImage,
              child: Container(
                height: 190,
                decoration: BoxDecoration(
                  color: AppColors.field,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.line),
                ),
                child: selectedImage == null
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add_a_photo, size: 42),
                            SizedBox(height: 8),
                            Text(
                              'Select recipe image',
                              style: TextStyle(
                                color: AppColors.muted,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Image.file(
                          File(selectedImage!.path),
                          fit: BoxFit.cover,
                          width: double.infinity,
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 16),

            AppField(controller: title, label: 'Recipe title'),
            AppField(controller: description, label: 'Description'),

            AppField(
              controller: ingredients,
              label: 'Ingredients, one per line',
              keyboardType: TextInputType.multiline,
            ),

            AppField(
              controller: instructions,
              label: 'Steps, one per line',
              keyboardType: TextInputType.multiline,
            ),

            AppField(
              controller: calories,
              label: 'Calories',
              keyboardType: TextInputType.number,
            ),

            AppField(controller: tags, label: 'Tags, comma separated'),

            DropdownButtonFormField<String>(
              value: visibility,
              decoration: const InputDecoration(labelText: 'Visibility'),
              items: const ['public', 'friends', 'private']
                  .map(
                    (value) => DropdownMenuItem(
                      value: value,
                      child: Text(value),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() {
                  visibility = value ?? visibility;
                });
              },
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
                        imageUrl: selectedImage?.path ?? imageUrl.text,
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