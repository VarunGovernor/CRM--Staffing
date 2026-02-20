import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../models/user_profile.dart';
import '../models/notification_item.dart';
import '../providers/clock_provider.dart';
import '../screens/profile/profile_screen.dart';
import '../services/notification_service.dart';
import 'app_colors.dart';

class AppHeader extends StatefulWidget {
  final String title;
  final UserProfile? profile;
  final int notificationCount;
  final List<Widget>? actions;
  final bool showSearch;       // kept for backward compat — search is removed
  final bool showNotification;

  const AppHeader({
    super.key,
    required this.title,
    this.profile,
    this.notificationCount = 0,
    this.actions,
    this.showSearch = false,
    this.showNotification = true,
  });

  @override
  State<AppHeader> createState() => _AppHeaderState();
}

class _AppHeaderState extends State<AppHeader> {
  final _notifService = NotificationService();
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUnread();
  }

  Future<void> _loadUnread() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final count = await _notifService.getUnreadCount(userId);
      if (mounted) setState(() => _unreadCount = count);
    } catch (_) {}
  }

  void _openPanel() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _NotificationPanel(
        onMarkAllRead: () async {
          final userId = Supabase.instance.client.auth.currentUser?.id;
          if (userId == null) return;
          await _notifService.markAllRead(userId);
          if (mounted) setState(() => _unreadCount = 0);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          _buildAvatar(),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              widget.title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ),
          if (widget.actions != null) ...widget.actions!,
          if (widget.showNotification)
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined,
                      color: AppColors.textDark),
                  onPressed: _openPanel,
                ),
                if (_unreadCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                          color: Colors.red, shape: BoxShape.circle),
                      constraints: const BoxConstraints(
                          minWidth: 16, minHeight: 16),
                      child: Text(
                        _unreadCount > 99 ? '99+' : '$_unreadCount',
                        style: const TextStyle(
                            color: Colors.white, fontSize: 9),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    final avatar = widget.profile?.avatarUrl != null &&
            widget.profile!.avatarUrl!.isNotEmpty
        ? CircleAvatar(
            radius: 20,
            backgroundImage:
                CachedNetworkImageProvider(widget.profile!.avatarUrl!),
          )
        : CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.blue,
            child: Text(
              widget.profile?.initials ?? 'U',
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold),
            ),
          );

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ProfileScreen()),
      ),
      child: avatar,
    );
  }
}

// ─── Notification Panel ───────────────────────────────────────────────────────

class _NotificationPanel extends StatefulWidget {
  final Future<void> Function() onMarkAllRead;
  const _NotificationPanel({required this.onMarkAllRead});

  @override
  State<_NotificationPanel> createState() => _NotificationPanelState();
}

class _NotificationPanelState extends State<_NotificationPanel> {
  final _service = NotificationService();
  List<NotificationItem> _dbNotifs = [];
  List<_SmartNotif> _smartNotifs = [];
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
    // Read ClockProvider before any awaits to avoid async context gap
    final isClockedIn = context.read<ClockProvider>().isClockedIn;
    try {
      final dbNotifs = await _service.getNotifications(userId);

      final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final scheduleRow = await Supabase.instance.client
          .from('work_schedules')
          .select('start_time, end_time, shift_name')
          .eq('user_id', userId)
          .eq('date', todayStr)
          .maybeSingle();
      final now = DateTime.now();
      final smart = <_SmartNotif>[];

      if (scheduleRow != null) {
        final startStr = scheduleRow['start_time'] as String?;
        final endStr = scheduleRow['end_time'] as String?;
        final shift = scheduleRow['shift_name'] as String? ?? 'Your shift';

        if (startStr != null) {
          final shiftStart = _parseTime(now, startStr);

          // Reminder: 15 min before shift — not yet clocked in
          if (!isClockedIn &&
              now.isAfter(
                  shiftStart.subtract(const Duration(minutes: 15))) &&
              now.isBefore(shiftStart)) {
            final mins = shiftStart.difference(now).inMinutes;
            smart.add(_SmartNotif(
              icon: Icons.alarm,
              color: AppColors.orange,
              bg: const Color(0xFFFFF3CD),
              title: 'Check-in Reminder',
              message:
                  '$shift starts in $mins minute${mins == 1 ? '' : 's'}. Don\'t forget to check in!',
              time: 'In $mins min',
            ));
          }

          // Missed check-in: shift has started but not clocked in
          if (!isClockedIn &&
              now.isAfter(shiftStart) &&
              now.isBefore(shiftStart.add(const Duration(hours: 4)))) {
            final late = now.difference(shiftStart).inMinutes;
            smart.add(_SmartNotif(
              icon: Icons.warning_amber_rounded,
              color: AppColors.primary,
              bg: const Color(0xFFFEE2E2),
              title: 'Missed Check-in',
              message:
                  'You haven\'t checked in yet. $shift started $late min ago.',
              time: DateFormat('hh:mm a').format(shiftStart),
            ));
          }

          if (endStr != null) {
            final shiftEnd = _parseTime(now, endStr);

            // Check-out reminder: within 15 min window around shift end
            if (isClockedIn &&
                now.isAfter(
                    shiftEnd.subtract(const Duration(minutes: 15))) &&
                now.isBefore(
                    shiftEnd.add(const Duration(minutes: 15)))) {
              smart.add(_SmartNotif(
                icon: Icons.logout,
                color: AppColors.blue,
                bg: const Color(0xFFDBEAFE),
                title: 'Check-out Reminder',
                message:
                    '$shift ends at ${DateFormat('hh:mm a').format(shiftEnd)}. Time to check out!',
                time: DateFormat('hh:mm a').format(shiftEnd),
              ));
            }

            // Missed check-out: >15 min after shift end, still checked in
            if (isClockedIn &&
                now.isAfter(
                    shiftEnd.add(const Duration(minutes: 15)))) {
              final overdue = now.difference(shiftEnd).inMinutes;
              smart.add(_SmartNotif(
                icon: Icons.timer_off,
                color: AppColors.primary,
                bg: const Color(0xFFFEE2E2),
                title: 'Forgot to Check Out?',
                message:
                    'Your shift ended $overdue min ago but you\'re still checked in.',
                time: DateFormat('hh:mm a').format(shiftEnd),
              ));
            }
          }
        }
      } else {
        // No shift schedule — show generic reminders based on clock state
        if (!isClockedIn) {
          smart.add(_SmartNotif(
            icon: Icons.login,
            color: AppColors.orange,
            bg: const Color(0xFFFFF3CD),
            title: 'Check-in Reminder',
            message: 'Don\'t forget to check in when your shift starts.',
            time: 'Today',
          ));
        } else {
          smart.add(_SmartNotif(
            icon: Icons.logout,
            color: AppColors.blue,
            bg: const Color(0xFFDBEAFE),
            title: 'Check-out Reminder',
            message: 'Remember to check out when your shift ends.',
            time: 'Today',
          ));
        }
      }

      setState(() {
        _dbNotifs = dbNotifs;
        _smartNotifs = smart;
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  DateTime _parseTime(DateTime date, String t) {
    final parts = t.split(':');
    return DateTime(date.year, date.month, date.day,
        int.parse(parts[0]), int.parse(parts[1]));
  }

  @override
  Widget build(BuildContext context) {
    final unreadDb = _dbNotifs.where((n) => !n.isRead).length;
    final total = _smartNotifs.length + unreadDb;

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 4, 0),
              child: Row(
                children: [
                  const Text('Notifications',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 18)),
                  if (total > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('$total',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold)),
                    ),
                  ],
                  const Spacer(),
                  TextButton(
                    onPressed: () async {
                      await widget.onMarkAllRead();
                      if (mounted) setState(() => _dbNotifs = []);
                    },
                    child: const Text('Mark all read',
                        style: TextStyle(
                            color: AppColors.blue, fontSize: 13)),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView(
                      controller: scrollCtrl,
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (_smartNotifs.isNotEmpty) ...[
                          _sectionLabel("Today's Reminders"),
                          ..._smartNotifs
                              .map((n) => _SmartNotifCard(n)),
                          const SizedBox(height: 8),
                        ],
                        if (_dbNotifs.isNotEmpty) ...[
                          _sectionLabel('Recent'),
                          ..._dbNotifs.map((n) => _DbNotifCard(n)),
                        ],
                        if (_smartNotifs.isEmpty &&
                            _dbNotifs.isEmpty)
                          const Padding(
                            padding: EdgeInsets.only(top: 60),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.notifications_none,
                                      size: 52,
                                      color: AppColors.textGray),
                                  SizedBox(height: 12),
                                  Text('All caught up!',
                                      style: TextStyle(
                                          color: AppColors.textGray,
                                          fontSize: 16,
                                          fontWeight:
                                              FontWeight.w600)),
                                  SizedBox(height: 4),
                                  Text('No new notifications',
                                      style: TextStyle(
                                          color: AppColors.textGray,
                                          fontSize: 13)),
                                ],
                              ),
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

  Widget _sectionLabel(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(text,
            style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: AppColors.textGray)),
      );
}

// ─── Smart Notification ───────────────────────────────────────────────────────

class _SmartNotif {
  final IconData icon;
  final Color color;
  final Color bg;
  final String title;
  final String message;
  final String time;

  const _SmartNotif({
    required this.icon,
    required this.color,
    required this.bg,
    required this.title,
    required this.message,
    required this.time,
  });
}

class _SmartNotifCard extends StatelessWidget {
  final _SmartNotif n;
  const _SmartNotifCard(this.n);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: n.bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: n.color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: n.color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(n.icon, color: n.color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(n.title,
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: n.color)),
                const SizedBox(height: 4),
                Text(n.message,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textDark)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(n.time,
              style: const TextStyle(
                  color: AppColors.textGray, fontSize: 11)),
        ],
      ),
    );
  }
}

// ─── DB Notification Card ─────────────────────────────────────────────────────

class _DbNotifCard extends StatelessWidget {
  final NotificationItem n;
  const _DbNotifCard(this.n);

  @override
  Widget build(BuildContext context) {
    final isUnread = !n.isRead;
    final color = isUnread ? AppColors.blue : AppColors.textGray;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isUnread ? const Color(0xFFF0F7FF) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: isUnread
                ? AppColors.blue.withValues(alpha: 0.2)
                : Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              n.type == 'leave'
                  ? Icons.beach_access
                  : n.type == 'checkin'
                      ? Icons.login
                      : Icons.notifications,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(n.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text(n.message,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textGray)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(_timeAgo(n.createdAt),
              style: const TextStyle(
                  color: AppColors.textGray, fontSize: 11)),
        ],
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
