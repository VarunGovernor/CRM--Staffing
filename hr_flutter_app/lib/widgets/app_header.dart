import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/user_profile.dart';
import 'app_colors.dart';

class AppHeader extends StatelessWidget {
  final String title;
  final UserProfile? profile;
  final int notificationCount;
  final List<Widget>? actions;
  final bool showSearch;
  final bool showNotification;

  const AppHeader({
    super.key,
    required this.title,
    this.profile,
    this.notificationCount = 0,
    this.actions,
    this.showSearch = true,
    this.showNotification = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          _buildAvatar(),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ),
          if (actions != null) ...actions!,
          if (showSearch) ...[
            IconButton(
              icon: const Icon(Icons.search, color: AppColors.textDark),
              onPressed: () {},
            ),
          ],
          if (showNotification) ...[
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined, color: AppColors.textDark),
                  onPressed: () {},
                ),
                if (notificationCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        notificationCount > 99 ? '99+' : '$notificationCount',
                        style: const TextStyle(color: Colors.white, fontSize: 9),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    if (profile?.avatarUrl != null && profile!.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 20,
        backgroundImage: CachedNetworkImageProvider(profile!.avatarUrl!),
      );
    }
    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.blue,
      child: Text(
        profile?.initials ?? 'U',
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      ),
    );
  }
}
