import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../widgets/app_colors.dart';
import 'sheet_widgets.dart';

class AddCompOffSheet extends StatefulWidget {
  const AddCompOffSheet({super.key});

  @override
  State<AddCompOffSheet> createState() => _AddCompOffSheetState();
}

class _AddCompOffSheetState extends State<AddCompOffSheet> {
  DateTime _workedDate = DateTime.now().subtract(const Duration(days: 5));
  DateTime _expiryDate = DateTime(DateTime.now().year, 12, 31);
  String _unit = 'Days';
  String _duration = 'Full Day';
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;

  String _fmt(DateTime d) => DateFormat('dd-MMM-yyyy').format(d);

  String _fmtTime(TimeOfDay t) {
    final h = t.hourOfPeriod == 0 ? 12 : t.hourOfPeriod;
    final m = t.minute.toString().padLeft(2, '0');
    final period = t.period == DayPeriod.am ? 'AM' : 'PM';
    return '$h:$m $period';
  }

  Future<void> _pickWorkedDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _workedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _workedDate = picked);
  }

  Future<void> _pickExpiryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _expiryDate,
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (picked != null) setState(() => _expiryDate = picked);
  }

  Future<void> _pickUnit() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Select Unit',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ...['Days', 'Hours'].map((u) => ListTile(
                title: Text(u),
                trailing: _unit == u
                    ? const Icon(Icons.check, color: AppColors.blue)
                    : null,
                onTap: () => Navigator.pop(context, u),
              )),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _unit = result);
  }

  Future<void> _pickDuration() async {
    final options = ['Full Day', 'First Half', 'Second Half', 'Custom Hours'];
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Select Duration',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ...options.map((d) => ListTile(
                title: Text(d),
                trailing: _duration == d
                    ? const Icon(Icons.check, color: AppColors.blue)
                    : null,
                onTap: () => Navigator.pop(context, d),
              )),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _duration = result);
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
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Compensatory Off request submitted'),
        backgroundColor: Color(0xFF22C55E),
      ),
    );
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
            title: 'Add Request',
            onClose: () => Navigator.pop(context),
            trailing: GestureDetector(
              onTap: _submit,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 4)
                  ],
                ),
                child:
                    const Icon(Icons.check, size: 18, color: AppColors.blue),
              ),
            ),
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
                        label: 'Employee Name',
                        isRequired: true,
                        value: 'Varun Governor',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FormCard(
                    children: [
                      DateRow(
                        label: 'Worked Date',
                        isRequired: true,
                        value: _fmt(_workedDate),
                        onTap: _pickWorkedDate,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Attendance info card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _InfoCell(
                                  label: 'First In', value: '-'),
                            ),
                            Expanded(
                              child: _InfoCell(
                                  label: 'Last Out', value: '-'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _InfoCell(
                                  label: 'Overtime', value: '-'),
                            ),
                            Expanded(
                              child:
                                  _InfoCell(label: 'Total', value: '-'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  FormCard(
                    children: [
                      FormRow(
                        label: 'Unit',
                        isRequired: true,
                        value: _unit,
                        onTap: _pickUnit,
                      ),
                      const FormDivider(),
                      FormRow(
                        label: 'Duration',
                        isRequired: true,
                        value: _duration,
                        onTap: _pickDuration,
                      ),
                      const FormDivider(),
                      InkWell(
                        onTap: () => _pickTime(true),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.zero,
                          bottomRight: Radius.zero,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    const Text('Start Time',
                                        style: TextStyle(
                                            fontSize: 13,
                                            color: AppColors.textGray)),
                                    const SizedBox(height: 2),
                                    Text(
                                      _startTime != null
                                          ? _fmtTime(_startTime!)
                                          : 'From',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: _startTime != null
                                            ? AppColors.textDark
                                            : AppColors.textGray,
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
                      InkWell(
                        onTap: () => _pickTime(false),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    const Text('End Time',
                                        style: TextStyle(
                                            fontSize: 13,
                                            color: AppColors.textGray)),
                                    const SizedBox(height: 2),
                                    Text(
                                      _endTime != null
                                          ? _fmtTime(_endTime!)
                                          : 'To',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: _endTime != null
                                            ? AppColors.textDark
                                            : AppColors.textGray,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  FormCard(
                    children: [
                      DateRow(
                        label: 'Expiry Date',
                        isRequired: true,
                        value: _fmt(_expiryDate),
                        onTap: _pickExpiryDate,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          SizedBox(height: bottomPad),
        ],
      ),
    );
  }
}

class _InfoCell extends StatelessWidget {
  final String label;
  final String value;
  const _InfoCell({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 12, color: AppColors.textGray)),
        const SizedBox(height: 4),
        Text(value,
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textDark)),
      ],
    );
  }
}
