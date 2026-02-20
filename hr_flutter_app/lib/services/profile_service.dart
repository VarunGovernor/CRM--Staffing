import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile.dart';

class ProfileService {
  final _client = Supabase.instance.client;

  Future<UserProfile?> getProfile(String userId) async {
    final response = await _client
        .from('user_profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
    if (response == null) return null;
    return UserProfile.fromJson(response);
  }

  Future<List<UserProfile>> getActiveProfiles({String? excludeId}) async {
    var query = _client
        .from('user_profiles')
        .select()
        .eq('is_active', true);
    final response = await query;
    return (response as List)
        .map((e) => UserProfile.fromJson(e))
        .where((p) => excludeId == null || p.id != excludeId)
        .toList();
  }

  Future<String> uploadAvatar(String userId, String filePath) async {
    final file = File(filePath);
    final ext = filePath.split('.').last.toLowerCase();
    final path = 'avatars/$userId.$ext';
    await _client.storage.from('avatars').upload(
          path,
          file,
          fileOptions: const FileOptions(upsert: true),
        );
    return _client.storage.from('avatars').getPublicUrl(path);
  }

  Future<void> updateProfile(
      String userId, Map<String, dynamic> data) async {
    await _client.from('user_profiles').update(data).eq('id', userId);
  }
}
