import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/travel_request.dart';
import '../../services/travel_service.dart';
import '../../widgets/app_colors.dart';
import '../add/add_travel_request_sheet.dart';

class TravelScreen extends StatefulWidget {
  const TravelScreen({super.key});

  @override
  State<TravelScreen> createState() => _TravelScreenState();
}

class _TravelScreenState extends State<TravelScreen>
    with SingleTickerProviderStateMixin {
  final _service = TravelService();
  late TabController _tabController;
  List<TravelRequest> _requests = [];
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
      final data = await _service.getRequests(userId);
      setState(() => _requests = data);
    } catch (e) {
      debugPrint('Travel error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _openAddSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddTravelRequestSheet(onSubmitted: _loadData),
    );
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
          'Travel',
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
          tabs: const [Tab(text: 'My Requests'), Tab(text: 'History')],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openAddSheet,
        backgroundColor: AppColors.blue,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Request',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildRequestList(
                    _requests.where((r) => r.isPending).toList()),
                _buildRequestList(
                    _requests.where((r) => !r.isPending).toList()),
              ],
            ),
    );
  }

  Widget _buildRequestList(List<TravelRequest> items) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.flight_takeoff,
                size: 56,
                color: AppColors.textGray.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            const Text('No travel requests.',
                style: TextStyle(color: AppColors.textGray)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _buildCard(items[i]),
      ),
    );
  }

  Widget _buildCard(TravelRequest req) {
    Color statusColor;
    switch (req.status) {
      case 'approved':
        statusColor = AppColors.green;
      case 'rejected':
        statusColor = AppColors.primary;
      default:
        statusColor = AppColors.orange;
    }
    final statusLabel =
        req.status[0].toUpperCase() + req.status.substring(1);
    final dateRange =
        '${DateFormat('dd MMM').format(req.departureDate)} – ${DateFormat('dd MMM yyyy').format(req.returnDate)}';

    return Container(
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.flight_takeoff,
                color: AppColors.blue, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(req.destination,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.textDark)),
                const SizedBox(height: 3),
                Text(req.purpose,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textGray),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined,
                        size: 12, color: AppColors.textGray),
                    const SizedBox(width: 4),
                    Text(dateRange,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textGray)),
                    const SizedBox(width: 8),
                    Text('${req.tripDays}d',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textGray)),
                  ],
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
            child: Text(statusLabel,
                style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
