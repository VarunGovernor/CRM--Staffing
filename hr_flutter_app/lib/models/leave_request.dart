import 'leave_type.dart';

class LeaveRequest {
  final String id;
  final String userId;
  final String leaveTypeId;
  final DateTime startDate;
  final DateTime endDate;
  final double days;
  final String? reason;
  final String status;
  final DateTime createdAt;
  final LeaveType? leaveType;

  LeaveRequest({
    required this.id,
    required this.userId,
    required this.leaveTypeId,
    required this.startDate,
    required this.endDate,
    required this.days,
    this.reason,
    required this.status,
    required this.createdAt,
    this.leaveType,
  });

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      leaveTypeId: json['leave_type_id'] ?? '',
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
      days: (json['days'] ?? 1).toDouble(),
      reason: json['reason'],
      status: json['status'] ?? 'pending',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      leaveType: json['leave_types'] != null
          ? LeaveType.fromJson(json['leave_types'])
          : null,
    );
  }

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
}
