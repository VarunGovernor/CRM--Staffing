import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../widgets/app_colors.dart';
import 'sheet_widgets.dart';

class ApplyLeaveSheet extends StatefulWidget {
  const ApplyLeaveSheet({super.key});

  @override
  State<ApplyLeaveSheet> createState() => _ApplyLeaveSheetState();
}

class _ApplyLeaveSheetState extends State<ApplyLeaveSheet> {
  String? _selectedLeaveType;
  DateTime _fromDate = DateTime.now();
  DateTime _toDate = DateTime.now();
  final _teamEmailCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();

  static const _leaveTypes = [
    'Earned Leave',
    'Sick Leave',
    'Casual Leave',
    'Compensatory Off',
    'Leave Without Pay',
  ];

  String _fmt(DateTime d) => DateFormat('dd-MMM-yyyy').format(d);

  Future<void> _pickDate(bool isFrom) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFrom ? _fromDate : _toDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _fromDate = picked;
        if (_toDate.isBefore(_fromDate)) _toDate = _fromDate;
      } else {
        _toDate = picked;
      }
    });
  }

  Future<void> _pickLeaveType() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Select Leave Type',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ..._leaveTypes.map((t) => ListTile(
                title: Text(t),
                trailing: _selectedLeaveType == t
                    ? const Icon(Icons.check, color: AppColors.blue)
                    : null,
                onTap: () => Navigator.pop(context, t),
              )),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _selectedLeaveType = result);
  }

  void _submit() {
    if (_selectedLeaveType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a leave type')),
      );
      return;
    }
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Leave applied successfully'),
        backgroundColor: Color(0xFF22C55E),
      ),
    );
  }

  @override
  void dispose() {
    _teamEmailCtrl.dispose();
    _reasonCtrl.dispose();
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
            title: 'Apply Leave',
            onClose: () => Navigator.pop(context),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, 0, 16, keyboardPad + 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: Text('Leave',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                  FormCard(
                    children: [
                      FormRow(
                        label: 'Employee ID',
                        value: 'Nagamanikanta Varun Desetti',
                      ),
                      const FormDivider(),
                      FormRow(
                        label: 'Leave type',
                        isRequired: true,
                        value: _selectedLeaveType ?? 'Select',
                        isPlaceholder: _selectedLeaveType == null,
                        onTap: _pickLeaveType,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FormCard(
                    children: [
                      DateRow(
                        label: 'From',
                        isRequired: true,
                        value: _fmt(_fromDate),
                        onTap: () => _pickDate(true),
                      ),
                      const FormDivider(),
                      DateRow(
                        label: 'To',
                        isRequired: true,
                        value: _fmt(_toDate),
                        onTap: () => _pickDate(false),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FormCard(
                    children: [
                      FieldRow(
                        label: 'Team Email ID',
                        hint: 'Enter here',
                        controller: _teamEmailCtrl,
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('Reason for leave',
                      style: TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _reasonCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Enter here',
                        hintStyle: TextStyle(color: AppColors.textGray),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.all(14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          BottomButtons(
            cancelLabel: 'Cancel',
            confirmLabel: 'Apply',
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
