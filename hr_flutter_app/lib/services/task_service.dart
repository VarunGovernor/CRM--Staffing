import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/task_item.dart';

class TaskService {
  final _client = Supabase.instance.client;

  Future<List<TaskItem>> getMyTasks(String userId) async {
    final data = await _client
        .from('tasks')
        .select()
        .eq('assigned_to', userId)
        .order('created_at', ascending: false);
    return (data as List)
        .map((e) => TaskItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<TaskItem>> getCreatedTasks(String userId) async {
    final data = await _client
        .from('tasks')
        .select()
        .eq('created_by', userId)
        .order('created_at', ascending: false);
    return (data as List)
        .map((e) => TaskItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createTask({
    required String title,
    required String createdBy,
    String? description,
    String? assignedTo,
    String priority = 'medium',
    DateTime? dueDate,
  }) async {
    await _client.from('tasks').insert({
      'title': title,
      'created_by': createdBy,
      if (description != null && description.isNotEmpty)
        'description': description,
      if (assignedTo != null) 'assigned_to': assignedTo,
      'priority': priority,
      if (dueDate != null)
        'due_date': dueDate.toIso8601String().split('T').first,
    });
  }

  Future<void> updateTaskStatus(String id, String status) async {
    await _client.from('tasks').update({
      'status': status,
      if (status == 'completed')
        'completed_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', id);
  }
}
