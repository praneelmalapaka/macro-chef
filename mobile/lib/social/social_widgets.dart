part of '../main.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
        boxShadow: cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 17,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            style: const TextStyle(
              color: AppColors.muted,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line),
        boxShadow: cardShadow,
      ),
      child: Column(
        children: [
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.field,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                skeletonLine(width: double.infinity),
                const SizedBox(height: 8),
                skeletonLine(width: 88),
                const SizedBox(height: 10),
                skeletonLine(width: double.infinity),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Widget skeletonLine({required double width}) {
  return Align(
    alignment: Alignment.centerLeft,
    child: Container(
      width: width,
      height: 12,
      decoration: BoxDecoration(
        color: AppColors.field,
        borderRadius: BorderRadius.circular(99),
      ),
    ),
  );
}

const cardShadow = [
  BoxShadow(
    color: Color(0x0F000000),
    blurRadius: 20,
    offset: Offset(0, 2),
  ),
];

const cardShadowLg = [
  BoxShadow(
    color: Color(0x1F000000),
    blurRadius: 48,
    offset: Offset(0, 8),
  ),
];