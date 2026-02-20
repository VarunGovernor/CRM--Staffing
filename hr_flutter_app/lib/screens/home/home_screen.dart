import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../providers/auth_provider.dart';
import '../../providers/clock_provider.dart';
import '../../models/leave_balance.dart';
import '../../services/leave_service.dart';
import '../../widgets/app_colors.dart';
import '../../widgets/app_header.dart';
import '../../widgets/segment_selector.dart';
import 'tabs/activities_tab.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/feeds_tab.dart';
import 'tabs/profile_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  int _segmentIndex = 0;
  late TabController _tabController;

  final _tabs = ['Activities', 'Dashboard', 'Feeds', 'Profile', 'Approvals', 'Leave', 'Attendance', 'Time Logs'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
              title: 'Home',
              profile: auth.profile,
              notificationCount: 52,
            ),
            SegmentSelector(
              options: const ['My Space', 'Team', 'Organization'],
              selected: _segmentIndex,
              onChanged: (i) => setState(() => _segmentIndex = i),
            ),
            if (_segmentIndex == 0) ...[
              TabBar(
                controller: _tabController,
                isScrollable: true,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textGray,
                labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                unselectedLabelStyle: const TextStyle(fontSize: 14),
                indicator: const UnderlineTabIndicator(
                  borderSide: BorderSide(color: AppColors.primary, width: 2.5),
                ),
                tabAlignment: TabAlignment.start,
                tabs: _tabs.map((t) => Tab(text: t)).toList(),
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: const [
                    ActivitiesTab(),
                    DashboardTab(),
                    FeedsTab(),
                    ProfileTab(),
                    _ApprovalsTab(),
                    _HomeLeaveTab(),
                    _HomeAttendanceTab(),
                    _HomeTimeLogsTab(),
                  ],
                ),
              ),
            ] else if (_segmentIndex == 1)
              const Expanded(child: _TeamView())
            else
              const Expanded(child: _OrganizationView()),
          ],
        ),
      ),
    );
  }
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────

class _ApprovalsTab extends StatefulWidget {
  const _ApprovalsTab();

  @override
  State<_ApprovalsTab> createState() => _ApprovalsTabState();
}

class _ApprovalsTabState extends State<_ApprovalsTab> {
  List<Map<String, dynamic>> _requests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await Supabase.instance.client
          .from('leave_requests')
          .select('*, leave_types(*), profiles!user_id(full_name, role)')
          .eq('status', 'pending')
          .order('created_at', ascending: false)
          .limit(20);
      setState(() => _requests = (response as List).cast<Map<String, dynamic>>());
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_requests.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline, color: AppColors.green, size: 40),
            ),
            const SizedBox(height: 16),
            const Text('No Pending Approvals',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            const Text('All leave requests have been reviewed',
                style: TextStyle(color: AppColors.textGray, fontSize: 14)),
          ],
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _requests.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final r = _requests[i];
        final name = (r['profiles'] as Map?)?['full_name'] ?? 'Employee';
        final leaveType = (r['leave_types'] as Map?)?['name'] ?? 'Leave';
        final start = r['start_date'] ?? '';
        final end = r['end_date'] ?? '';
        final days = r['days'] ?? 0;
        final initials = (name as String)
            .trim()
            .split(' ')
            .take(2)
            .map((w) => w[0])
            .join()
            .toUpperCase();
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primary,
                    child: Text(initials,
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        Text(leaveType,
                            style: const TextStyle(color: AppColors.textGray, fontSize: 12)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF9C4),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('$days Day${days == 1 ? '' : 's'}',
                        style: const TextStyle(
                            color: Color(0xFFB45309),
                            fontWeight: FontWeight.w600,
                            fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text('$start → $end',
                  style: const TextStyle(color: AppColors.textGray, fontSize: 13)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24)),
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.green,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24)),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text('Approve'),
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

// ─── Home Leave Tab ───────────────────────────────────────────────────────────

class _HomeLeaveTab extends StatefulWidget {
  const _HomeLeaveTab();

  @override
  State<_HomeLeaveTab> createState() => _HomeLeaveTabState();
}

class _HomeLeaveTabState extends State<_HomeLeaveTab> {
  final _service = LeaveService();
  List<LeaveBalance> _balances = [];
  bool _loading = true;

  static const _fallback = [
    {'name': 'Earned Leave', 'code': 'EL', 'color': Color(0xFF22C55E), 'bg': Color(0xFFDCFCE7)},
    {'name': 'Compensatory Off', 'code': 'CO', 'color': Color(0xFF3B82F6), 'bg': Color(0xFFDBEAFE)},
    {'name': 'Leave Without Pay', 'code': 'LWP', 'color': Color(0xFFEF4444), 'bg': Color(0xFFFEE2E2)},
  ];

  static const _colors = [
    [Color(0xFF22C55E), Color(0xFFDCFCE7)],
    [Color(0xFF3B82F6), Color(0xFFDBEAFE)],
    [Color(0xFFEF4444), Color(0xFFFEE2E2)],
    [Color(0xFFF59E0B), Color(0xFFFEF3C7)],
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final data = await _service.getBalances(userId, DateTime.now().year);
      setState(() => _balances = data);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Leave Balance',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          if (_balances.isNotEmpty)
            ..._balances.asMap().entries.map((e) {
              final pair = _colors[e.key % _colors.length];
              final code = e.value.leaveType?.code ??
                  e.value.leaveTypeId.substring(0, 2).toUpperCase();
              return _LeaveBalanceCard(
                name: e.value.leaveType?.name ?? 'Leave',
                code: code,
                balance: e.value.balance,
                booked: e.value.booked,
                color: pair[0],
                bg: pair[1],
              );
            })
          else
            ..._fallback.map((l) => _LeaveBalanceCard(
                  name: l['name'] as String,
                  code: l['code'] as String,
                  balance: 0,
                  booked: 0,
                  color: l['color'] as Color,
                  bg: l['bg'] as Color,
                )),
        ],
      ),
    );
  }
}

class _LeaveBalanceCard extends StatelessWidget {
  final String name;
  final String code;
  final double balance;
  final double booked;
  final Color color;
  final Color bg;

  const _LeaveBalanceCard({
    required this.name,
    required this.code,
    required this.balance,
    required this.booked,
    required this.color,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
            alignment: Alignment.center,
            child: Text(code,
                style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
          const SizedBox(width: 12),
          Expanded(
              child: Text(name,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              RichText(
                text: TextSpan(children: [
                  const TextSpan(
                      text: 'Balance: ',
                      style: TextStyle(color: AppColors.textGray, fontSize: 13)),
                  TextSpan(
                      text: '$balance',
                      style: const TextStyle(
                          color: AppColors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 13)),
                ]),
              ),
              RichText(
                text: TextSpan(children: [
                  const TextSpan(
                      text: 'Booked: ',
                      style: TextStyle(color: AppColors.textGray, fontSize: 13)),
                  TextSpan(
                      text: '$booked',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13)),
                ]),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Home Attendance Tab ──────────────────────────────────────────────────────

class _HomeAttendanceTab extends StatelessWidget {
  const _HomeAttendanceTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Consumer<ClockProvider>(
        builder: (context, clock, _) {
          return Column(
            children: [
              // Clock In/Out card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: clock.isClockedIn
                                ? const Color(0xFFDCFCE7)
                                : const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.fingerprint,
                              color: clock.isClockedIn
                                  ? AppColors.green
                                  : AppColors.primary,
                              size: 26),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                clock.isClockedIn
                                    ? 'Currently Checked In'
                                    : 'Not Checked In',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: clock.isClockedIn
                                      ? AppColors.green
                                      : AppColors.primary,
                                ),
                              ),
                              Text(
                                clock.isClockedIn
                                    ? 'Duration: ${clock.elapsedFormatted}'
                                    : 'Tap button to check in',
                                style: const TextStyle(
                                    color: AppColors.textGray, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: clock.loading
                            ? null
                            : () {
                                final userId = Supabase
                                    .instance.client.auth.currentUser?.id;
                                if (userId == null) return;
                                if (clock.isClockedIn) {
                                  clock.clockOut();
                                } else {
                                  clock.clockIn(userId);
                                }
                              },
                        icon: clock.loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2),
                              )
                            : Icon(clock.isClockedIn
                                ? Icons.logout
                                : Icons.login),
                        label: Text(
                            clock.isClockedIn ? 'Check Out' : 'Check In'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: clock.isClockedIn
                              ? AppColors.primary
                              : AppColors.green,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Today summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Today's Summary",
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    _SummaryRow(
                      icon: Icons.login,
                      label: 'Check In',
                      value: clock.activeEntry != null
                          ? TimeOfDay.fromDateTime(clock.activeEntry!.clockIn)
                              .format(context)
                          : '--:--',
                      color: AppColors.green,
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      icon: Icons.logout,
                      label: 'Check Out',
                      value: '--:--',
                      color: AppColors.primary,
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      icon: Icons.hourglass_bottom,
                      label: 'Hours Worked',
                      value: clock.isClockedIn
                          ? clock.elapsedFormatted
                          : '00:00:00',
                      color: AppColors.blue,
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _SummaryRow(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.textGray, fontSize: 14))),
        Text(value,
            style: const TextStyle(
                fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}

// ─── Home Time Logs Tab ───────────────────────────────────────────────────────

class _HomeTimeLogsTab extends StatefulWidget {
  const _HomeTimeLogsTab();

  @override
  State<_HomeTimeLogsTab> createState() => _HomeTimeLogsTabState();
}

class _HomeTimeLogsTabState extends State<_HomeTimeLogsTab> {
  List<Map<String, dynamic>> _logs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final now = DateTime.now();
      final weekStart = now.subtract(Duration(days: now.weekday % 7));
      final response = await Supabase.instance.client
          .from('clock_entries')
          .select('clock_in, clock_out, hours_worked')
          .eq('user_id', userId)
          .gte('clock_in', weekStart.toIso8601String())
          .order('clock_in', ascending: false);
      setState(() => _logs = (response as List).cast<Map<String, dynamic>>());
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final totalMinutes =
        _logs.fold<int>(0, (sum, l) => sum + ((l['hours_worked'] ?? 0) as int));
    final totalHours = totalMinutes / 60.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Weekly summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDBEAFE),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.timer, color: AppColors.blue, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('This Week',
                          style: TextStyle(
                              color: AppColors.textGray, fontSize: 13)),
                      Text('${totalHours.toStringAsFixed(1)} Hours',
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
                  ),
                ),
                Text('${_logs.length} Session${_logs.length == 1 ? '' : 's'}',
                    style: const TextStyle(
                        color: AppColors.textGray, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_logs.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text('No time logs this week',
                    style: TextStyle(color: AppColors.textGray)),
              ),
            )
          else
            ..._logs.map((l) {
              final clockIn = DateTime.parse(l['clock_in'] as String);
              final clockOut = l['clock_out'] != null
                  ? DateTime.parse(l['clock_out'] as String)
                  : null;
              final mins = (l['hours_worked'] ?? 0) as int;
              final hrs = mins / 60.0;
              final dayNames = [
                '',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sun'
              ];
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('${clockIn.day}',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(dayNames[clockIn.weekday],
                              style: const TextStyle(
                                  fontSize: 10, color: AppColors.textGray)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${TimeOfDay.fromDateTime(clockIn).format(context)} → ${clockOut != null ? TimeOfDay.fromDateTime(clockOut).format(context) : 'Active'}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          Text('${hrs.toStringAsFixed(1)} hrs',
                              style: const TextStyle(
                                  color: AppColors.textGray, fontSize: 13)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: clockOut != null
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFFFF0F0),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        clockOut != null ? 'Done' : 'Active',
                        style: TextStyle(
                          color: clockOut != null
                              ? AppColors.green
                              : AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
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

// ─── Team View ────────────────────────────────────────────────────────────────

class _TeamView extends StatefulWidget {
  const _TeamView();

  @override
  State<_TeamView> createState() => _TeamViewState();
}

class _TeamViewState extends State<_TeamView> {
  List<Map<String, dynamic>> _members = [];
  bool _loading = true;

  static const _avatarColors = [
    AppColors.primary,
    AppColors.blue,
    AppColors.green,
    AppColors.orange,
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await Supabase.instance.client
          .from('profiles')
          .select('id, full_name, role, is_active')
          .eq('is_active', true)
          .order('full_name');
      setState(
          () => _members = (response as List).cast<Map<String, dynamic>>());
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_members.isEmpty) {
      return const Center(
        child: Text('No team members found',
            style: TextStyle(color: AppColors.textGray)),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text('${_members.length} Members',
              style: const TextStyle(
                  color: AppColors.textGray, fontSize: 13)),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            itemCount: _members.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final m = _members[i];
              final name = (m['full_name'] ?? 'Unknown') as String;
              final role = (m['role'] ?? 'employee') as String;
              final initials = name
                  .trim()
                  .split(' ')
                  .take(2)
                  .map((w) => w[0])
                  .join()
                  .toUpperCase();
              final color = _avatarColors[i % _avatarColors.length];
              final roleLabel =
                  role[0].toUpperCase() + role.substring(1);
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 6)
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: color,
                      child: Text(initials,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 15)),
                          Text(roleLabel,
                              style: const TextStyle(
                                  color: AppColors.textGray, fontSize: 13)),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                              color: AppColors.green,
                              shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 4),
                        const Text('Active',
                            style: TextStyle(
                                color: AppColors.green,
                                fontSize: 12,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ─── Organization View ────────────────────────────────────────────────────────

class _OrganizationView extends StatelessWidget {
  const _OrganizationView();

  static const _departments = [
    {
      'name': 'Engineering',
      'icon': Icons.code,
      'color': Color(0xFF3B82F6),
      'bg': Color(0xFFDBEAFE),
      'count': '12 Members'
    },
    {
      'name': 'Human Resources',
      'icon': Icons.people,
      'color': Color(0xFF22C55E),
      'bg': Color(0xFFDCFCE7),
      'count': '5 Members'
    },
    {
      'name': 'Finance',
      'icon': Icons.account_balance,
      'color': Color(0xFFF59E0B),
      'bg': Color(0xFFFEF3C7),
      'count': '4 Members'
    },
    {
      'name': 'Sales & Marketing',
      'icon': Icons.trending_up,
      'color': Color(0xFFEF4444),
      'bg': Color(0xFFFEE2E2),
      'count': '8 Members'
    },
    {
      'name': 'Operations',
      'icon': Icons.settings,
      'color': Color(0xFF8B5CF6),
      'bg': Color(0xFFF3E8FF),
      'count': '6 Members'
    },
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Departments',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ..._departments.map((dept) {
            final color = dept['color'] as Color;
            final bg = dept['bg'] as Color;
            final icon = dept['icon'] as IconData;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(12)),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(dept['name'] as String,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 15)),
                  ),
                  Text(dept['count'] as String,
                      style: const TextStyle(
                          color: AppColors.textGray, fontSize: 13)),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right,
                      color: AppColors.textGray),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
