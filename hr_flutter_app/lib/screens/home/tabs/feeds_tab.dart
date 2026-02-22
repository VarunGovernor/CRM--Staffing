import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../models/notification_item.dart';
import '../../../services/notification_service.dart';
import '../../../widgets/app_colors.dart';

class FeedsTab extends StatefulWidget {
  const FeedsTab({super.key});

  @override
  State<FeedsTab> createState() => _FeedsTabState();
}

class _FeedsTabState extends State<FeedsTab> {
  final _notificationService = NotificationService();
  List<NotificationItem> _notifications = [];
  bool _loading = true;
  int _selectedFilter = 0;

  static const _filters = ['All', 'Status', 'Announcements', 'Approvals'];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final data = await _notificationService.getNotifications(userId);
      setState(() => _notifications = data);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filter chips
        SizedBox(
          height: 52,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _filters.length,
            itemBuilder: (context, i) {
              final selected = _selectedFilter == i;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _selectedFilter = i),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: selected ? Colors.black : Colors.transparent,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: selected ? Colors.black : Colors.grey.shade300),
                    ),
                    child: Text(
                      _filters[i],
                      style: TextStyle(
                        color: selected ? Colors.white : AppColors.textGray,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _notifications.isEmpty
                  ? _EmptyFeeds()
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _notifications.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (_, i) => _NotificationCard(_notifications[i]),
                    ),
        ),
      ],
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final NotificationItem item;
  const _NotificationCard(this.item);

  @override
  Widget build(BuildContext context) {
    final timeStr = _formatTime(item.createdAt);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.green,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.access_time, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(timeStr, style: const TextStyle(color: AppColors.textGray, fontSize: 12)),
                const SizedBox(height: 4),
                Text(item.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(item.message,
                    style: const TextStyle(color: AppColors.textGray, fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) {
      return 'Today ${DateFormat('hh:mm a').format(dt)}';
    } else if (diff.inDays == 1) {
      return 'Yesterday ${DateFormat('hh:mm a').format(dt)}';
    }
    return DateFormat('dd MMM yyyy hh:mm a').format(dt);
  }
}

class _EmptyFeeds extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none, size: 64, color: AppColors.textGray),
          SizedBox(height: 12),
          Text('No feeds yet', style: TextStyle(color: AppColors.textGray, fontSize: 16)),
        ],
      ),
    );
  }
}
