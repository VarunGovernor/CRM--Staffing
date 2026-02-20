class LeaveType {
  final String id;
  final String name;
  final String code;
  final bool isPaid;

  LeaveType({
    required this.id,
    required this.name,
    required this.code,
    this.isPaid = true,
  });

  factory LeaveType.fromJson(Map<String, dynamic> json) {
    return LeaveType(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      isPaid: json['is_paid'] ?? true,
    );
  }
}
