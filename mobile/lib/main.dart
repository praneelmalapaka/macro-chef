import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

part 'social.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://YOUR-RENDER-SERVICE.onrender.com',
);

void main() {
  runApp(const MacroChefApp());
}

class MacroChefApp extends StatelessWidget {
  const MacroChefApp({super.key, this.initialState, this.bootstrap = true});

  final AppState? initialState;
  final bool bootstrap;

  @override
  Widget build(BuildContext context) {
    final app = MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'MacroChef',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.bg,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.gold,
          secondary: AppColors.green,
          surface: AppColors.card,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.bg,
          foregroundColor: AppColors.text,
          elevation: 0,
          centerTitle: false,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.field,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.line),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.line),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.gold),
          ),
        ),
      ),
      home: const AppGate(),
    );

    if (initialState != null) {
      return ChangeNotifierProvider.value(value: initialState!, child: app);
    }

    return ChangeNotifierProvider(
      create: (_) {
        final state = AppState();
        if (bootstrap) state.bootstrap();
        return state;
      },
      child: app,
    );
  }
}

class AppColors {
  static const bg = Color(0xFF0B1117);
  static const menu = Color(0xFF101821);
  static const card = Color(0xFF121A22);
  static const field = Color(0xFF18232E);
  static const line = Color(0xFF253241);
  static const text = Color(0xFFE7EDF2);
  static const muted = Color(0xFF8C99A6);
  static const gold = Color(0xFF75D7A4);
  static const green = Color(0xFF66D19E);
  static const blue = Color(0xFF7AA7D9);
  static const red = Color(0xFFFF7A7A);
}

class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class UserProfile {
  UserProfile({
    required this.id,
    required this.username,
    required this.displayName,
    required this.profileVisibility,
    required this.fullProfile,
    this.email,
    this.emailVerified = false,
    this.bio = '',
    this.avatarUrl,
    this.dailyCalorieGoal = 2200,
    this.proteinGoal = 160,
    this.carbsGoal = 220,
    this.fatGoal = 70,
  });

  final String id;
  final String username;
  final String displayName;
  final String? email;
  final bool emailVerified;
  final String bio;
  final String? avatarUrl;
  final int dailyCalorieGoal;
  final int proteinGoal;
  final int carbsGoal;
  final int fatGoal;
  final String profileVisibility;
  final bool fullProfile;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'].toString(),
      username: json['username'] ?? '',
      displayName: json['displayName'] ?? '',
      email: json['email'],
      emailVerified: json['emailVerified'] == true,
      bio: json['bio'] ?? '',
      avatarUrl: json['avatarUrl'],
      dailyCalorieGoal: (json['dailyCalorieGoal'] ?? 2200).round(),
      proteinGoal: (json['proteinGoal'] ?? 160).round(),
      carbsGoal: (json['carbsGoal'] ?? 220).round(),
      fatGoal: (json['fatGoal'] ?? 70).round(),
      profileVisibility: json['profileVisibility'] ?? 'public',
      fullProfile: json['fullProfile'] == true,
    );
  }
}

class FoodLog {
  FoodLog({
    required this.id,
    required this.foodName,
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.mealType,
    required this.consumedAt,
    this.servingSize,
    this.notes,
  });

  final String id;
  final String foodName;
  final int calories;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final String mealType;
  final DateTime consumedAt;
  final String? servingSize;
  final String? notes;

  factory FoodLog.fromJson(Map<String, dynamic> json) {
    return FoodLog(
      id: json['id'].toString(),
      foodName: json['foodName'] ?? '',
      calories: (json['calories'] ?? 0).round(),
      proteinG: (json['proteinG'] ?? 0).toDouble(),
      carbsG: (json['carbsG'] ?? 0).toDouble(),
      fatG: (json['fatG'] ?? 0).toDouble(),
      mealType: json['mealType'] ?? 'other',
      consumedAt: DateTime.parse(json['consumedAt']).toLocal(),
      servingSize: json['servingSize'],
      notes: json['notes'],
    );
  }
}

class FriendRequest {
  FriendRequest({required this.requestId, required this.user});
  final String requestId;
  final UserProfile user;

  factory FriendRequest.fromJson(Map<String, dynamic> json) {
    return FriendRequest(
      requestId: json['requestId'].toString(),
      user: UserProfile.fromJson(json['user']),
    );
  }
}

class DailySummary {
  const DailySummary({
    this.totalCalories = 0,
    this.proteinG = 0,
    this.carbsG = 0,
    this.fatG = 0,
  });

  final int totalCalories;
  final double proteinG;
  final double carbsG;
  final double fatG;

  factory DailySummary.fromJson(Map<String, dynamic> json) {
    return DailySummary(
      totalCalories: (json['totalCalories'] ?? 0).round(),
      proteinG: (json['proteinG'] ?? 0).toDouble(),
      carbsG: (json['carbsG'] ?? 0).toDouble(),
      fatG: (json['fatG'] ?? 0).toDouble(),
    );
  }
}

class ApiClient {
  ApiClient(this._storage);

  final FlutterSecureStorage _storage;
  String? token;

  String get _base => apiBaseUrl.endsWith('/')
      ? apiBaseUrl.substring(0, apiBaseUrl.length - 1)
      : apiBaseUrl;

  Future<void> loadToken() async {
    token = await _storage.read(key: 'macrochef_token');
  }

  Future<void> saveToken(String newToken) async {
    token = newToken;
    await _storage.write(key: 'macrochef_token', value: newToken);
  }

  Future<void> clearToken() async {
    token = null;
    await _storage.delete(key: 'macrochef_token');
  }

  Future<Map<String, dynamic>> request(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$_base$path');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';

    final response = await http.Client().send(
      http.Request(method, uri)
        ..headers.addAll(headers)
        ..body = body == null ? '' : jsonEncode(body),
    );
    final text = await response.stream.bytesToString();
    final payload = text.isEmpty ? <String, dynamic>{} : jsonDecode(text);
    if (response.statusCode >= 400) {
      throw ApiException(payload['error'] ?? 'Request failed');
    }
    return payload is Map<String, dynamic> ? payload : <String, dynamic>{};
  }
}

class AppState extends ChangeNotifier {
  AppState() : api = ApiClient(const FlutterSecureStorage());

  final ApiClient api;
  bool booting = true;
  bool busy = false;
  String? error;
  UserProfile? user;
  DateTime selectedDate = DateTime.now();
  List<FoodLog> logs = [];
  DailySummary summary = const DailySummary();
  List<UserProfile> searchResults = [];
  List<UserProfile> friends = [];
  List<FriendRequest> incoming = [];
  List<FriendRequest> outgoing = [];
  List<RecipePost> feedRecipes = [];
  List<RecipePost> savedRecipes = [];
  List<RecipePost> likedRecipes = [];
  List<RecipePost> profileRecipes = [];
  List<RecipePost> recipeSearchResults = [];
  List<RecipeComment> activeComments = [];
  String feedFilter = 'all';
  String feedSort = 'recent';
  String? selectedTag;
  bool feedHighProtein = false;
  bool feedLowCalorie = false;
  int? feedNextOffset = 0;
  bool recipesLoading = false;
  String? recipeError;

  void refreshUi() => notifyListeners();

  String get dateKey => DateFormat('yyyy-MM-dd').format(selectedDate);
  int get remainingCalories =>
      ((user?.dailyCalorieGoal ?? 2200) - summary.totalCalories);

  Future<void> bootstrap() async {
    try {
      await api.loadToken();
      if (api.token != null) {
        final payload = await api.request('/auth/me');
        user = UserProfile.fromJson(payload['user']);
        if (user!.emailVerified) await loadDashboard();
      }
    } catch (_) {
      await api.clearToken();
      user = null;
    } finally {
      booting = false;
      notifyListeners();
    }
  }

  Future<void> signup(String username, String displayName, String email,
      String password) async {
    await _run(() async {
      final payload = await api.request('/auth/signup', method: 'POST', body: {
        'username': username,
        'displayName': displayName,
        'email': email,
        'password': password,
      });
      await api.saveToken(payload['token']);
      user = UserProfile.fromJson(payload['user']);
    });
  }

  Future<void> login(String email, String password) async {
    await _run(() async {
      final payload = await api.request('/auth/login', method: 'POST', body: {
        'email': email,
        'password': password,
      });
      await api.saveToken(payload['token']);
      user = UserProfile.fromJson(payload['user']);
      if (user!.emailVerified) await loadDashboard(silent: true);
    });
  }

  Future<void> verifyEmail(String code) async {
    await _run(() async {
      final payload = await api
          .request('/auth/verify-email', method: 'POST', body: {'code': code});
      await api.saveToken(payload['token']);
      user = UserProfile.fromJson(payload['user']);
      await loadDashboard(silent: true);
    });
  }

  Future<void> resendVerification() async {
    await _run(() async {
      await api.request('/auth/send-verification', method: 'POST');
    });
  }

  Future<void> logout() async {
    await api.clearToken();
    user = null;
    logs = [];
    summary = const DailySummary();
    feedRecipes = [];
    savedRecipes = [];
    likedRecipes = [];
    profileRecipes = [];
    recipeSearchResults = [];
    activeComments = [];
    feedFilter = 'all';
    feedSort = 'recent';
    selectedTag = null;
    feedHighProtein = false;
    feedLowCalorie = false;
    feedNextOffset = 0;
    notifyListeners();
  }

  Future<void> loadDashboard({bool silent = false}) async {
    await _run(() async {
      final logsPayload = await api.request('/logs?date=$dateKey');
      final summaryPayload = await api.request('/logs/summary?date=$dateKey');
      logs = (logsPayload['logs'] as List? ?? [])
          .map((item) => FoodLog.fromJson(item))
          .toList();
      summary = DailySummary.fromJson(summaryPayload);
    }, silent: silent);
  }

  Future<void> setDate(DateTime date) async {
    selectedDate = date;
    await loadDashboard();
  }

  Future<void> saveLog({
    FoodLog? existing,
    required String foodName,
    required int calories,
    required double proteinG,
    required double carbsG,
    required double fatG,
    required String mealType,
    required DateTime consumedAt,
    String? servingSize,
    String? notes,
  }) async {
    final body = {
      'foodName': foodName,
      'calories': calories,
      'proteinG': proteinG,
      'carbsG': carbsG,
      'fatG': fatG,
      'mealType': mealType,
      'consumedAt': consumedAt.toUtc().toIso8601String(),
      'servingSize': servingSize,
      'notes': notes,
    };
    await _run(() async {
      if (existing == null) {
        await api.request('/logs', method: 'POST', body: body);
      } else {
        await api.request('/logs/${existing.id}', method: 'PATCH', body: body);
      }
      await loadDashboard(silent: true);
    });
  }

  Future<void> deleteLog(String id) async {
    await _run(() async {
      await api.request('/logs/$id', method: 'DELETE');
      await loadDashboard(silent: true);
    });
  }

  Future<void> updateProfile(Map<String, dynamic> body) async {
    await _run(() async {
      final payload =
          await api.request('/profile', method: 'PATCH', body: body);
      user = UserProfile.fromJson(payload['user']);
    });
  }

  Future<void> searchUsers(String q) async {
    if (q.trim().isEmpty) {
      searchResults = [];
      notifyListeners();
      return;
    }
    await _run(() async {
      final payload =
          await api.request('/users/search?q=${Uri.encodeQueryComponent(q)}');
      searchResults = (payload['users'] as List? ?? [])
          .map((item) => UserProfile.fromJson(item))
          .toList();
    });
  }

  Future<UserProfile> loadUser(String username) async {
    final payload =
        await api.request('/users/${Uri.encodeComponent(username)}');
    return UserProfile.fromJson(payload['user']);
  }

  Future<List<FoodLog>> loadUserLogs(String username, DateTime date) async {
    final key = DateFormat('yyyy-MM-dd').format(date);
    final payload = await api.request(
        '/logs?date=$key&username=${Uri.encodeQueryComponent(username)}');
    return (payload['logs'] as List? ?? [])
        .map((item) => FoodLog.fromJson(item))
        .toList();
  }

  Future<void> sendFriendRequest(String username) async {
    await _run(() async {
      await api.request('/friends/request',
          method: 'POST', body: {'username': username});
      await loadFriends(silent: true);
    });
  }

  Future<void> loadFriends({bool silent = false}) async {
    await _run(() async {
      final friendPayload = await api.request('/friends');
      final requestPayload = await api.request('/friends/requests');
      friends = (friendPayload['friends'] as List? ?? [])
          .map((item) => UserProfile.fromJson(item))
          .toList();
      incoming = (requestPayload['incoming'] as List? ?? [])
          .map((item) => FriendRequest.fromJson(item))
          .toList();
      outgoing = (requestPayload['outgoing'] as List? ?? [])
          .map((item) => FriendRequest.fromJson(item))
          .toList();
    }, silent: silent);
  }

  Future<void> acceptRequest(String requestId) async {
    await _run(() async {
      await api.request('/friends/accept',
          method: 'POST', body: {'requestId': requestId});
      await loadFriends(silent: true);
    });
  }

  Future<void> rejectRequest(String requestId) async {
    await _run(() async {
      await api.request('/friends/reject',
          method: 'POST', body: {'requestId': requestId});
      await loadFriends(silent: true);
    });
  }

  Future<void> removeFriend(String friendId) async {
    await _run(() async {
      await api.request('/friends/$friendId', method: 'DELETE');
      await loadFriends(silent: true);
    });
  }

  Future<void> _run(Future<void> Function() action,
      {bool silent = false}) async {
    if (!silent) {
      busy = true;
      error = null;
      notifyListeners();
    }
    try {
      await action();
    } catch (e) {
      error = e.toString();
      rethrow;
    } finally {
      busy = false;
      notifyListeners();
    }
  }
}

class AppGate extends StatelessWidget {
  const AppGate({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (state.booting) return const SplashScreen();
    if (state.user == null) return const AuthScreen();
    if (!state.user!.emailVerified) return const VerificationScreen();
    return const MainShell();
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppLogo(size: 72),
            SizedBox(height: 18),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool signup = false;
  final username = TextEditingController();
  final displayName = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();

  @override
  void dispose() {
    username.dispose();
    displayName.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 36),
            const AppLogo(size: 76),
            const SizedBox(height: 18),
            Text('MacroChef',
                style: Theme.of(context)
                    .textTheme
                    .headlineLarge
                    ?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            const Text('Track food, hit macros, and keep it social.',
                style: TextStyle(color: AppColors.muted)),
            const SizedBox(height: 28),
            if (signup) ...[
              AppField(controller: username, label: 'Username'),
              AppField(controller: displayName, label: 'Display name'),
            ],
            AppField(
                controller: email,
                label: 'Email',
                keyboardType: TextInputType.emailAddress),
            AppField(controller: password, label: 'Password', obscure: true),
            if (state.error != null) ErrorText(state.error!),
            const SizedBox(height: 10),
            PrimaryButton(
              label: signup ? 'Create account' : 'Log in',
              loading: state.busy,
              onPressed: () async {
                try {
                  if (signup) {
                    await state.signup(username.text, displayName.text,
                        email.text, password.text);
                  } else {
                    await state.login(email.text, password.text);
                  }
                } catch (_) {}
              },
            ),
            TextButton(
              onPressed: () => setState(() => signup = !signup),
              child: Text(signup
                  ? 'Already have an account? Log in'
                  : 'New here? Create account'),
            ),
            TextButton(
              onPressed: () => showSnack(
                  context, 'Password reset is reserved for the next release.'),
              child: const Text('Forgot password?'),
            ),
          ],
        ),
      ),
    );
  }
}

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final code = TextEditingController();

  @override
  void dispose() {
    code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Verify email'), actions: [
        TextButton(onPressed: state.logout, child: const Text('Logout')),
      ]),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Check your inbox',
                    style:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                    'Enter the 6-digit code sent to ${state.user?.email ?? 'your email'}.',
                    style: const TextStyle(color: AppColors.muted)),
                const SizedBox(height: 18),
                AppField(
                    controller: code,
                    label: 'Verification code',
                    keyboardType: TextInputType.number),
                if (state.error != null) ErrorText(state.error!),
                const SizedBox(height: 8),
                PrimaryButton(
                    label: 'Verify',
                    loading: state.busy,
                    onPressed: () async {
                      try {
                        await state.verifyEmail(code.text);
                      } catch (_) {}
                    }),
                TextButton(
                    onPressed: () async {
                      try {
                        await state.resendVerification();
                        if (context.mounted) {
                          showSnack(context, 'Verification code resent');
                        }
                      } catch (_) {}
                    },
                    child: const Text('Resend code')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int index = 0;
  bool menuOpen = false;

  @override
  Widget build(BuildContext context) {
    const pages = [
      PremiumHomeScreen(),
      SearchDiscoverScreen(),
      FriendsNetworkScreen(),
      PremiumProfileScreen(),
    ];
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              children: [
                TopNavBar(
                  onAdd: () => showCreateRecipeSheet(context),
                  onMenu: () => setState(() => menuOpen = true),
                  onSearch: () => setState(() => index = 1),
                ),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 240),
                    child: KeyedSubtree(
                      key: ValueKey(index),
                      child: pages[index],
                    ),
                  ),
                ),
              ],
            ),
            SlideOutMenu(
              open: menuOpen,
              onClose: () => setState(() => menuOpen = false),
              onSelect: handleMenuSelection,
            ),
          ],
        ),
      ),
    );
  }

  void handleMenuSelection(String selection) {
    setState(() => menuOpen = false);
    if (selection == 'signout') {
      context.read<AppState>().logout();
      return;
    }
    if (selection == 'home' ||
        selection == 'recipes' ||
        selection == 'reviews' ||
        selection == 'lists' ||
        selection == 'tags') {
      setState(() => index = selection == 'tags' ? 1 : 0);
      return;
    }
    if (selection == 'profile') {
      setState(() => index = 3);
      return;
    }
    if (selection == 'network' || selection == 'friends') {
      setState(() => index = 2);
      return;
    }

    final routes = <String, Widget>{
      'diary': const CalorieTrackerScreen(),
      'calories': const CalorieTrackerScreen(),
      'saved': const SavedRecipesScreen(),
      'likes': const LikesScreen(),
      'settings': const SettingsPrivacyScreen(),
      'subscriptions': const SettingsPrivacyScreen(),
    };
    final route = routes[selection];
    if (route != null) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => route));
    }
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final goal = state.user?.dailyCalorieGoal ?? 2200;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Today'),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showFoodLogSheet(context),
        label: const Text('Add food'),
        icon: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<AppState>().loadDashboard(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(DateFormat('EEEE, MMM d').format(state.selectedDate),
                      style: const TextStyle(color: AppColors.muted)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                          child: BigMetric(
                              label: 'Calories',
                              value: '${state.summary.totalCalories}',
                              sub: '$goal goal')),
                      Expanded(
                          child: BigMetric(
                              label: 'Remaining',
                              value: '${state.remainingCalories}',
                              sub: 'cal')),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: goal == 0
                        ? 0
                        : (state.summary.totalCalories / goal).clamp(0, 1),
                    minHeight: 9,
                    borderRadius: BorderRadius.circular(99),
                    backgroundColor: AppColors.field,
                  ),
                  const SizedBox(height: 18),
                  MacroRow(summary: state.summary, user: state.user),
                ],
              ),
            ),
            const SizedBox(height: 18),
            const SectionTitle('Food log'),
            if (state.logs.isEmpty)
              const EmptyCard('Nothing logged for this day yet.')
            else
              ...state.logs.map((log) => FoodLogTile(log: log)),
          ],
        ),
      ),
    );
  }
}

class FoodLogTile extends StatelessWidget {
  const FoodLogTile({super.key, required this.log});
  final FoodLog log;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => showFoodLogSheet(context, existing: log),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.field,
              child: Text(
                  log.mealType.isEmpty ? 'O' : log.mealType[0].toUpperCase()),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(log.foodName,
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  Text(
                      '${DateFormat.jm().format(log.consumedAt)} | ${log.mealType}',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('${log.calories}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w900, color: AppColors.gold)),
                Text(
                    '${log.proteinG.toStringAsFixed(0)}p ${log.carbsG.toStringAsFixed(0)}c ${log.fatG.toStringAsFixed(0)}f',
                    style:
                        const TextStyle(color: AppColors.muted, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> showFoodLogSheet(BuildContext context, {FoodLog? existing}) async {
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    builder: (_) => FoodLogForm(existing: existing),
  );
}

class FoodLogForm extends StatefulWidget {
  const FoodLogForm({super.key, this.existing});
  final FoodLog? existing;

  @override
  State<FoodLogForm> createState() => _FoodLogFormState();
}

class _FoodLogFormState extends State<FoodLogForm> {
  late final food =
      TextEditingController(text: widget.existing?.foodName ?? '');
  late final calories =
      TextEditingController(text: widget.existing?.calories.toString() ?? '');
  late final protein = TextEditingController(
      text: widget.existing?.proteinG.toStringAsFixed(0) ?? '0');
  late final carbs = TextEditingController(
      text: widget.existing?.carbsG.toStringAsFixed(0) ?? '0');
  late final fat = TextEditingController(
      text: widget.existing?.fatG.toStringAsFixed(0) ?? '0');
  late final serving =
      TextEditingController(text: widget.existing?.servingSize ?? '');
  late final notes = TextEditingController(text: widget.existing?.notes ?? '');
  late String mealType = widget.existing?.mealType ?? 'breakfast';

  @override
  void dispose() {
    for (final controller in [
      food,
      calories,
      protein,
      carbs,
      fat,
      serving,
      notes
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
            18, 18, 18, MediaQuery.of(context).viewInsets.bottom + 18),
        child: ListView(
          shrinkWrap: true,
          children: [
            Text(widget.existing == null ? 'Add food' : 'Edit food',
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
            const SizedBox(height: 14),
            AppField(controller: food, label: 'Food name'),
            AppField(
                controller: calories,
                label: 'Calories',
                keyboardType: TextInputType.number),
            Row(children: [
              Expanded(child: AppField(controller: protein, label: 'Protein')),
              const SizedBox(width: 8),
              Expanded(child: AppField(controller: carbs, label: 'Carbs')),
              const SizedBox(width: 8),
              Expanded(child: AppField(controller: fat, label: 'Fat')),
            ]),
            DropdownButtonFormField<String>(
              initialValue: mealType,
              decoration: const InputDecoration(labelText: 'Meal'),
              items: const ['breakfast', 'lunch', 'dinner', 'snack', 'other']
                  .map((value) {
                return DropdownMenuItem(value: value, child: Text(value));
              }).toList(),
              onChanged: (value) =>
                  setState(() => mealType = value ?? mealType),
            ),
            const SizedBox(height: 12),
            AppField(controller: serving, label: 'Serving size optional'),
            AppField(controller: notes, label: 'Notes optional'),
            if (state.error != null) ErrorText(state.error!),
            PrimaryButton(
              label: widget.existing == null ? 'Save food' : 'Save changes',
              loading: state.busy,
              onPressed: () async {
                try {
                  await context.read<AppState>().saveLog(
                        existing: widget.existing,
                        foodName: food.text,
                        calories: int.tryParse(calories.text) ?? 0,
                        proteinG: double.tryParse(protein.text) ?? 0,
                        carbsG: double.tryParse(carbs.text) ?? 0,
                        fatG: double.tryParse(fat.text) ?? 0,
                        mealType: mealType,
                        consumedAt: DateTime.now(),
                        servingSize: serving.text.isEmpty ? null : serving.text,
                        notes: notes.text.isEmpty ? null : notes.text,
                      );
                  if (context.mounted) Navigator.pop(context);
                } catch (_) {}
              },
            ),
            if (widget.existing != null)
              TextButton(
                onPressed: () async {
                  await context.read<AppState>().deleteLog(widget.existing!.id);
                  if (context.mounted) Navigator.pop(context);
                },
                child: const Text('Delete log',
                    style: TextStyle(color: AppColors.red)),
              ),
          ],
        ),
      ),
    );
  }
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final search = TextEditingController();

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Search')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: search,
            decoration: const InputDecoration(
                labelText: 'Username or display name',
                prefixIcon: Icon(Icons.search)),
            onSubmitted: context.read<AppState>().searchUsers,
          ),
          const SizedBox(height: 12),
          PrimaryButton(
              label: 'Search users',
              loading: state.busy,
              onPressed: () => state.searchUsers(search.text)),
          const SizedBox(height: 18),
          if (state.searchResults.isEmpty)
            const EmptyCard('Search for verified MacroChef users.')
          else
            ...state.searchResults.map((user) => UserTile(
                user: user,
                action: 'Request',
                onAction: () async {
                  try {
                    await context
                        .read<AppState>()
                        .sendFriendRequest(user.username);
                    if (context.mounted) {
                      showSnack(context, 'Friend request sent');
                    }
                  } catch (_) {}
                })),
        ],
      ),
    );
  }
}

class FriendsScreen extends StatelessWidget {
  const FriendsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Friends'),
        actions: [
          IconButton(
              onPressed: () => state.loadFriends(),
              icon: const Icon(Icons.refresh))
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<AppState>().loadFriends(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionTitle('Incoming requests'),
            if (state.incoming.isEmpty)
              const EmptyCard('No incoming requests.')
            else
              ...state.incoming.map((req) => AppCard(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Row(children: [
                      Expanded(child: UserMini(user: req.user)),
                      IconButton(
                          onPressed: () => state.acceptRequest(req.requestId),
                          icon:
                              const Icon(Icons.check, color: AppColors.green)),
                      IconButton(
                          onPressed: () => state.rejectRequest(req.requestId),
                          icon: const Icon(Icons.close, color: AppColors.red)),
                    ]),
                  )),
            const SizedBox(height: 16),
            const SectionTitle('Friends'),
            if (state.friends.isEmpty)
              const EmptyCard('Friends will show up here.')
            else
              ...state.friends.map((friend) => UserTile(
                  user: friend,
                  action: 'Remove',
                  onAction: () => state.removeFriend(friend.id))),
            const SizedBox(height: 16),
            const SectionTitle('Outgoing'),
            if (state.outgoing.isEmpty)
              const EmptyCard('No pending outgoing requests.')
            else
              ...state.outgoing.map((req) => UserTile(user: req.user)),
          ],
        ),
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.user!;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile'), actions: [
        IconButton(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const EditProfileScreen())),
            icon: const Icon(Icons.edit)),
      ]),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ProfileHeader(user: user),
          const SizedBox(height: 14),
          AppCard(child: MacroGoalList(user: user)),
          const SizedBox(height: 14),
          AppCard(
            child: SwitchListTile(
              value: user.profileVisibility == 'private',
              title: const Text('Private profile'),
              subtitle: const Text(
                  'Only friends can view full profile and food logs.'),
              onChanged: (value) => state.updateProfile(
                  {'profileVisibility': value ? 'private' : 'public'}),
            ),
          ),
          const SizedBox(height: 14),
          PrimaryButton(label: 'Log out', onPressed: state.logout),
        ],
      ),
    );
  }
}

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController displayName;
  late final TextEditingController bio;
  late final TextEditingController calories;
  late final TextEditingController protein;
  late final TextEditingController carbs;
  late final TextEditingController fat;

  @override
  void initState() {
    super.initState();
    final user = context.read<AppState>().user;
    displayName = TextEditingController(text: user?.displayName ?? '');
    bio = TextEditingController(text: user?.bio ?? '');
    calories = TextEditingController(text: '${user?.dailyCalorieGoal ?? 2200}');
    protein = TextEditingController(text: '${user?.proteinGoal ?? 160}');
    carbs = TextEditingController(text: '${user?.carbsGoal ?? 220}');
    fat = TextEditingController(text: '${user?.fatGoal ?? 70}');
  }

  @override
  void dispose() {
    for (final controller in [
      displayName,
      bio,
      calories,
      protein,
      carbs,
      fat
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppField(controller: displayName, label: 'Display name'),
          AppField(controller: bio, label: 'Bio'),
          AppField(controller: calories, label: 'Daily calorie goal'),
          Row(children: [
            Expanded(child: AppField(controller: protein, label: 'Protein')),
            const SizedBox(width: 8),
            Expanded(child: AppField(controller: carbs, label: 'Carbs')),
            const SizedBox(width: 8),
            Expanded(child: AppField(controller: fat, label: 'Fat')),
          ]),
          PrimaryButton(
            label: 'Save profile',
            loading: state.busy,
            onPressed: () async {
              await state.updateProfile({
                'displayName': displayName.text,
                'bio': bio.text,
                'dailyCalorieGoal': int.tryParse(calories.text) ?? 2200,
                'proteinGoal': int.tryParse(protein.text) ?? 0,
                'carbsGoal': int.tryParse(carbs.text) ?? 0,
                'fatGoal': int.tryParse(fat.text) ?? 0,
              });
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}

class FriendProfileScreen extends StatefulWidget {
  const FriendProfileScreen({super.key, required this.username});
  final String username;

  @override
  State<FriendProfileScreen> createState() => _FriendProfileScreenState();
}

class _FriendProfileScreenState extends State<FriendProfileScreen> {
  UserProfile? profile;
  List<FoodLog> logs = [];
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final state = context.read<AppState>();
      final loadedProfile = await state.loadUser(widget.username);
      List<FoodLog> loadedLogs = [];
      if (loadedProfile.fullProfile) {
        loadedLogs = await state.loadUserLogs(widget.username, DateTime.now());
      }
      setState(() {
        profile = loadedProfile;
        logs = loadedLogs;
      });
    } catch (e) {
      setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.username)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (error != null) ErrorText(error!),
          if (profile == null && error == null)
            const Center(child: CircularProgressIndicator()),
          if (profile != null) ...[
            ProfileHeader(user: profile!),
            const SizedBox(height: 14),
            if (!profile!.fullProfile)
              const EmptyCard(
                  'This profile is private. Become friends to view food logs.')
            else ...[
              const SectionTitle('Today logs'),
              if (logs.isEmpty)
                const EmptyCard('No logs today.')
              else
                ...logs.map((log) => FoodLogTile(log: log)),
            ],
          ],
        ],
      ),
    );
  }
}

class UserTile extends StatelessWidget {
  const UserTile({super.key, required this.user, this.action, this.onAction});
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

class UserMini extends StatelessWidget {
  const UserMini({super.key, required this.user});
  final UserProfile user;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      CircleAvatar(
          backgroundColor: AppColors.field,
          child: Text(initials(user.displayName))),
      const SizedBox(width: 12),
      Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(user.displayName,
            style: const TextStyle(fontWeight: FontWeight.w800)),
        Text('@${user.username} | ${user.profileVisibility}',
            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      ])),
    ]);
  }
}

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({super.key, required this.user});
  final UserProfile user;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          CircleAvatar(
              radius: 34,
              backgroundColor: AppColors.field,
              child: Text(initials(user.displayName),
                  style: const TextStyle(fontSize: 20))),
          const SizedBox(width: 14),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(user.displayName,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w900)),
              Text('@${user.username}',
                  style: const TextStyle(color: AppColors.gold)),
              if (user.bio.isNotEmpty)
                Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(user.bio)),
            ]),
          ),
        ],
      ),
    );
  }
}

class MacroGoalList extends StatelessWidget {
  const MacroGoalList({super.key, required this.user});
  final UserProfile user;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Goals', style: TextStyle(fontWeight: FontWeight.w900)),
      const SizedBox(height: 12),
      MacroPill(label: 'Calories', value: '${user.dailyCalorieGoal}'),
      MacroPill(label: 'Protein', value: '${user.proteinGoal}g'),
      MacroPill(label: 'Carbs', value: '${user.carbsGoal}g'),
      MacroPill(label: 'Fat', value: '${user.fatGoal}g'),
    ]);
  }
}

class MacroRow extends StatelessWidget {
  const MacroRow({super.key, required this.summary, required this.user});
  final DailySummary summary;
  final UserProfile? user;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
          child: MacroPill(
              label: 'Protein',
              value:
                  '${summary.proteinG.toStringAsFixed(0)} / ${user?.proteinGoal ?? 160}g')),
      const SizedBox(width: 8),
      Expanded(
          child: MacroPill(
              label: 'Carbs',
              value:
                  '${summary.carbsG.toStringAsFixed(0)} / ${user?.carbsGoal ?? 220}g')),
      const SizedBox(width: 8),
      Expanded(
          child: MacroPill(
              label: 'Fat',
              value:
                  '${summary.fatG.toStringAsFixed(0)} / ${user?.fatGoal ?? 70}g')),
    ]);
  }
}

class MacroPill extends StatelessWidget {
  const MacroPill({super.key, required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: AppColors.field,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.line)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value,
            style: const TextStyle(
                fontWeight: FontWeight.w900, color: AppColors.text)),
        const SizedBox(height: 3),
        Text(label,
            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      ]),
    );
  }
}

class BigMetric extends StatelessWidget {
  const BigMetric(
      {super.key, required this.label, required this.value, required this.sub});
  final String label;
  final String value;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: AppColors.muted)),
      Text(value,
          style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900)),
      Text(sub, style: const TextStyle(color: AppColors.muted)),
    ]);
  }
}

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.margin});
  final Widget child;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        boxShadow: cardShadow,
      ),
      child: child,
    );
  }
}

class AppField extends StatelessWidget {
  const AppField({
    super.key,
    required this.controller,
    required this.label,
    this.obscure = false,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final bool obscure;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        minLines: keyboardType == TextInputType.multiline ? 3 : 1,
        maxLines: keyboardType == TextInputType.multiline ? null : 1,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton(
      {super.key,
      required this.label,
      required this.onPressed,
      this.loading = false});
  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: loading ? null : onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      child: loading
          ? const SizedBox(
              height: 18,
              width: 18,
              child: CircularProgressIndicator(strokeWidth: 2))
          : Text(label),
    );
  }
}

class AppLogo extends StatelessWidget {
  const AppLogo({super.key, required this.size});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.gold)),
      child: const Icon(Icons.restaurant_menu, color: AppColors.gold, size: 34),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
    );
  }
}

class EmptyCard extends StatelessWidget {
  const EmptyCard(this.message, {super.key});
  final String message;

  @override
  Widget build(BuildContext context) {
    return AppCard(
        child: Text(message, style: const TextStyle(color: AppColors.muted)));
  }
}

class ErrorText extends StatelessWidget {
  const ErrorText(this.message, {super.key});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(message, style: const TextStyle(color: AppColors.red)),
    );
  }
}

String initials(String value) {
  final parts = value
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'MC';
  return parts.take(2).map((part) => part[0].toUpperCase()).join();
}

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
