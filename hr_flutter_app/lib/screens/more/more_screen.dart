import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_colors.dart';

class MoreScreen extends StatefulWidget {
  const MoreScreen({super.key});

  @override
  State<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends State<MoreScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _buildItems(String? role) {
    return [
      {'icon': Icons.beach_access_outlined, 'label': 'Leave Tracker', 'route': '/leave'},
      {'icon': Icons.timer_outlined, 'label': 'Time Tracker', 'route': '/time'},
      {'icon': Icons.calendar_month_outlined, 'label': 'Attendance', 'route': null},
      {'icon': Icons.receipt_long_outlined, 'label': 'Payslips', 'route': '/payslips'},
      {'icon': Icons.folder_outlined, 'label': 'Files', 'route': '/files'},
      {'icon': Icons.flight_outlined, 'label': 'Travel', 'route': '/travel'},
      {'icon': Icons.task_alt_outlined, 'label': 'Tasks', 'route': '/tasks'},
      if (role != null && role != 'employee')
        {'icon': Icons.groups_outlined, 'label': 'Team Dashboard', 'route': '/manager-dashboard'},
      {'icon': Icons.people_outline, 'label': 'Employee Engagement', 'route': null},
      {'icon': Icons.description_outlined, 'label': 'HR Letters', 'route': null},
      {'icon': Icons.exit_to_app_outlined, 'label': 'Exit Management', 'route': null},
      {'icon': Icons.assignment_outlined, 'label': 'Probation', 'route': null},
      {'icon': Icons.person_search_outlined, 'label': 'Colleague', 'route': null},
    ];
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().profile?.role;
    final items = _buildItems(role);
    final filtered = items.where((item) {
      return _query.isEmpty ||
          (item['label'] as String).toLowerCase().contains(_query.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('More',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.settings_outlined),
                    onPressed: () => context.push('/settings'),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _query = v),
                  decoration: const InputDecoration(
                    hintText: 'Search...',
                    prefixIcon: Icon(Icons.search, color: AppColors.textGray),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                itemCount: filtered.length,
                itemBuilder: (_, i) {
                  final item = filtered[i];
                  final route = item['route'] as String?;
                  final hasRoute = route != null;
                  return ListTile(
                    leading: Icon(
                      item['icon'] as IconData,
                      color: hasRoute ? AppColors.textDark : AppColors.textGray,
                      size: 24,
                    ),
                    title: Text(
                      item['label'] as String,
                      style: TextStyle(
                        fontSize: 16,
                        color: hasRoute ? AppColors.textDark : AppColors.textGray,
                      ),
                    ),
                    trailing: hasRoute
                        ? const Icon(Icons.chevron_right,
                            color: AppColors.textGray, size: 20)
                        : Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.textGray.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text('Soon',
                                style: TextStyle(
                                    fontSize: 10, color: AppColors.textGray)),
                          ),
                    onTap: hasRoute ? () => context.push(route) : null,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
