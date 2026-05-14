part of '../main.dart';

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

class LocalisedIngredient {
  const LocalisedIngredient({
    required this.original,
    required this.local,
    required this.matched,
    required this.confidence,
    this.brandSuggestion,
    this.storeHint,
    this.notes,
  });

  final String original;
  final String local;
  final bool matched;
  final double confidence;
  final String? brandSuggestion;
  final String? storeHint;
  final String? notes;

  factory LocalisedIngredient.fromJson(Map<String, dynamic> json) {
    return LocalisedIngredient(
      original: json['original'] ?? '',
      local: json['local'] ?? '',
      matched: json['matched'] == true,
      confidence: (json['confidence'] ?? 0).toDouble(),
      brandSuggestion: json['brandSuggestion'],
      storeHint: json['storeHint'],
      notes: json['notes'],
    );
  }
}

DateTime? parseDate(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse('$value')?.toLocal();
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

List<RecipePost> mergeRecipes(
  List<RecipePost> current,
  List<RecipePost> next,
) {
  final seen = current.map((recipe) => recipe.id).toSet();

  return [
    ...current,
    ...next.where((recipe) => seen.add(recipe.id)),
  ];
}

List<RecipePost> replaceInRecipes(
  List<RecipePost> recipes,
  RecipePost recipe,
) {
  return recipes
      .map((item) => item.id == recipe.id ? recipe : item)
      .toList();
}

List<RecipePost> replaceOrAddRecipe(
  List<RecipePost> recipes,
  RecipePost recipe,
) {
  final replaced = replaceInRecipes(recipes, recipe);

  return recipes.any((item) => item.id == recipe.id)
      ? replaced
      : [recipe, ...replaced];
}