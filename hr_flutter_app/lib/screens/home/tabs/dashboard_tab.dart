import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../models/leave_balance.dart';
import '../../../services/leave_service.dart';
import '../../../widgets/app_colors.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final _leaveService = LeaveService();
  List<LeaveBalance> _balances = [];
  bool _loading = true;

  static const _holidays = [
    {'name': 'Holi (India)', 'date': 'Wed, Mar 04 2026', 'color': Color(0xFFF59E0B)},
    {'name': 'Ramzan (India)', 'date': 'Fri, Mar 20 2026', 'color': Color(0xFFEF4444)},
    {'name': 'Good Friday (India)', 'date': 'Fri, Apr 03 2026', 'color': Color(0xFFEC4899)},
  ];

  @override
  void initState() {
    super.initState();
    _loadBalances();
  }

  Future<void> _loadBalances() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final data = await _leaveService.getBalances(userId, DateTime.now().year);
      setState(() => _balances = data);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _LeaveReportCard(balances: _balances, loading: _loading),
          const SizedBox(height: 16),
          _UpcomingHolidaysCard(holidays: _holidays),
        ],
      ),
    );
  }
}

class _LeaveReportCard extends StatelessWidget {
  final List<LeaveBalance> balances;
  final bool loading;
  const _LeaveReportCard({required this.balances, required this.loading});

  static const _abbrevColors = [
    Color(0xFFF59E0B),
    Color(0xFFEF4444),
    Color(0xFFEC4899),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Leave Report',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(color: AppColors.green, shape: BoxShape.circle),
                child: const Icon(Icons.add, color: Colors.white, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (loading)
            const CircularProgressIndicator()
          else if (balances.isEmpty)
            const Text('No leave data', style: TextStyle(color: AppColors.textGray))
          else
            ...balances.asMap().entries.map((e) {
              final b = e.value;
              final color = _abbrevColors[e.key % _abbrevColors.length];
              final code = b.leaveType?.code ?? b.leaveTypeId.substring(0, 2).toUpperCase();
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(code,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b.leaveType?.name ?? 'Leave',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          Text(
                            'Taken: ${b.booked} | Balance: ${b.balance} Days',
                            style: const TextStyle(color: AppColors.textGray, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _UpcomingHolidaysCard extends StatelessWidget {
  final List<Map<String, dynamic>> holidays;
  const _UpcomingHolidaysCard({required this.holidays});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Upcoming Holidays',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ...holidays.map((h) {
            final color = h['color'] as Color;
            final name = h['name'] as String;
            final initials = name.trim().split(' ').take(2).map((w) => w[0]).join();
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Text(initials,
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      Text(h['date'] as String,
                          style: const TextStyle(color: AppColors.textGray, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
