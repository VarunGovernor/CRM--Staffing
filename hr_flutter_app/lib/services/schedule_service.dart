import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/work_schedule.dart';

class ScheduleService {
  final _client = Supabase.instance.client;

  Future<List<WorkSchedule>> getWeekSchedule(String userId, DateTime weekStart) async {
    final weekEnd = weekStart.add(const Duration(days: 6));
    final response = await _client
        .from('work_schedules')
        .select()
        .eq('user_id', userId)
        .gte('date', weekStart.toIso8601String().split('T').first)
        .lte('date', weekEnd.toIso8601String().split('T').first)
        .order('date', ascending: true);
    return (response as List).map((e) => WorkSchedule.fromJson(e)).toList();
  }
}
