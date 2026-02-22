import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../widgets/app_colors.dart';

class PayslipsScreen extends StatefulWidget {
  const PayslipsScreen({super.key});

  @override
  State<PayslipsScreen> createState() => _PayslipsScreenState();
}

class _PayslipsScreenState extends State<PayslipsScreen> {
  final _client = Supabase.instance.client;
  List<Map<String, dynamic>> _payslips = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      // Find candidate record matching the logged-in user's email
      final user = _client.auth.currentUser!;
      final candidateRes = await _client
          .from('candidates')
          .select('candidate_id')
          .eq('email', user.email ?? '')
          .maybeSingle();

      List<dynamic> invoices = [];
      if (candidateRes != null) {
        final candidateId = candidateRes['candidate_id'] as String;
        // invoices link via placements: candidate → placement → invoice
        final placements = await _client
            .from('placements')
            .select('placement_id')
            .eq('candidate_id', candidateId);
        final placementIds =
            (placements as List).map((p) => p['placement_id']).toList();
        if (placementIds.isNotEmpty) {
          invoices = await _client
              .from('invoices')
              .select()
              .inFilter('placement_id', placementIds)
              .order('due_date', ascending: false);
        }
      }

      setState(() => _payslips = List<Map<String, dynamic>>.from(invoices));
    } catch (e) {
      setState(() => _error = 'Unable to load payslips.');
      debugPrint('Payslips error: $e');
    } finally {
      setState(() => _loading = false);
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
          'Payslips',
          style: TextStyle(
              color: AppColors.textDark,
              fontWeight: FontWeight.bold,
              fontSize: 18),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Text(_error!,
                      style: const TextStyle(color: AppColors.textGray)))
              : _payslips.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _payslips.length,
                        separatorBuilder: (_, _) =>
                            const SizedBox(height: 10),
                        itemBuilder: (_, i) =>
                            _buildPayslipCard(_payslips[i]),
                      ),
                    ),
    );
  }

  Widget _buildPayslipCard(Map<String, dynamic> ps) {
    final status = (ps['status'] as String? ?? 'pending').toLowerCase();
    final netPay =
        double.tryParse(ps['total_amount']?.toString() ?? '0') ?? 0.0;
    final periodLabel =
        ps['invoice_month'] as String? ?? ps['invoice_id'] as String? ?? '—';

    Color statusColor;
    switch (status) {
      case 'paid':
        statusColor = AppColors.green;
      case 'overdue':
        statusColor = AppColors.primary;
      default:
        statusColor = AppColors.orange;
    }

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _showDetail(ps),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.receipt_long_outlined,
                  color: AppColors.green, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(periodLabel,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: AppColors.textDark)),
                  const SizedBox(height: 3),
                  Text(
                    '₹${NumberFormat('#,##,###.##').format(netPay)} net pay',
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textGray),
                  ),
                ],
              ),
            ),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                status[0].toUpperCase() + status.substring(1),
                style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(Map<String, dynamic> ps) {
    final hours =
        double.tryParse(ps['total_hours']?.toString() ?? '0') ?? 0.0;
    final billRate =
        double.tryParse(ps['bill_rate']?.toString() ?? '0') ?? 0.0;
    final net =
        double.tryParse(ps['total_amount']?.toString() ?? '0') ?? 0.0;
    final gross = hours * billRate; // bill_rate × hours = gross billing
    final fmt = NumberFormat('#,##,###.##');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.55,
        maxChildSize: 0.85,
        minChildSize: 0.4,
        builder: (_, ctrl) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: ctrl,
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text('Payslip Detail',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark)),
              const SizedBox(height: 20),
              _detailRow('Invoice #', ps['invoice_id'] as String? ?? '—'),
              _detailRow('Period', ps['invoice_month'] as String? ?? '—'),
              _detailRow('Hours Worked', '${hours.toStringAsFixed(1)}h'),
              _detailRow('Bill Rate', '₹${fmt.format(billRate)}/hr'),
              const Divider(height: 24),
              _detailRow('Gross Billing', '₹${fmt.format(gross)}',
                  valueColor: AppColors.textDark),
              const Divider(height: 24),
              _detailRow('Total Amount', '₹${fmt.format(net)}',
                  valueColor: AppColors.green, bold: true),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value,
      {Color? valueColor, bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 14, color: AppColors.textGray)),
          Text(value,
              style: TextStyle(
                  fontSize: 15,
                  fontWeight:
                      bold ? FontWeight.bold : FontWeight.w600,
                  color: valueColor ?? AppColors.textDark)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined,
              size: 56,
              color: AppColors.textGray.withValues(alpha: 0.4)),
          const SizedBox(height: 12),
          const Text(
            'No payslips found.',
            style: TextStyle(color: AppColors.textGray, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
