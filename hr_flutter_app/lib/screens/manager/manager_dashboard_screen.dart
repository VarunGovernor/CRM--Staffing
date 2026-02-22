import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../widgets/app_colors.dart';

class ManagerDashboardScreen extends StatefulWidget {
  const ManagerDashboardScreen({super.key});

  @override
  State<ManagerDashboardScreen> createState() => _ManagerDashboardScreenState();
}

class _ManagerDashboardScreenState extends State<ManagerDashboardScreen> {
  final _client = Supabase.instance.client;
  List<Map<String, dynamic>> _teamMembers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      // Get all team members who report to this manager
      final profiles = await _client
          .from('user_profiles')
          .select('id, full_name, avatar_url, department, job_title')
          .eq('reports_to', userId)
          .eq('is_active', true);

      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final List<Map<String, dynamic>> team = [];

      for (final p in (profiles as List)) {
        final memberId = p['id'] as String;

        // Get today's clock entry
        final clockData = await _client
            .from('clock_entries')
            .select()
            .eq('user_id', memberId)
            .gte('clock_in', '${today}T00:00:00')
            .lte('clock_in', '${today}T23:59:59')
            .order('clock_in', ascending: false)
            .limit(1)
            .maybeSingle();

        // Get active leave for today
        final leaveData = await _client
            .from('leave_requests')
            .select('status, leave_types(name)')
            .eq('user_id', memberId)
            .eq('status', 'approved')
            .lte('start_date', today)
            .gte('end_date', today)
            .maybeSingle();

        team.add({
          'profile': p,
          'clock': clockData,
          'leave': leaveData,
        });
      }

      setState(() => _teamMembers = team);
    } catch (e) {
      debugPrint('Manager dashboard error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  int get _clockedInCount =>
      _teamMembers.where((m) => m['clock'] != null && m['clock']['clock_out'] == null).length;

  int get _onLeaveCount =>
      _teamMembers.where((m) => m['leave'] != null).length;

  int get _absentCount =>
      _teamMembers.where((m) => m['clock'] == null && m['leave'] == null).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Team Dashboard',
          style: TextStyle(
              color: AppColors.textDark,
              fontWeight: FontWeight.bold,
              fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textDark),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSummaryRow(),
                  const SizedBox(height: 20),
                  Text(
                    'Team Members (${_teamMembers.length})',
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark),
                  ),
                  const SizedBox(height: 12),
                  if (_teamMembers.isEmpty)
                    _buildEmptyState()
                  else
                    ..._teamMembers.map(_buildMemberCard),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryRow() {
    return Row(
      children: [
        _buildStatCard('Clocked In', _clockedInCount, AppColors.green,
            Icons.login_rounded),
        const SizedBox(width: 12),
        _buildStatCard(
            'On Leave', _onLeaveCount, AppColors.orange, Icons.beach_access),
        const SizedBox(width: 12),
        _buildStatCard('Absent', _absentCount, AppColors.primary,
            Icons.person_off_outlined),
      ],
    );
  }

  Widget _buildStatCard(String label, int count, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 6),
            Text(
              '$count',
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold, color: color),
            ),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textGray),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildMemberCard(Map<String, dynamic> member) {
    final profile = member['profile'] as Map<String, dynamic>;
    final clock = member['clock'] as Map<String, dynamic>?;
    final leave = member['leave'] as Map<String, dynamic>?;

    final name = profile['full_name'] as String? ?? 'Unknown';
    final title = profile['job_title'] as String? ?? profile['department'] as String? ?? '';
    final initials = name.split(' ').take(2).map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();

    String statusText;
    Color statusColor;
    IconData statusIcon;
    bool isRemote = false;

    if (leave != null) {
      final leaveType = (leave['leave_types'] as Map?)?['name'] ?? 'Leave';
      statusText = 'On $leaveType';
      statusColor = AppColors.orange;
      statusIcon = Icons.beach_access;
    } else if (clock != null) {
      if (clock['clock_out'] == null) {
        // Currently clocked in
        isRemote = clock['is_remote'] == true;
        final clockIn = DateTime.parse(clock['clock_in'] as String).toLocal();
        statusText = 'In since ${DateFormat('HH:mm').format(clockIn)}';
        statusColor = AppColors.green;
        statusIcon = isRemote ? Icons.home_work_outlined : Icons.login_rounded;
      } else {
        final duration = clock['duration_minutes'] as int? ?? 0;
        final h = duration ~/ 60;
        final m = duration % 60;
        statusText = 'Clocked out • ${h}h ${m}m';
        statusColor = AppColors.blue;
        statusIcon = Icons.logout_rounded;
      }
    } else {
      statusText = 'Not checked in';
      statusColor = AppColors.primary;
      statusIcon = Icons.person_off_outlined;
    }

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
          CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.blue.withValues(alpha: 0.15),
            backgroundImage: profile['avatar_url'] != null
                ? NetworkImage(profile['avatar_url'] as String)
                : null,
            child: profile['avatar_url'] == null
                ? Text(initials,
                    style: const TextStyle(
                        color: AppColors.blue,
                        fontWeight: FontWeight.bold,
                        fontSize: 14))
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.textDark)),
                if (title.isNotEmpty)
                  Text(title,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textGray)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  Icon(statusIcon, color: statusColor, size: 14),
                  const SizedBox(width: 4),
                  Text(statusText,
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ],
              ),
              if (isRemote)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.orange.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('Remote',
                      style: TextStyle(
                          color: AppColors.orange,
                          fontSize: 10,
                          fontWeight: FontWeight.w600)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(Icons.group_outlined,
                size: 56, color: AppColors.textGray.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            const Text(
              'No team members report to you yet.',
              style: TextStyle(color: AppColors.textGray, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
