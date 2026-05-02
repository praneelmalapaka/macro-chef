import 'package:flutter_test/flutter_test.dart';

import 'package:macrochef/main.dart';

void main() {
  testWidgets('MacroChef renders auth screen', (tester) async {
    final state = AppState()..booting = false;

    await tester
        .pumpWidget(MacroChefApp(initialState: state, bootstrap: false));

    expect(find.text('MacroChef'), findsWidgets);
    expect(find.text('Log in'), findsOneWidget);
  });
}
