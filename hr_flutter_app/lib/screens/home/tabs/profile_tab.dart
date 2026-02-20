import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../widgets/app_colors.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<AuthProvider>().profile;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (profile == null)
            const Center(child: CircularProgressIndicator())
          else ...[
            _Section('About', [
              _InfoRow('Designation', profile.role.toUpperCase()),
              _InfoRow('Email', profile.email),
              if (profile.phone != null) _InfoRow('Mobile', profile.phone!),
            ]),
            const SizedBox(height: 16),
            _Section('Basic Information', [
              _InfoRow('Employee ID', profile.id.substring(0, 8).toUpperCase()),
              _InfoRow('Full Name', profile.fullName),
              _InfoRow('Role', profile.role.toUpperCase()),
            ]),
            const SizedBox(height: 16),
            _Section('Hierarchy', [
              _InfoRow('Reporting To',
                  profile.reportsTo != null && profile.reportsTo!.isNotEmpty
                      ? profile.reportsTo!
                      : 'Not Assigned'),
            ]),
          ],
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section(this.title, this.children);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textGray, fontSize: 13)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
