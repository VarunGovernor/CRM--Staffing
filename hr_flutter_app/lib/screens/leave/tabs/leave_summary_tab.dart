import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../models/leave_balance.dart';
import '../../../services/leave_service.dart';
import '../../../widgets/app_colors.dart';

class LeaveSummaryTab extends StatefulWidget {
  const LeaveSummaryTab({super.key});

  @override
  State<LeaveSummaryTab> createState() => _LeaveSummaryTabState();
}

class _LeaveSummaryTabState extends State<LeaveSummaryTab> {
  final _service = LeaveService();
  int _year = DateTime.now().year;
  List<LeaveBalance> _balances = [];
  List<Map<String, dynamic>> _absentDates = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    setState(() => _loading = true);
    try {
      final balances = await _service.getBalances(userId, _year);
      final absent = await _service.getAbsentDates(userId);
      setState(() {
        _balances = balances;
        _absentDates = absent;
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Year navigator
        Container(
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
          ),
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () => setState(() {
                  _year--;
                  _loadData();
                }),
              ),
              Text(
                '01-Jan-$_year to 31-Dec-$_year',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () => setState(() {
                  _year++;
                  _loadData();
                }),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Leave balance chips (horizontal scroll)
                      if (_balances.isNotEmpty)
                        SizedBox(
                          height: 110,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _balances.length,
                            separatorBuilder: (_, _) => const SizedBox(width: 12),
                            itemBuilder: (_, i) => _LeaveBalanceChip(_balances[i]),
                          ),
                        ),
                      if (_balances.isNotEmpty) const SizedBox(height: 16),
                      // Absent records
                      ..._absentDates.map((d) {
                        final date = DateTime.parse(d['date']);
                        final fmt = DateFormat('dd-MMM-yyyy').format(date);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)
                              ],
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Text('Absent - ',
                                              style: TextStyle(fontWeight: FontWeight.bold)),
                                          const Text('1 Day(s)'),
                                          const SizedBox(width: 4),
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: Colors.red,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(fmt,
                                          style: const TextStyle(color: AppColors.textGray)),
                                    ],
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.blue,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(24)),
                                    elevation: 0,
                                  ),
                                  child: const Text('Convert Leave'),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                      if (_absentDates.isEmpty && _balances.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 60),
                          child: Text('No data for this year',
                              style: TextStyle(color: AppColors.textGray)),
                        ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

class _LeaveBalanceChip extends StatelessWidget {
  final LeaveBalance balance;
  static const _iconColors = [Color(0xFF22C55E), Color(0xFF3B82F6), Color(0xFFEF4444)];
  static const _bgColors = [Color(0xFFDCFCE7), Color(0xFFDBEAFE), Color(0xFFFEE2E2)];

  const _LeaveBalanceChip(this.balance);

  @override
  Widget build(BuildContext context) {
    final idx = balance.hashCode % 3;
    return Container(
      width: 140,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: _bgColors[idx],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.beach_access, color: _iconColors[idx], size: 16),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  balance.leaveType?.name ?? 'Leave',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${balance.balance}',
                      style: const TextStyle(
                          color: AppColors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                  const Text('Balance', style: TextStyle(color: AppColors.textGray, fontSize: 11)),
                ],
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${balance.booked}',
                      style: const TextStyle(
                          color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
                  const Text('Booked', style: TextStyle(color: AppColors.textGray, fontSize: 11)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
