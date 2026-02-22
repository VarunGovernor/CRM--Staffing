class TaskItem {
  final String id;
  final String title;
  final String? description;
  final String? assignedTo;
  final String createdBy;
  final String priority;
  final String status;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final DateTime createdAt;

  const TaskItem({
    required this.id,
    required this.title,
    this.description,
    this.assignedTo,
    required this.createdBy,
    required this.priority,
    required this.status,
    this.dueDate,
    this.completedAt,
    required this.createdAt,
  });

  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isOpen => status == 'open';
  bool get isInProgress => status == 'in_progress';

  bool get isOverdue =>
      dueDate != null &&
      dueDate!.isBefore(DateTime.now()) &&
      !isCompleted &&
      !isCancelled;

  factory TaskItem.fromJson(Map<String, dynamic> json) {
    return TaskItem(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      assignedTo: json['assigned_to'] as String?,
      createdBy: json['created_by'] as String,
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String,
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'] as String)
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
