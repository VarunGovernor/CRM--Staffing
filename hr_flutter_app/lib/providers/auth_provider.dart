import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile.dart';
import '../services/auth_service.dart';
import '../services/profile_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final ProfileService _profileService = ProfileService();

  User? _user;
  UserProfile? _profile;
  bool _loading = true;

  User? get user => _user;
  UserProfile? get profile => _profile;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _init();
  }

  void _init() {
    _user = _authService.currentUser;
    if (_user != null) {
      _loadProfile(_user!.id);
    } else {
      _loading = false;
    }
    _authService.authStateStream.listen((event) async {
      _user = event.session?.user;
      if (_user != null) {
        await _loadProfile(_user!.id);
      } else {
        _profile = null;
        _loading = false;
        notifyListeners();
      }
    });
  }

  Future<void> _loadProfile(String userId) async {
    _loading = true;
    notifyListeners();
    try {
      _profile = await _profileService.getProfile(userId);
    } catch (_) {}
    _loading = false;
    notifyListeners();
  }

  Future<String?> signIn(String email, String password) async {
    try {
      await _authService.signIn(email, password);
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
  }
}
