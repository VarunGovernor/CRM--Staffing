import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'app_colors.dart';

class WeekNavigator extends StatelessWidget {
  final DateTime weekStart;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  const WeekNavigator({
    super.key,
    required this.weekStart,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final weekEnd = weekStart.add(const Duration(days: 6));
    final fmt = DateFormat('dd-MMM-yyyy');
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
          top: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: AppColors.textDark),
            onPressed: onPrev,
          ),
          Text(
            '${fmt.format(weekStart)} - ${fmt.format(weekEnd)}',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: AppColors.textDark),
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}
