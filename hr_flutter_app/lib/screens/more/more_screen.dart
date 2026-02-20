import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/app_colors.dart';

class MoreScreen extends StatefulWidget {
  const MoreScreen({super.key});

  @override
  State<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends State<MoreScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  static const _items = [
    {'icon': Icons.beach_access_outlined, 'label': 'Leave Tracker'},
    {'icon': Icons.timer_outlined, 'label': 'Time Tracker'},
    {'icon': Icons.calendar_month_outlined, 'label': 'Attendance'},
    {'icon': Icons.military_tech_outlined, 'label': 'Performance'},
    {'icon': Icons.folder_outlined, 'label': 'Files'},
    {'icon': Icons.flight_outlined, 'label': 'Travel'},
    {'icon': Icons.task_alt_outlined, 'label': 'Tasks'},
    {'icon': Icons.people_outline, 'label': 'Employee Engagement'},
    {'icon': Icons.description_outlined, 'label': 'HR Letters'},
    {'icon': Icons.exit_to_app_outlined, 'label': 'Exit Management'},
    {'icon': Icons.assignment_outlined, 'label': 'Probation'},
    {'icon': Icons.person_search_outlined, 'label': 'Colleague'},
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items.where((item) {
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
                  return ListTile(
                    leading: Icon(item['icon'] as IconData, color: AppColors.textDark, size: 24),
                    title: Text(item['label'] as String,
                        style: const TextStyle(fontSize: 16, color: AppColors.textDark)),
                    onTap: () {},
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
