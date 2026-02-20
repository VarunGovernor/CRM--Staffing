import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/leave_balance.dart';
import '../models/leave_request.dart';
import '../models/leave_type.dart';

class LeaveService {
  final _client = Supabase.instance.client;

  Future<List<LeaveBalance>> getBalances(String userId, int year) async {
    final response = await _client
        .from('leave_balances')
        .select('*, leave_types(*)')
        .eq('user_id', userId)
        .eq('year', year);
    return (response as List).map((e) => LeaveBalance.fromJson(e)).toList();
  }

  Future<List<LeaveRequest>> getRequests(String userId) async {
    final response = await _client
        .from('leave_requests')
        .select('*, leave_types(*)')
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (response as List).map((e) => LeaveRequest.fromJson(e)).toList();
  }

  Future<List<LeaveType>> getLeaveTypes() async {
    final response = await _client.from('leave_types').select();
    return (response as List).map((e) => LeaveType.fromJson(e)).toList();
  }

  Future<void> applyLeave({
    required String userId,
    required String leaveTypeId,
    required DateTime startDate,
    required DateTime endDate,
    required double days,
    String? reason,
  }) async {
    await _client.from('leave_requests').insert({
      'user_id': userId,
      'leave_type_id': leaveTypeId,
      'start_date': startDate.toIso8601String().split('T').first,
      'end_date': endDate.toIso8601String().split('T').first,
      'days': days,
      'reason': reason,
      'status': 'pending',
    });
  }

  Future<List<Map<String, dynamic>>> getAbsentDates(String userId) async {
    // Absent dates: days in work_schedules where status = 'absent'
    final response = await _client
        .from('work_schedules')
        .select('date, status')
        .eq('user_id', userId)
        .eq('status', 'absent')
        .order('date', ascending: false)
        .limit(20);
    return (response as List).cast<Map<String, dynamic>>();
  }
}
