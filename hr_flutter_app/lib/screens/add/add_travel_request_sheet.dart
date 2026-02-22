import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/travel_service.dart';
import '../../widgets/app_colors.dart';
import 'sheet_widgets.dart';

class AddTravelRequestSheet extends StatefulWidget {
  final VoidCallback? onSubmitted;
  const AddTravelRequestSheet({super.key, this.onSubmitted});

  @override
  State<AddTravelRequestSheet> createState() => _AddTravelRequestSheetState();
}

class _AddTravelRequestSheetState extends State<AddTravelRequestSheet> {
  final _service = TravelService();
  final _destinationCtrl = TextEditingController();
  final _purposeCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  DateTime? _departure;
  DateTime? _returnDate;
  bool _submitting = false;

  @override
  void dispose() {
    _destinationCtrl.dispose();
    _purposeCtrl.dispose();
    _budgetCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  String _fmt(DateTime? d) =>
      d != null ? DateFormat('dd MMM yyyy').format(d) : 'Select';

  Future<void> _pickDate(bool isDeparture) async {
    final now = DateTime.now();
    final initial = isDeparture
        ? (_departure ?? now)
        : (_returnDate ?? (_departure ?? now));
    final first = isDeparture ? now : (_departure ?? now);

    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(first) ? first : initial,
      firstDate: first,
      lastDate: DateTime(now.year + 2),
    );
    if (picked == null) return;
    setState(() {
      if (isDeparture) {
        _departure = picked;
        if (_returnDate != null && _returnDate!.isBefore(picked)) {
          _returnDate = picked;
        }
      } else {
        _returnDate = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (_destinationCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Enter a destination')));
      return;
    }
    if (_purposeCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Enter the purpose')));
      return;
    }
    if (_departure == null || _returnDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Select departure and return dates')));
      return;
    }

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _submitting = true);
    try {
      await _service.submitRequest(
        userId: userId,
        destination: _destinationCtrl.text.trim(),
        purpose: _purposeCtrl.text.trim(),
        departureDate: _departure!,
        returnDate: _returnDate!,
        estimatedBudget: double.tryParse(_budgetCtrl.text),
        notes: _notesCtrl.text.trim(),
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onSubmitted?.call();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Travel request submitted'),
              backgroundColor: AppColors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
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
              title: 'Travel Request',
              onClose: () => Navigator.pop(context)),
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, 0, 16, bottom + 16),
              child: Column(
                children: [
                  FormCard(children: [
                    FieldRow(
                      label: 'Destination',
                      hint: 'e.g. Mumbai',
                      controller: _destinationCtrl,
                      isRequired: true,
                    ),
                    const FormDivider(),
                    FieldRow(
                      label: 'Purpose',
                      hint: 'Reason for travel',
                      controller: _purposeCtrl,
                      isRequired: true,
                      maxLines: 2,
                    ),
                  ]),
                  const SizedBox(height: 12),
                  FormCard(children: [
                    DateRow(
                      label: 'Departure Date',
                      value: _fmt(_departure),
                      isRequired: true,
                      onTap: () => _pickDate(true),
                    ),
                    const FormDivider(),
                    DateRow(
                      label: 'Return Date',
                      value: _fmt(_returnDate),
                      isRequired: true,
                      onTap: () => _pickDate(false),
                    ),
                  ]),
                  const SizedBox(height: 12),
                  FormCard(children: [
                    FieldRow(
                      label: 'Estimated Budget (₹)',
                      hint: 'Optional',
                      controller: _budgetCtrl,
                      keyboardType: TextInputType.number,
                    ),
                    const FormDivider(),
                    FieldRow(
                      label: 'Notes',
                      hint: 'Any additional information',
                      controller: _notesCtrl,
                      maxLines: 3,
                    ),
                  ]),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          BottomButtons(
            cancelLabel: 'Cancel',
            confirmLabel: _submitting ? 'Submitting…' : 'Submit',
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
