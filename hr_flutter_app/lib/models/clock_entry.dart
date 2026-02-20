class ClockEntry {
  final String id;
  final String userId;
  final DateTime clockIn;
  final DateTime? clockOut;
  final int? durationMinutes;

  ClockEntry({
    required this.id,
    required this.userId,
    required this.clockIn,
    this.clockOut,
    this.durationMinutes,
  });

  bool get isActive => clockOut == null;

  factory ClockEntry.fromJson(Map<String, dynamic> json) {
    return ClockEntry(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      clockIn: DateTime.parse(json['clock_in']).toLocal(),
      clockOut: json['clock_out'] != null
          ? DateTime.parse(json['clock_out']).toLocal()
          : null,
      durationMinutes: json['duration_minutes'],
    );
  }

  String get formattedDuration {
    if (durationMinutes == null) return '00:00';
    final h = durationMinutes! ~/ 60;
    final m = durationMinutes! % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
  }
}
