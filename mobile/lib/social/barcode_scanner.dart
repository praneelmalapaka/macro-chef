part of '../main.dart';

class ScannedProduct {
  const ScannedProduct({
    required this.barcode,
    required this.name,
    this.brand,
    this.imageUrl,
    this.quantity,
    this.servingSize,
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.sodiumMg,
    required this.source,
  });

  final String barcode;
  final String name;
  final String? brand;
  final String? imageUrl;
  final String? quantity;
  final String? servingSize;
  final int calories;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final int sodiumMg;
  final String source;

  factory ScannedProduct.fromJson(Map<String, dynamic> json) {
    return ScannedProduct(
      barcode: json['barcode'].toString(),
      name: json['name'] ?? 'Unknown product',
      brand: json['brand'],
      imageUrl: json['imageUrl'],
      quantity: json['quantity'],
      servingSize: json['servingSize'],
      calories: (json['calories'] ?? 0).round(),
      proteinG: (json['proteinG'] ?? 0).toDouble(),
      carbsG: (json['carbsG'] ?? 0).toDouble(),
      fatG: (json['fatG'] ?? 0).toDouble(),
      sodiumMg: (json['sodiumMg'] ?? 0).round(),
      source: json['source'] ?? 'Open Food Facts',
    );
  }
}

class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  bool locked = false;
  bool loading = false;
  String? error;
  String? barcode;
  ScannedProduct? product;

  final gramsController = TextEditingController(text: '100');

  @override
  void dispose() {
    gramsController.dispose();
    super.dispose();
  }

  double get selectedGrams {
    return double.tryParse(gramsController.text) ?? 100;
  }

  double scaleValue(num value) {
    return value * selectedGrams / 100;
  }

  Future<void> lookupBarcode(String code) async {
    setState(() {
      locked = true;
      loading = true;
      error = null;
      barcode = code;
      product = null;
      gramsController.text = '100';
    });

    try {
      final payload =
          await context.read<AppState>().api.request('/products/barcode/$code');

      setState(() {
        product = ScannedProduct.fromJson(payload);
      });
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  void resetScanner() {
    setState(() {
      locked = false;
      loading = false;
      error = null;
      barcode = null;
      product = null;
      gramsController.text = '100';
    });
  }

  Future<void> logProduct() async {
    final item = product;
    if (item == null) return;

    await context.read<AppState>().saveLog(
          foodName: item.name,
          calories: scaleValue(item.calories).round(),
          proteinG: scaleValue(item.proteinG),
          carbsG: scaleValue(item.carbsG),
          fatG: scaleValue(item.fatG),
          mealType: 'other',
          consumedAt: DateTime.now(),
          servingSize: '${selectedGrams.toStringAsFixed(0)}g',
          notes:
              'Scanned barcode ${item.barcode}. Sodium: ${scaleValue(item.sodiumMg).round()}mg. Source: ${item.source}.',
        );

    if (!mounted) return;

    showSnack(context, 'Logged ${item.name}');
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Scan food'),
        backgroundColor: AppColors.bg,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: resetScanner,
          ),
        ],
      ),
      body: Stack(
        children: [
          if (!locked)
            MobileScanner(
              onDetect: (capture) {
                if (locked) return;

                final code = capture.barcodes.first.rawValue;
                if (code == null || code.isEmpty) return;

                lookupBarcode(code);
              },
            )
          else
            Container(color: AppColors.bg),
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: _ScannerBottomPanel(
              barcode: barcode,
              loading: loading,
              error: error,
              product: product,
              gramsController: gramsController,
              scaleValue: scaleValue,
              onRetry: resetScanner,
              onLog: logProduct,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerBottomPanel extends StatelessWidget {
  const _ScannerBottomPanel({
    required this.barcode,
    required this.loading,
    required this.error,
    required this.product,
    required this.gramsController,
    required this.scaleValue,
    required this.onRetry,
    required this.onLog,
  });

  final String? barcode;
  final bool loading;
  final String? error;
  final ScannedProduct? product;
  final TextEditingController gramsController;
  final double Function(num value) scaleValue;
  final VoidCallback onRetry;
  final VoidCallback onLog;

  @override
  Widget build(BuildContext context) {
    if (barcode == null && !loading) {
      return const AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Point camera at barcode',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.ink,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'MacroChef will look up calories, macros, and sodium automatically.',
              style: TextStyle(color: AppColors.muted),
            ),
          ],
        ),
      );
    }

    if (loading) {
      return const AppCard(
        child: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 14),
            Expanded(child: Text('Looking up nutrition...')),
          ],
        ),
      );
    }

    if (error != null) {
      return AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Could not find product',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 6),
            Text(error!, style: const TextStyle(color: AppColors.red)),
            const SizedBox(height: 12),
            PrimaryButton(label: 'Scan again', onPressed: onRetry),
          ],
        ),
      );
    }

    final item = product!;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image.network(
                item.imageUrl!,
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          const SizedBox(height: 12),
          Text(
            item.name,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppColors.ink,
            ),
          ),
          if (item.brand != null)
            Text(item.brand!, style: const TextStyle(color: AppColors.muted)),
          if (item.quantity != null || item.servingSize != null)
            Text(
              [
                if (item.quantity != null) item.quantity!,
                if (item.servingSize != null && item.servingSize!.isNotEmpty)
                  'serving: ${item.servingSize}',
              ].join(' • '),
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: gramsController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Amount eaten',
              suffixText: 'g',
            ),
          ),
          const SizedBox(height: 12),
          AnimatedBuilder(
            animation: gramsController,
            builder: (context, _) {
              return Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: MacroPill(
                          label: 'Calories',
                          value: '${scaleValue(item.calories).round()}',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: MacroPill(
                          label: 'Protein',
                          value:
                              '${scaleValue(item.proteinG).toStringAsFixed(1)}g',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: MacroPill(
                          label: 'Carbs',
                          value:
                              '${scaleValue(item.carbsG).toStringAsFixed(1)}g',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: MacroPill(
                          label: 'Fat',
                          value:
                              '${scaleValue(item.fatG).toStringAsFixed(1)}g',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: MacroPill(
                          label: 'Sodium',
                          value: '${scaleValue(item.sodiumMg).round()}mg',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: MacroPill(
                          label: 'Source',
                          value: item.source,
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 14),
          PrimaryButton(label: 'Log food', onPressed: onLog),
          TextButton(onPressed: onRetry, child: const Text('Scan again')),
        ],
      ),
    );
  }
}