import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_colors.dart';
import '../../widgets/app_header.dart';
import '../../widgets/segment_selector.dart';
import 'tabs/activities_tab.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/feeds_tab.dart';
import 'tabs/profile_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  int _segmentIndex = 0;
  late TabController _tabController;

  final _tabs = ['Activities', 'Dashboard', 'Feeds', 'Profile', 'Approvals', 'Leave', 'Attendance', 'Time Logs'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
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
              title: 'Home',
              profile: auth.profile,
              notificationCount: 52,
            ),
            SegmentSelector(
              options: const ['My Space', 'Team', 'Organization'],
              selected: _segmentIndex,
              onChanged: (i) => setState(() => _segmentIndex = i),
            ),
            // Tab bar
            TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textGray,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              unselectedLabelStyle: const TextStyle(fontSize: 14),
              indicator: const UnderlineTabIndicator(
                borderSide: BorderSide(color: AppColors.primary, width: 2.5),
              ),
              tabAlignment: TabAlignment.start,
              tabs: _tabs.map((t) => Tab(text: t)).toList(),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: const [
                  ActivitiesTab(),
                  DashboardTab(),
                  FeedsTab(),
                  ProfileTab(),
                  // Placeholders for remaining tabs
                  _PlaceholderTab('Approvals'),
                  _PlaceholderTab('Leave'),
                  _PlaceholderTab('Attendance'),
                  _PlaceholderTab('Time Logs'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  final String name;
  const _PlaceholderTab(this.name);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(name, style: const TextStyle(color: AppColors.textGray, fontSize: 16)),
    );
  }
}
