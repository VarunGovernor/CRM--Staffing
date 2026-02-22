class TravelRequest {
  final String id;
  final String userId;
  final String destination;
  final String purpose;
  final DateTime departureDate;
  final DateTime returnDate;
  final double? estimatedBudget;
  final String status;
  final String? notes;
  final String? approvedBy;
  final DateTime? approvedAt;
  final DateTime createdAt;

  const TravelRequest({
    required this.id,
    required this.userId,
    required this.destination,
    required this.purpose,
    required this.departureDate,
    required this.returnDate,
    this.estimatedBudget,
    required this.status,
    this.notes,
    this.approvedBy,
    this.approvedAt,
    required this.createdAt,
  });

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';

  int get tripDays => returnDate.difference(departureDate).inDays + 1;

  factory TravelRequest.fromJson(Map<String, dynamic> json) {
    return TravelRequest(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      destination: json['destination'] as String,
      purpose: json['purpose'] as String,
      departureDate: DateTime.parse(json['departure_date'] as String),
      returnDate: DateTime.parse(json['return_date'] as String),
      estimatedBudget: json['estimated_budget'] != null
          ? (json['estimated_budget'] as num).toDouble()
          : null,
      status: json['status'] as String,
      notes: json['notes'] as String?,
      approvedBy: json['approved_by'] as String?,
      approvedAt: json['approved_at'] != null
          ? DateTime.parse(json['approved_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
