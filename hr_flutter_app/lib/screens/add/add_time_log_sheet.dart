import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../widgets/app_colors.dart';
import 'sheet_widgets.dart';

class AddTimeLogSheet extends StatefulWidget {
  const AddTimeLogSheet({super.key});

  @override
  State<AddTimeLogSheet> createState() => _AddTimeLogSheetState();
}

class _AddTimeLogSheetState extends State<AddTimeLogSheet> {
  String? _projectName;
  String? _job;
  final _workItemCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  DateTime _date = DateTime.now();
  bool _billable = true;
  // 0 = Hour, 1 = Start & End, 2 = Start Timer
  int _logMode = 0;
  double _hours = 0;

  // For Start & End mode
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;

  String _fmt(DateTime d) => DateFormat('dd-MMM-yyyy').format(d);
  String _fmtTime(TimeOfDay t) {
    final h = t.hourOfPeriod == 0 ? 12 : t.hourOfPeriod;
    final m = t.minute.toString().padLeft(2, '0');
    final period = t.period == DayPeriod.am ? 'AM' : 'PM';
    return '$h:$m $period';
  }

  String get _durationDisplay {
    if (_logMode == 0) {
      final h = _hours.floor();
      final m = ((_hours - h) * 60).round();
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
    }
    if (_logMode == 1 && _startTime != null && _endTime != null) {
      final startMins = _startTime!.hour * 60 + _startTime!.minute;
      final endMins = _endTime!.hour * 60 + _endTime!.minute;
      final diff = (endMins - startMins).abs();
      final h = diff ~/ 60;
      final m = diff % 60;
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
    }
    return '00:00';
  }

  Future<void> _pickProject() async {
    final projects = ['Project Alpha', 'Project Beta', 'Internal', 'Support'];
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Select Project',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          ...projects.map(
            (p) => ListTile(
              title: Text(p),
              trailing: _projectName == p
                  ? const Icon(Icons.check, color: AppColors.blue)
                  : null,
              onTap: () => Navigator.pop(context, p),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _projectName = result);
  }

  Future<void> _pickJob() async {
    final jobs = [
      'Development',
      'Testing',
      'Design',
      'Documentation',
      'Meeting',
    ];
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Select Job',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          ...jobs.map(
            (j) => ListTile(
              title: Text(j),
              trailing: _job == j
                  ? const Icon(Icons.check, color: AppColors.blue)
                  : null,
              onTap: () => Navigator.pop(context, j),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _job = result);
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart
          ? (_startTime ?? TimeOfDay.now())
          : (_endTime ?? TimeOfDay.now()),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  void _submit() {
    if (_job == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a job')));
      return;
    }
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Time log saved successfully'),
        backgroundColor: Color(0xFF22C55E),
      ),
    );
  }

  @override
  void dispose() {
    _workItemCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    final keyboardPad = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF1F5F9),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SheetHandle(),
          SheetHeader(
            title: 'Add Time Log',
            onClose: () => Navigator.pop(context),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, 0, 16, keyboardPad + 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FormCard(
                    children: [
                      FormRow(
                        label: 'Project Name',
                        value: _projectName ?? 'Select',
                        isPlaceholder: _projectName == null,
                        onTap: _pickProject,
                      ),
                      const FormDivider(),
                      FormRow(
                        label: 'Job',
                        isRequired: true,
                        value: _job ?? 'Select',
                        isPlaceholder: _job == null,
                        onTap: _pickJob,
                      ),
                      const FormDivider(),
                      FieldRow(
                        label: 'Work Item',
                        hint: 'Enter here',
                        controller: _workItemCtrl,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FormCard(
                    children: [
                      InkWell(
                        onTap: _pickDate,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Date',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textGray,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _fmt(_date),
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const FormDivider(),
                      FieldRow(
                        label: 'Description',
                        hint: 'Enter here',
                        controller: _descCtrl,
                        maxLines: 3,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Log mode selector
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Mode tabs
                        Row(
                          children: [
                            _ModeTab(
                              label: 'Hour',
                              selected: _logMode == 0,
                              onTap: () => setState(() => _logMode = 0),
                            ),
                            Expanded(
                              child: _ModeTab(
                                label: 'Start & End',
                                selected: _logMode == 1,
                                onTap: () => setState(() => _logMode = 1),
                              ),
                            ),
                            _ModeTab(
                              label: 'Start Timer',
                              selected: _logMode == 2,
                              onTap: () => setState(() => _logMode = 2),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),

                        // Mode indicator dots / slider
                        Row(
                          children: [
                            _ModeDot(active: _logMode == 0),
                            Expanded(
                              child: Container(
                                height: 3,
                                color: Colors.grey[200],
                              ),
                            ),
                            _ModeDot(active: _logMode == 1),
                            Expanded(
                              child: Container(
                                height: 3,
                                color: Colors.grey[200],
                              ),
                            ),
                            _ModeDot(active: _logMode == 2),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Mode content
                        if (_logMode == 0) ...[
                          Slider(
                            value: _hours,
                            min: 0,
                            max: 12,
                            divisions: 48,
                            activeColor: AppColors.green,
                            onChanged: (v) => setState(() => _hours = v),
                          ),
                        ] else if (_logMode == 1) ...[
                          Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => _pickTime(true),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 10,
                                      horizontal: 12,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Start',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: AppColors.textGray,
                                          ),
                                        ),
                                        Text(
                                          _startTime != null
                                              ? _fmtTime(_startTime!)
                                              : '--:-- --',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8),
                                child: Text(
                                  '→',
                                  style: TextStyle(color: AppColors.textGray),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => _pickTime(false),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 10,
                                      horizontal: 12,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'End',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: AppColors.textGray,
                                          ),
                                        ),
                                        Text(
                                          _endTime != null
                                              ? _fmtTime(_endTime!)
                                              : '--:-- --',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.play_arrow),
                            label: const Text('Start Timer'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.green,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 12),
                        Text(
                          _durationDisplay,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Billable toggle
                        const FormDivider(),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Text(
                              'Billable Status',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const Spacer(),
                            Switch(
                              value: _billable,
                              activeThumbColor: AppColors.green,
                              onChanged: (v) => setState(() => _billable = v),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          BottomButtons(
            cancelLabel: 'Cancel',
            confirmLabel: 'Save',
            confirmColor: const Color(0xFF22C55E),
            onCancel: () => Navigator.pop(context),
            onConfirm: _submit,
            bottomPad: bottomPad,
          ),
        ],
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _ModeTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: selected ? FontWeight.w700 : FontWeight.normal,
          color: selected ? AppColors.textDark : AppColors.textGray,
        ),
      ),
    );
  }
}

class _ModeDot extends StatelessWidget {
  final bool active;
  const _ModeDot({required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: active ? 12 : 8,
      height: active ? 12 : 8,
      decoration: BoxDecoration(
        color: active ? AppColors.green : Colors.grey[300],
        shape: BoxShape.circle,
      ),
    );
  }
}
