import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../services/timesheet_service.dart';
import '../../widgets/app_colors.dart';
import '../../widgets/app_header.dart';
import '../../widgets/week_navigator.dart';

class TimeScreen extends StatefulWidget {
  const TimeScreen({super.key});

  @override
  State<TimeScreen> createState() => _TimeScreenState();
}

class _TimeScreenState extends State<TimeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _service = TimesheetService();
  DateTime _weekStart = _getWeekStart(DateTime.now());
  List<Map<String, dynamic>> _timeLogs = [];
  bool _loading = true;
  int _totalMinutes = 0;

  static DateTime _getWeekStart(DateTime date) {
    return date.subtract(Duration(days: date.weekday % 7));
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() => setState(() {}));
    _loadTimeLogs();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTimeLogs() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    setState(() => _loading = true);
    try {
      final logs = await _service.getTimeLogs(userId, _weekStart);
      int total = 0;
      for (final l in logs) {
        total += (l['duration_minutes'] as int? ?? 0);
      }
      setState(() {
        _timeLogs = logs;
        _totalMinutes = total;
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  String _formatHrs(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} Hrs';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            AppHeader(
              title: 'Time Tracker',
              profile: auth.profile,
              showSearch: false,
              showNotification: false,
              actions: [
                IconButton(
                  icon: const Icon(Icons.filter_list, color: AppColors.textDark),
                  onPressed: () {},
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.blue,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 8),
              ],
            ),
            TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textGray,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              indicator: const UnderlineTabIndicator(
                borderSide: BorderSide(color: AppColors.primary, width: 2.5),
              ),
              tabs: const [
                Tab(text: 'Time Logs'),
                Tab(text: 'Timesheets'),
                Tab(text: 'Jobs'),
                Tab(text: 'Projects'),
              ],
            ),
            WeekNavigator(
              weekStart: _weekStart,
              onPrev: () {
                setState(() => _weekStart = _weekStart.subtract(const Duration(days: 7)));
                _loadTimeLogs();
              },
              onNext: () {
                setState(() => _weekStart = _weekStart.add(const Duration(days: 7)));
                _loadTimeLogs();
              },
            ),
            Expanded(
              child: _tabController.index == 0
                  ? _TimeLogsView(
                      logs: _timeLogs,
                      loading: _loading,
                    )
                  : Center(
                      child: Text(
                        ['Time Logs', 'Timesheets', 'Jobs', 'Projects'][_tabController.index],
                        style: const TextStyle(color: AppColors.textGray, fontSize: 16),
                      ),
                    ),
            ),
            // Bottom bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, -2))],
              ),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Total', style: TextStyle(color: AppColors.blue, fontWeight: FontWeight.bold, fontSize: 12)),
                      Text(_formatHrs(_totalMinutes), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(width: 24),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Submitted', style: TextStyle(color: AppColors.orange, fontWeight: FontWeight.bold, fontSize: 12)),
                      const Text('00:00 Hrs', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Submit', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text(_formatHrs(_totalMinutes),
                            style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimeLogsView extends StatelessWidget {
  final List<Map<String, dynamic>> logs;
  final bool loading;
  const _TimeLogsView({required this.logs, required this.loading});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (logs.isEmpty) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.description_outlined, size: 48, color: AppColors.textGray),
          ),
          const SizedBox(height: 16),
          const Text('No time logs found',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: logs.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _TimeLogCard(logs[i]),
    );
  }
}

class _TimeLogCard extends StatelessWidget {
  final Map<String, dynamic> log;
  const _TimeLogCard(this.log);

  @override
  Widget build(BuildContext context) {
    final clockIn = log['clock_in'] != null ? DateTime.parse(log['clock_in']).toLocal() : null;
    final clockOut = log['clock_out'] != null ? DateTime.parse(log['clock_out']).toLocal() : null;
    final duration = log['duration_minutes'] as int? ?? 0;
    final h = duration ~/ 60;
    final m = duration % 60;
    final timeFmt = DateFormat('hh:mm a');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (clockIn != null)
                  Text(
                    '${timeFmt.format(clockIn)} → ${clockOut != null ? timeFmt.format(clockOut) : "Active"}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                if (clockIn != null)
                  Text(
                    DateFormat('dd MMM yyyy').format(clockIn),
                    style: const TextStyle(color: AppColors.textGray, fontSize: 13),
                  ),
              ],
            ),
          ),
          Text(
            '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} Hrs',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
        ],
      ),
    );
  }
}
