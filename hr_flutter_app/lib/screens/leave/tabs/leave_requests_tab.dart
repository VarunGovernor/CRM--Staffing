import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../models/leave_request.dart';
import '../../../services/leave_service.dart';
import '../../../widgets/app_colors.dart';

class LeaveRequestsTab extends StatefulWidget {
  const LeaveRequestsTab({super.key});

  @override
  State<LeaveRequestsTab> createState() => _LeaveRequestsTabState();
}

class _LeaveRequestsTabState extends State<LeaveRequestsTab> {
  final _service = LeaveService();
  List<LeaveRequest> _requests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final data = await _service.getRequests(userId);
      setState(() => _requests = data);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_requests.isEmpty) {
      return const Center(
          child: Text('No leave requests', style: TextStyle(color: AppColors.textGray)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _requests.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _RequestCard(_requests[i]),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final LeaveRequest request;
  const _RequestCard(this.request);

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd-MMM-yyyy');
    Color statusColor;
    switch (request.status) {
      case 'approved':
        statusColor = AppColors.green;
        break;
      case 'rejected':
        statusColor = AppColors.primary;
        break;
      default:
        statusColor = AppColors.orange;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                request.leaveType?.name ?? 'Leave',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  request.status.toUpperCase(),
                  style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${fmt.format(request.startDate)} - ${fmt.format(request.endDate)}',
            style: const TextStyle(color: AppColors.textGray),
          ),
          Text(
            '${request.days} Day${request.days != 1 ? 's' : ''}',
            style: const TextStyle(color: AppColors.textGray, fontSize: 13),
          ),
          if (request.reason != null && request.reason!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(request.reason!, style: const TextStyle(fontSize: 13)),
          ],
        ],
      ),
    );
  }
}
