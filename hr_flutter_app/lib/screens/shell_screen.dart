import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../widgets/app_colors.dart';

class ShellScreen extends StatelessWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  static const _tabs = [
    _TabItem(Icons.home_filled, Icons.home_outlined, 'Home', '/home'),
    _TabItem(Icons.beach_access, Icons.beach_access_outlined, 'Leave', '/leave'),
    _TabItem(Icons.add_circle, Icons.add_circle_outline, 'Add', '/add'),
    _TabItem(Icons.timer, Icons.timer_outlined, 'Time', '/time'),
    _TabItem(Icons.menu, Icons.menu, 'More', '/more'),
  ];

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/leave')) return 1;
    if (loc.startsWith('/add')) return 2;
    if (loc.startsWith('/time')) return 3;
    if (loc.startsWith('/more')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIdx = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: _tabs.asMap().entries.map((e) {
                final idx = e.key;
                final tab = e.value;
                final selected = idx == currentIdx;
                if (idx == 2) {
                  // Center Add button
                  return GestureDetector(
                    onTap: () => context.go(tab.route),
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add, color: Colors.white, size: 28),
                    ),
                  );
                }
                return GestureDetector(
                  onTap: () => context.go(tab.route),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        selected ? tab.activeIcon : tab.icon,
                        color: selected ? AppColors.blue : AppColors.textGray,
                        size: 26,
                      ),
                      Text(
                        tab.label,
                        style: TextStyle(
                          fontSize: 11,
                          color: selected ? AppColors.blue : AppColors.textGray,
                          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  final IconData activeIcon;
  final IconData icon;
  final String label;
  final String route;
  const _TabItem(this.activeIcon, this.icon, this.label, this.route);
}
