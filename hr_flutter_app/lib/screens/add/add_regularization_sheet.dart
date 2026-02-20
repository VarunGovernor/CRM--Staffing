import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../widgets/app_colors.dart';
import 'sheet_widgets.dart';

class AddRegularizationSheet extends StatefulWidget {
  const AddRegularizationSheet({super.key});

  @override
  State<AddRegularizationSheet> createState() =>
      _AddRegularizationSheetState();
}

class _AddRegularizationSheetState extends State<AddRegularizationSheet> {
  DateTime _date = DateTime.now();
  String _period = 'Day';
  String _reason = 'Forgot to check-in';
  final _descCtrl = TextEditingController();

  static const _reasons = [
    'Forgot to check-in',
    'Forgot to check-out',
    'Device issue',
    'Network issue',
    'Other',
  ];

  String _fmt(DateTime d) => DateFormat('dd-MMM-yyyy').format(d);
  String _dayNum(DateTime d) => d.day.toString();
  String _monthName(DateTime d) => DateFormat('MMM').format(d).toUpperCase();
  String _dayName(DateTime d) => DateFormat('EEE').format(d).toUpperCase();

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickPeriod() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Select Period',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ...['Day', 'Week', 'Month'].map((p) => ListTile(
                title: Text(p),
                trailing: _period == p
                    ? const Icon(Icons.check, color: AppColors.blue)
                    : null,
                onTap: () => Navigator.pop(context, p),
              )),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _period = result);
  }

  void _submit() {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Regularization request submitted'),
        backgroundColor: Color(0xFF22C55E),
      ),
    );
  }

  @override
  void dispose() {
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
            title: 'Add Regularization',
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
                        label: 'Employee',
                        value: 'SS015 - Varun Governor',
                      ),
                      const FormDivider(),
                      FormRow(
                        label: 'Period',
                        value: _period,
                        onTap: _pickPeriod,
                      ),
                      const FormDivider(),
                      FormRow(
                        label: 'Date',
                        value: _fmt(_date),
                        onTap: _pickDate,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Attachments
                  const Text('Attachment',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textDark)),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 14, horizontal: 20),
                      decoration: BoxDecoration(
                        color: Colors.black87,
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.attach_file,
                              color: Colors.white, size: 18),
                          SizedBox(width: 8),
                          Text('Add Attachments',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Attendance card
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            // Date badge
                            Column(
                              children: [
                                Text(_dayNum(_date),
                                    style: const TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textDark)),
                                Text(_monthName(_date),
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textGray)),
                                Text(_dayName(_date),
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textGray)),
                              ],
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text('Check-In',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFF22C55E),
                                              fontWeight:
                                                  FontWeight.w600)),
                                      Text(
                                        DateFormat('hh:mm a')
                                            .format(DateTime.now()),
                                        style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                  const Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('Check-Out',
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFFEF4444),
                                              fontWeight:
                                                  FontWeight.w600)),
                                      Text('--/--',
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight:
                                                  FontWeight.w600)),
                                    ],
                                  ),
                                  const Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      SizedBox(height: 16),
                                      Text('00:00\nHRS',
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight:
                                                  FontWeight.bold)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Reason dropdown
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: DropdownButton<String>(
                            value: _reason,
                            isExpanded: true,
                            underline: const SizedBox.shrink(),
                            icon: const Icon(Icons.arrow_drop_down),
                            items: _reasons
                                .map((r) => DropdownMenuItem(
                                    value: r, child: Text(r)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setState(() => _reason = v);
                            },
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Description
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: TextField(
                            controller: _descCtrl,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              hintText: 'Enter description...',
                              hintStyle:
                                  TextStyle(color: AppColors.textGray),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.all(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),

                        TextButton(
                          onPressed: () {
                            setState(
                                () => _reason = 'Forgot to check-in');
                            _descCtrl.clear();
                          },
                          child: const Text('Reset',
                              style:
                                  TextStyle(color: AppColors.blue)),
                        ),
                      ],
                    ),
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
