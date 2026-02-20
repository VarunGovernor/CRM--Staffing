import 'package:supabase_flutter/supabase_flutter.dart';

class TimesheetService {
  final _client = Supabase.instance.client;

  Future<List<Map<String, dynamic>>> getTimeLogs(String userId, DateTime weekStart) async {
    final weekEnd = weekStart.add(const Duration(days: 6));
    final response = await _client
        .from('clock_entries')
        .select()
        .eq('user_id', userId)
        .gte('clock_in', weekStart.toIso8601String())
        .lte('clock_in', weekEnd.add(const Duration(days: 1)).toIso8601String())
        .order('clock_in', ascending: false);
    return (response as List).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> getTimesheets(String candidateId) async {
    final response = await _client
        .from('timesheets')
        .select()
        .eq('candidate_id', candidateId)
        .order('period_start', ascending: false);
    return (response as List).cast<Map<String, dynamic>>();
  }
}
