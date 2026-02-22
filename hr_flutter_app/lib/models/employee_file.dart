class EmployeeFile {
  final String id;
  final String userId;
  final String name;
  final String category;
  final String fileUrl;
  final int? fileSizeBytes;
  final String? uploadedBy;
  final DateTime createdAt;

  const EmployeeFile({
    required this.id,
    required this.userId,
    required this.name,
    required this.category,
    required this.fileUrl,
    this.fileSizeBytes,
    this.uploadedBy,
    required this.createdAt,
  });

  String get formattedSize {
    if (fileSizeBytes == null) return '';
    final kb = fileSizeBytes! / 1024;
    if (kb < 1024) return '${kb.toStringAsFixed(1)} KB';
    final mb = kb / 1024;
    return '${mb.toStringAsFixed(1)} MB';
  }

  String get categoryLabel {
    switch (category) {
      case 'offer_letter':
        return 'Offer Letter';
      case 'payslip':
        return 'Payslip';
      case 'contract':
        return 'Contract';
      case 'id_proof':
        return 'ID Proof';
      default:
        return 'Other';
    }
  }

  factory EmployeeFile.fromJson(Map<String, dynamic> json) {
    return EmployeeFile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      category: json['category'] as String? ?? 'other',
      fileUrl: json['file_url'] as String,
      fileSizeBytes: json['file_size_bytes'] as int?,
      uploadedBy: json['uploaded_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
