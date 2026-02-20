import 'leave_type.dart';

class LeaveBalance {
  final String id;
  final String userId;
  final String leaveTypeId;
  final double balance;
  final double booked;
  final int year;
  final LeaveType? leaveType;

  LeaveBalance({
    required this.id,
    required this.userId,
    required this.leaveTypeId,
    required this.balance,
    required this.booked,
    required this.year,
    this.leaveType,
  });

  factory LeaveBalance.fromJson(Map<String, dynamic> json) {
    return LeaveBalance(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      leaveTypeId: json['leave_type_id'] ?? '',
      balance: (json['balance'] ?? 0).toDouble(),
      booked: (json['booked'] ?? 0).toDouble(),
      year: json['year'] ?? DateTime.now().year,
      leaveType: json['leave_types'] != null
          ? LeaveType.fromJson(json['leave_types'])
          : null,
    );
  }
}
