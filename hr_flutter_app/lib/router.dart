import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/leave/leave_screen.dart';
import 'screens/time/time_screen.dart';
import 'screens/more/more_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/shell_screen.dart';

GoRouter createRouter(BuildContext context) {
  final auth = Provider.of<AuthProvider>(context, listen: false);

  return GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      final isAuth = auth.isAuthenticated;
      final isLoginPage = state.matchedLocation == '/login';
      if (!isAuth && !isLoginPage) return '/login';
      if (isAuth && isLoginPage) return '/home';
      return null;
    },
    refreshListenable: auth,
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
          GoRoute(path: '/leave', builder: (_, _) => const LeaveScreen()),
          GoRoute(path: '/time', builder: (_, _) => const TimeScreen()),
          GoRoute(path: '/more', builder: (_, _) => const MoreScreen()),
        ],
      ),
      GoRoute(path: '/settings', builder: (_, _) => const SettingsScreen()),
    ],
    errorBuilder: (context, state) =>
        const Scaffold(body: Center(child: Text('Page not found'))),
  );
}
