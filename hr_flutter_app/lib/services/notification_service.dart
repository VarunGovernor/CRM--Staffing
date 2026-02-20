import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/notification_item.dart';

class NotificationService {
  final _client = Supabase.instance.client;

  Future<List<NotificationItem>> getNotifications(String userId) async {
    final response = await _client
        .from('notifications')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(50);
    return (response as List).map((e) => NotificationItem.fromJson(e)).toList();
  }

  Future<int> getUnreadCount(String userId) async {
    final response = await _client
        .from('notifications')
        .select()
        .eq('user_id', userId)
        .eq('is_read', false);
    return (response as List).length;
  }

  Future<void> markAllRead(String userId) async {
    await _client
        .from('notifications')
        .update({'is_read': true})
        .eq('user_id', userId);
  }
}
