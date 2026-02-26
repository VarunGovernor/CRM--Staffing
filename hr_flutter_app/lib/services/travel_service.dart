import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/travel_request.dart';

class TravelService {
  final _client = Supabase.instance.client;

  Future<List<TravelRequest>> getRequests(String userId) async {
    final data = await _client
        .from('travel_requests')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (data as List)
        .map((e) => TravelRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<TravelRequest>> getPendingForApproval() async {
    final data = await _client
        .from('travel_requests')
        .select()
        .eq('status', 'pending')
        .order('created_at', ascending: false);
    return (data as List)
        .map((e) => TravelRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> submitRequest({
    required String userId,
    required String destination,
    required String purpose,
    required DateTime departureDate,
    required DateTime returnDate,
    double? estimatedBudget,
    String? notes,
  }) async {
    await _client.from('travel_requests').insert({
      'user_id': userId,
      'destination': destination,
      'purpose': purpose,
      'departure_date': departureDate.toIso8601String().split('T').first,
      'return_date': returnDate.toIso8601String().split('T').first,
      'estimated_budget': ?estimatedBudget,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
  }

  Future<void> approveRequest(String id, String approverId) async {
    await _client.from('travel_requests').update({
      'status': 'approved',
      'approved_by': approverId,
      'approved_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }

  Future<void> rejectRequest(String id) async {
    await _client.from('travel_requests').update({
      'status': 'rejected',
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }
}
