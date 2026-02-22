import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/task_item.dart';
import '../../services/task_service.dart';
import '../../widgets/app_colors.dart';
import '../add/add_task_sheet.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen>
    with SingleTickerProviderStateMixin {
  final _service = TaskService();
  late TabController _tabController;
  List<TaskItem> _myTasks = [];
  List<TaskItem> _createdTasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final results = await Future.wait([
        _service.getMyTasks(userId),
        _service.getCreatedTasks(userId),
      ]);
      setState(() {
        _myTasks = results[0];
        _createdTasks = results[1];
      });
    } catch (e) {
      debugPrint('Tasks error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _openAddSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddTaskSheet(onSubmitted: _loadData),
    );
  }

  Future<void> _cycleStatus(TaskItem task) async {
    if (task.isCompleted || task.isCancelled) return;
    final nextStatus = task.isOpen ? 'in_progress' : 'completed';
    try {
      await _service.updateTaskStatus(task.id, nextStatus);
      await _loadData();
    } catch (e) {
      debugPrint('Update task error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Tasks',
          style: TextStyle(
              color: AppColors.textDark,
              fontWeight: FontWeight.bold,
              fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.blue,
          unselectedLabelColor: AppColors.textGray,
          labelStyle:
              const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          indicatorColor: AppColors.blue,
          tabs: [
            Tab(text: 'My Tasks (${_myTasks.length})'),
            Tab(text: 'Created (${_createdTasks.length})'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openAddSheet,
        backgroundColor: AppColors.blue,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Task',
            style:
                TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildTaskList(_myTasks, showAssignee: false),
                _buildTaskList(_createdTasks, showAssignee: true),
              ],
            ),
    );
  }

  Widget _buildTaskList(List<TaskItem> tasks, {required bool showAssignee}) {
    if (tasks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.task_alt,
                size: 56,
                color: AppColors.textGray.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            const Text('No tasks yet.',
                style: TextStyle(color: AppColors.textGray)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: tasks.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _buildTaskCard(tasks[i]),
      ),
    );
  }

  Widget _buildTaskCard(TaskItem task) {
    Color priorityColor;
    switch (task.priority) {
      case 'urgent':
        priorityColor = AppColors.primary;
      case 'high':
        priorityColor = AppColors.orange;
      case 'low':
        priorityColor = AppColors.textGray;
      default:
        priorityColor = AppColors.blue;
    }

    Color statusColor;
    String statusLabel;
    switch (task.status) {
      case 'in_progress':
        statusColor = AppColors.blue;
        statusLabel = 'In Progress';
      case 'completed':
        statusColor = AppColors.green;
        statusLabel = 'Done';
      case 'cancelled':
        statusColor = AppColors.textGray;
        statusLabel = 'Cancelled';
      default:
        statusColor = AppColors.orange;
        statusLabel = 'Open';
    }

    final isActionable = !task.isCompleted && !task.isCancelled;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: isActionable ? () => _cycleStatus(task) : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Priority dot
              Container(
                width: 10,
                height: 10,
                margin: const EdgeInsets.only(top: 4),
                decoration: BoxDecoration(
                  color: priorityColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(task.title,
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: AppColors.textDark,
                            decoration: task.isCompleted
                                ? TextDecoration.lineThrough
                                : null)),
                    if (task.description != null &&
                        task.description!.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(task.description!,
                          style: const TextStyle(
                              fontSize: 13, color: AppColors.textGray),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (task.dueDate != null) ...[
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 11,
                            color: task.isOverdue
                                ? AppColors.primary
                                : AppColors.textGray,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            DateFormat('dd MMM').format(task.dueDate!),
                            style: TextStyle(
                                fontSize: 11,
                                color: task.isOverdue
                                    ? AppColors.primary
                                    : AppColors.textGray),
                          ),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          task.priority[0].toUpperCase() +
                              task.priority.substring(1),
                          style: TextStyle(
                              fontSize: 11,
                              color: priorityColor,
                              fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(statusLabel,
                        style: TextStyle(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600)),
                  ),
                  if (isActionable) ...[
                    const SizedBox(height: 6),
                    Text(
                      task.isOpen ? 'Tap → In Progress' : 'Tap → Done',
                      style: const TextStyle(
                          fontSize: 9, color: AppColors.textGray),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
