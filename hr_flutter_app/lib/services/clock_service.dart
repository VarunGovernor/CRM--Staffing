import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/clock_entry.dart';

class ClockService {
  final _client = Supabase.instance.client;

  Future<ClockEntry?> getActiveEntry(String userId) async {
    final response = await _client
        .from('clock_entries')
        .select()
        .eq('user_id', userId)
        .isFilter('clock_out', null)
        .order('clock_in', ascending: false)
        .limit(1)
        .maybeSingle();
    if (response == null) return null;
    return ClockEntry.fromJson(response);
  }

  Future<ClockEntry> clockIn(String userId) async {
    final response = await _client
        .from('clock_entries')
        .insert({'user_id': userId, 'clock_in': DateTime.now().toUtc().toIso8601String()})
        .select()
        .single();
    return ClockEntry.fromJson(response);
  }

  Future<ClockEntry> clockOut(String entryId, DateTime clockIn) async {
    final now = DateTime.now().toUtc();
    final durationMinutes = now.difference(clockIn.toUtc()).inMinutes;
    final response = await _client
        .from('clock_entries')
        .update({
          'clock_out': now.toIso8601String(),
          'duration_minutes': durationMinutes,
        })
        .eq('id', entryId)
        .select()
        .single();
    return ClockEntry.fromJson(response);
  }

  Future<List<ClockEntry>> getHistory(String userId, DateTime start, DateTime end) async {
    final response = await _client
        .from('clock_entries')
        .select()
        .eq('user_id', userId)
        .gte('clock_in', start.toIso8601String())
        .lte('clock_in', end.toIso8601String())
        .order('clock_in', ascending: false);
    return (response as List).map((e) => ClockEntry.fromJson(e)).toList();
  }
}
