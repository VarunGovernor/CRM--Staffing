import 'dart:async';
import 'package:flutter/material.dart';
import '../models/clock_entry.dart';
import '../services/clock_service.dart';

class ClockProvider extends ChangeNotifier {
  final ClockService _service = ClockService();

  ClockEntry? _activeEntry;
  Duration _elapsed = Duration.zero;
  Timer? _timer;
  bool _loading = false;
  String? _error;

  ClockEntry? get activeEntry => _activeEntry;
  Duration get elapsed => _elapsed;
  bool get isClockedIn => _activeEntry != null;
  bool get loading => _loading;
  String? get error => _error;

  String get elapsedFormatted {
    final h = _elapsed.inHours.toString().padLeft(2, '0');
    final m = (_elapsed.inMinutes % 60).toString().padLeft(2, '0');
    final s = (_elapsed.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  Future<void> init(String userId) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _activeEntry = await _service.getActiveEntry(userId);
      if (_activeEntry != null) {
        _elapsed = DateTime.now().difference(_activeEntry!.clockIn);
        _startTimer();
      }
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> clockIn(String userId) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _activeEntry = await _service.clockIn(userId);
      _elapsed = Duration.zero;
      _startTimer();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> clockOut() async {
    if (_activeEntry == null) return;
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _service.clockOut(_activeEntry!.id, _activeEntry!.clockIn);
      _activeEntry = null;
      _stopTimer();
      _elapsed = Duration.zero;
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _elapsed += const Duration(seconds: 1);
      notifyListeners();
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    _stopTimer();
    super.dispose();
  }
}
