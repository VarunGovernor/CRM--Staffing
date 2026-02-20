import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_colors.dart';
import '../../widgets/app_header.dart';
import '../../widgets/segment_selector.dart';
import 'tabs/leave_summary_tab.dart';
import 'tabs/leave_balance_tab.dart';
import 'tabs/leave_requests_tab.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> with SingleTickerProviderStateMixin {
  int _segmentIndex = 0;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            AppHeader(
              title: 'Leave Tracker',
              profile: auth.profile,
              showSearch: false,
              showNotification: false,
              actions: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AppColors.blue,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 8),
              ],
            ),
            SegmentSelector(
              options: const ['My Data', 'Holidays'],
              selected: _segmentIndex,
              onChanged: (i) => setState(() => _segmentIndex = i),
            ),
            TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textGray,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              indicator: const UnderlineTabIndicator(
                borderSide: BorderSide(color: AppColors.primary, width: 2.5),
              ),
              tabs: const [
                Tab(text: 'Leave Summary'),
                Tab(text: 'Leave Balance'),
                Tab(text: 'Leave Requests'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: const [
                  LeaveSummaryTab(),
                  LeaveBalanceTab(),
                  LeaveRequestsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
