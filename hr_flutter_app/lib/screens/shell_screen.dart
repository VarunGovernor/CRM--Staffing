import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../widgets/app_colors.dart';
import 'add/apply_leave_sheet.dart';
import 'add/add_regularization_sheet.dart';
import 'add/add_time_log_sheet.dart';
import 'add/add_comp_off_sheet.dart';
import 'add/post_status_sheet.dart';

class ShellScreen extends StatefulWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen>
    with SingleTickerProviderStateMixin {
  bool _menuOpen = false;
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  static const _navTabs = [
    _TabItem(Icons.home_filled, Icons.home_outlined, 'Home', '/home'),
    _TabItem(Icons.beach_access, Icons.beach_access_outlined, 'Leave', '/leave'),
    _TabItem(Icons.timer, Icons.timer_outlined, 'Time', '/time'),
    _TabItem(Icons.menu, Icons.menu, 'More', '/more'),
  ];

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 200));
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/leave')) return 1;
    if (loc.startsWith('/time')) return 2;
    if (loc.startsWith('/more')) return 3;
    return 0;
  }

  void _toggleMenu() {
    setState(() => _menuOpen = !_menuOpen);
    if (_menuOpen) {
      _animCtrl.forward();
    } else {
      _animCtrl.reverse();
    }
  }

  void _closeAndOpen(Widget sheet) {
    setState(() => _menuOpen = false);
    _animCtrl.reverse();
    Future.delayed(const Duration(milliseconds: 150), () {
      if (!mounted) return;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => sheet,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentIdx = _currentIndex(context);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      body: Stack(
        children: [
          widget.child,

          // Dim overlay when menu open
          if (_menuOpen)
            FadeTransition(
              opacity: _fadeAnim,
              child: GestureDetector(
                onTap: _toggleMenu,
                child: Container(color: Colors.black.withOpacity(0.35)),
              ),
            ),

          // Speed dial menu
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            bottom: _menuOpen
                ? (bottomPad + 68 + 12)
                : (bottomPad + 68 - 16),
            left: 20,
            right: 20,
            child: _menuOpen
                ? FadeTransition(
                    opacity: _fadeAnim,
                    child: _SpeedDialMenu(
                      onLeave: () =>
                          _closeAndOpen(const ApplyLeaveSheet()),
                      onRegularize: () =>
                          _closeAndOpen(const AddRegularizationSheet()),
                      onTimeLog: () =>
                          _closeAndOpen(const AddTimeLogSheet()),
                      onCompOff: () =>
                          _closeAndOpen(const AddCompOffSheet()),
                      onStatus: () =>
                          _closeAndOpen(const PostStatusSheet()),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 10,
                offset: const Offset(0, -2))
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              children: [
                // First 2 tabs
                ..._navTabs.sublist(0, 2).asMap().entries.map((e) {
                  final idx = e.key;
                  final tab = e.value;
                  final selected = idx == currentIdx && !_menuOpen;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        if (_menuOpen) _toggleMenu();
                        context.go(tab.route);
                      },
                      child: _NavItem(tab: tab, selected: selected),
                    ),
                  );
                }),

                // Center Add button
                SizedBox(
                  width: 72,
                  child: Center(
                    child: GestureDetector(
                      onTap: _toggleMenu,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: _menuOpen
                              ? const Color(0xFFEF4444)
                              : AppColors.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: (_menuOpen
                                      ? const Color(0xFFEF4444)
                                      : AppColors.primary)
                                  .withOpacity(0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Icon(
                          _menuOpen ? Icons.close : Icons.add,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                  ),
                ),

                // Last 2 tabs
                ..._navTabs.sublist(2).asMap().entries.map((e) {
                  final idx = e.key + 2;
                  final tab = e.value;
                  final selected = idx == currentIdx && !_menuOpen;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        if (_menuOpen) _toggleMenu();
                        context.go(tab.route);
                      },
                      child: _NavItem(tab: tab, selected: selected),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Speed Dial Menu ─────────────────────────────────────────────────────────

class _SpeedDialMenu extends StatelessWidget {
  final VoidCallback onLeave;
  final VoidCallback onRegularize;
  final VoidCallback onTimeLog;
  final VoidCallback onCompOff;
  final VoidCallback onStatus;

  const _SpeedDialMenu({
    required this.onLeave,
    required this.onRegularize,
    required this.onTimeLog,
    required this.onCompOff,
    required this.onStatus,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.14),
              blurRadius: 24,
              offset: const Offset(0, 6))
        ],
      ),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _DialItem(
                icon: Icons.beach_access,
                color: const Color(0xFF9333EA),
                label: 'Leave',
                onTap: onLeave,
              ),
              _DialItem(
                icon: Icons.edit,
                color: const Color(0xFFEF4444),
                label: 'Regularize',
                onTap: onRegularize,
              ),
              _DialItem(
                icon: Icons.access_time_filled,
                color: const Color(0xFF3B82F6),
                label: 'Time Log',
                onTap: onTimeLog,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _DialItem(
                icon: Icons.refresh,
                color: const Color(0xFFF59E0B),
                label: 'Compensatory\nOff',
                onTap: onCompOff,
              ),
              _DialItem(
                icon: Icons.storage_rounded,
                color: const Color(0xFF22C55E),
                label: 'Status',
                onTap: onStatus,
              ),
              const SizedBox(width: 72), // balance empty slot
            ],
          ),
        ],
      ),
    );
  }
}

class _DialItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  const _DialItem(
      {required this.icon,
      required this.color,
      required this.label,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF374151)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Bottom Nav Item ──────────────────────────────────────────────────────────

class _NavItem extends StatelessWidget {
  final _TabItem tab;
  final bool selected;
  const _NavItem({required this.tab, required this.selected});

  @override
  Widget build(BuildContext context) {
    return Column(
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
            fontWeight:
                selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
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
