import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_colors.dart';
import '../profile/profile_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _shakeForFeedback = true;
  bool _disableHaptic = false;
  DateTime _lastSynced = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final profile = auth.profile;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back_ios_new,
                      color: AppColors.textDark,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Settings',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.power_settings_new,
                      color: Colors.redAccent,
                    ),
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Sign Out'),
                          content: const Text(
                            'Are you sure you want to sign out?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text(
                                'Sign Out',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true && context.mounted) {
                        await auth.signOut();
                      }
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Profile card
                  _Card(
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor: AppColors.blue,
                            child: Text(
                              profile?.initials ?? 'U',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile?.fullName ?? '',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  'User Id : ${profile?.id.substring(0, 12).toUpperCase() ?? ''}',
                                  style: const TextStyle(
                                    color: AppColors.textGray,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  profile?.email ?? '',
                                  style: const TextStyle(
                                    color: AppColors.textGray,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ProfileScreen(),
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                            elevation: 0,
                          ),
                          child: const Text('View Profile'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Organization
                  _Card(
                    children: [
                      _SectionHeader(
                        Icons.business,
                        const Color(0xFF38BDF8),
                        'Organization',
                      ),
                      const SizedBox(height: 8),
                      _NavRow('San Synapse Private Limited'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Language
                  _Card(
                    children: [
                      _SectionHeader(
                        Icons.translate,
                        const Color(0xFFF59E0B),
                        'Language',
                      ),
                      const SizedBox(height: 8),
                      _NavRow('English'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Privacy & Security
                  _Card(
                    children: [
                      _SectionHeader(
                        Icons.lock_outline,
                        const Color(0xFFEF4444),
                        'Privacy & Security',
                      ),
                      const SizedBox(height: 8),
                      _NavRow('App Lock'),
                      _NavRow('Privacy Preferences'),
                      _PlainRow('Privacy Policy'),
                      _PlainRow('Terms of Service'),
                      _NavRow('Call Identification'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // About
                  _Card(
                    children: [
                      _SectionHeader(
                        Icons.info_outline,
                        AppColors.blue,
                        'About',
                      ),
                      const SizedBox(height: 8),
                      _NavRow('About Us (1.0.0)'),
                      _NavRow('Take A Tour'),
                      _PlainRow('Rate Us'),
                      _PlainRow('Feedback'),
                      _ToggleRow(
                        'Shake for feedback',
                        _shakeForFeedback,
                        (v) => setState(() => _shakeForFeedback = v),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Others
                  _Card(
                    children: [
                      _SectionHeader(
                        Icons.more_horiz,
                        const Color(0xFF22C55E),
                        'Others',
                      ),
                      const SizedBox(height: 8),
                      _NavRow('Siri Shortcuts'),
                      _NavRow('More Apps'),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Sync Employee Data',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                                  Text(
                                    'Last Synced Time: ${_lastSynced.day}-${_monthName(_lastSynced.month)}-${_lastSynced.year} ${_lastSynced.hour.toString().padLeft(2, '0')}:${_lastSynced.minute.toString().padLeft(2, '0')}:${_lastSynced.second.toString().padLeft(2, '0')}',
                                    style: const TextStyle(
                                      color: AppColors.textGray,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            OutlinedButton(
                              onPressed: () =>
                                  setState(() => _lastSynced = DateTime.now()),
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                side: const BorderSide(color: AppColors.green),
                                foregroundColor: AppColors.green,
                              ),
                              child: const Text('Sync'),
                            ),
                          ],
                        ),
                      ),
                      _PlainRow('Reset App Cache'),
                      _ToggleRow(
                        'Disable Haptic Feedback',
                        _disableHaptic,
                        (v) => setState(() => _disableHaptic = v),
                      ),
                      _NavRow('Manage Account'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Sign Out
                  GestureDetector(
                    onTap: () => auth.signOut(),
                    child: const Padding(
                      padding: EdgeInsets.only(left: 4, bottom: 24),
                      child: Text(
                        'Sign Out',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _monthName(int m) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[m - 1];
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  const _SectionHeader(this.icon, this.color, this.title);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ],
    );
  }
}

class _NavRow extends StatelessWidget {
  final String label;
  const _NavRow(this.label);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: const TextStyle(fontSize: 15)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textGray),
      dense: true,
      onTap: () {},
    );
  }
}

class _PlainRow extends StatelessWidget {
  final String label;
  const _PlainRow(this.label);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: const TextStyle(fontSize: 15)),
      dense: true,
      onTap: () {},
    );
  }
}

class _ToggleRow extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleRow(this.label, this.value, this.onChanged);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: const TextStyle(fontSize: 15)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeThumbColor: AppColors.green,
      ),
      dense: true,
    );
  }
}
