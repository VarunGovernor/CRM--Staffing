class WorkSchedule {
  final String id;
  final String userId;
  final DateTime date;
  final String? shiftName;
  final String? startTime;
  final String? endTime;
  final String? status;
  final int? hoursWorked;

  WorkSchedule({
    required this.id,
    required this.userId,
    required this.date,
    this.shiftName,
    this.startTime,
    this.endTime,
    this.status,
    this.hoursWorked,
  });

  factory WorkSchedule.fromJson(Map<String, dynamic> json) {
    return WorkSchedule(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      date: DateTime.parse(json['date']),
      shiftName: json['shift_name'],
      startTime: json['start_time'],
      endTime: json['end_time'],
      status: json['status'],
      hoursWorked: json['hours_worked'],
    );
  }

  bool get isWeekend => date.weekday == DateTime.saturday || date.weekday == DateTime.sunday;
  bool get isPresent => status == 'present';
  bool get isAbsent => status == 'absent';
}
