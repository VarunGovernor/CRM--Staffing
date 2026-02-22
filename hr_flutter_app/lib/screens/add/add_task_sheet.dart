import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/user_profile.dart';
import '../../services/profile_service.dart';
import '../../services/task_service.dart';
import '../../widgets/app_colors.dart';
import 'sheet_widgets.dart';

class AddTaskSheet extends StatefulWidget {
  final VoidCallback? onSubmitted;
  const AddTaskSheet({super.key, this.onSubmitted});

  @override
  State<AddTaskSheet> createState() => _AddTaskSheetState();
}

class _AddTaskSheetState extends State<AddTaskSheet> {
  final _service = TaskService();
  final _profileService = ProfileService();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  String _priority = 'medium';
  DateTime? _dueDate;
  UserProfile? _assignee;
  List<UserProfile> _profiles = [];
  bool _submitting = false;

  static const _priorities = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
  ];

  @override
  void initState() {
    super.initState();
    _loadProfiles();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProfiles() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    try {
      final data = await _profileService.getActiveProfiles(excludeId: userId);
      if (mounted) setState(() => _profiles = data);
    } catch (_) {}
  }

  String _fmtDate(DateTime? d) =>
      d != null ? DateFormat('dd MMM yyyy').format(d) : 'No due date';

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  Future<void> _pickPriority() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2)),
            ),
            ..._priorities.map((p) => ListTile(
                  title: Text(p.$2),
                  trailing: _priority == p.$1
                      ? const Icon(Icons.check, color: AppColors.blue)
                      : null,
                  onTap: () => Navigator.pop(context, p.$1),
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (result != null) setState(() => _priority = result);
  }

  Future<void> _pickAssignee() async {
    final result = await showModalBottomSheet<UserProfile>(
      context: context,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        builder: (_, ctrl) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2)),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Text('Assign To',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.textDark)),
              ),
              ListTile(
                leading: const CircleAvatar(
                    backgroundColor: AppColors.background,
                    child:
                        Icon(Icons.person_off_outlined, color: AppColors.textGray)),
                title: const Text('Unassigned'),
                onTap: () => Navigator.pop(context),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  controller: ctrl,
                  itemCount: _profiles.length,
                  itemBuilder: (_, i) {
                    final p = _profiles[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor:
                            AppColors.blue.withValues(alpha: 0.15),
                        backgroundImage: p.avatarUrl != null
                            ? NetworkImage(p.avatarUrl!)
                            : null,
                        child: p.avatarUrl == null
                            ? Text(p.initials,
                                style: const TextStyle(
                                    color: AppColors.blue,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12))
                            : null,
                      ),
                      title: Text(p.fullName),
                      subtitle: Text(p.role,
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textGray)),
                      trailing: _assignee?.id == p.id
                          ? const Icon(Icons.check, color: AppColors.blue)
                          : null,
                      onTap: () => Navigator.pop(context, p),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (result != null || mounted) {
      setState(() => _assignee = result);
    }
  }

  Future<void> _submit() async {
    if (_titleCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Enter a task title')));
      return;
    }

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _submitting = true);
    try {
      await _service.createTask(
        title: _titleCtrl.text.trim(),
        createdBy: userId,
        description: _descCtrl.text.trim().isNotEmpty
            ? _descCtrl.text.trim()
            : null,
        assignedTo: _assignee?.id,
        priority: _priority,
        dueDate: _dueDate,
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onSubmitted?.call();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Task created'),
              backgroundColor: AppColors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final priorityLabel =
        _priorities.firstWhere((p) => p.$1 == _priority).$2;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SheetHandle(),
          SheetHeader(
              title: 'New Task', onClose: () => Navigator.pop(context)),
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, 0, 16, bottom + 16),
              child: Column(
                children: [
                  FormCard(children: [
                    FieldRow(
                      label: 'Title',
                      hint: 'Task title',
                      controller: _titleCtrl,
                      isRequired: true,
                    ),
                    const FormDivider(),
                    FieldRow(
                      label: 'Description',
                      hint: 'Optional details',
                      controller: _descCtrl,
                      maxLines: 3,
                    ),
                  ]),
                  const SizedBox(height: 12),
                  FormCard(children: [
                    FormRow(
                      label: 'Priority',
                      value: priorityLabel,
                      onTap: _pickPriority,
                    ),
                    const FormDivider(),
                    DateRow(
                      label: 'Due Date',
                      value: _fmtDate(_dueDate),
                      onTap: _pickDate,
                    ),
                    const FormDivider(),
                    FormRow(
                      label: 'Assign To',
                      value: _assignee?.fullName ?? 'Unassigned',
                      isPlaceholder: _assignee == null,
                      onTap: _pickAssignee,
                    ),
                  ]),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          BottomButtons(
            cancelLabel: 'Cancel',
            confirmLabel: _submitting ? 'Creating…' : 'Create Task',
            confirmColor: AppColors.blue,
            onCancel: () => Navigator.pop(context),
            onConfirm: _submitting ? () {} : _submit,
            bottomPad: MediaQuery.of(context).padding.bottom,
          ),
        ],
      ),
    );
  }
}
