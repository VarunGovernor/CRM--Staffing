import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../models/leave_balance.dart';
import '../../../services/leave_service.dart';
import '../../../widgets/app_colors.dart';

class LeaveBalanceTab extends StatefulWidget {
  const LeaveBalanceTab({super.key});

  @override
  State<LeaveBalanceTab> createState() => _LeaveBalanceTabState();
}

class _LeaveBalanceTabState extends State<LeaveBalanceTab> {
  final _service = LeaveService();
  List<LeaveBalance> _balances = [];
  bool _loading = true;

  static const _iconColors = [
    Color(0xFF22C55E),
    Color(0xFF3B82F6),
    Color(0xFFEF4444),
  ];
  static const _bgColors = [
    Color(0xFFDCFCE7),
    Color(0xFFDBEAFE),
    Color(0xFFFEE2E2),
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final data = await _service.getBalances(userId, DateTime.now().year);
      setState(() => _balances = data);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_balances.isEmpty) {
      return const Center(
          child: Text('No leave balances', style: TextStyle(color: AppColors.textGray)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _balances.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final b = _balances[i];
        final idx = i % 3;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _bgColors[idx],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.beach_access, color: _iconColors[idx], size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  b.leaveType?.name ?? 'Leave',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  RichText(
                    text: TextSpan(
                      children: [
                        const TextSpan(
                            text: 'Available : ',
                            style: TextStyle(color: AppColors.textGray, fontSize: 13)),
                        TextSpan(
                            text: '${b.balance}',
                            style: const TextStyle(
                                color: AppColors.green,
                                fontWeight: FontWeight.bold,
                                fontSize: 13)),
                      ],
                    ),
                  ),
                  RichText(
                    text: TextSpan(
                      children: [
                        const TextSpan(
                            text: 'Booked : ',
                            style: TextStyle(color: AppColors.textGray, fontSize: 13)),
                        TextSpan(
                            text: '${b.booked}',
                            style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
