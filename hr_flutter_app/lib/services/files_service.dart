import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/employee_file.dart';

class FilesService {
  final _client = Supabase.instance.client;

  Future<List<EmployeeFile>> getFiles(String userId) async {
    final data = await _client
        .from('employee_files')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (data as List)
        .map((e) => EmployeeFile.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Uploads [file] to Supabase Storage and inserts a record.
  /// Throws on failure.
  Future<void> uploadFile({
    required String userId,
    required File file,
    required String name,
    required String category,
  }) async {
    final ext = file.path.split('.').last;
    final storagePath =
        '$userId/${DateTime.now().millisecondsSinceEpoch}.$ext';

    await _client.storage
        .from('employee-files')
        .upload(storagePath, file);

    final publicUrl = _client.storage
        .from('employee-files')
        .getPublicUrl(storagePath);

    final stat = await file.stat();

    await _client.from('employee_files').insert({
      'user_id': userId,
      'name': name,
      'category': category,
      'file_url': publicUrl,
      'file_size_bytes': stat.size,
      'uploaded_by': userId,
    });
  }
}
