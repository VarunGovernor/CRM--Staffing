// ignore_for_file: avoid_print
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Background message handler — must be top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase is already initialized by the time this runs.
  print('[FCM] Background message: ${message.messageId}');
}

class PushNotificationService {
  static final _messaging = FirebaseMessaging.instance;
  static final _localNotifs = FlutterLocalNotificationsPlugin();

  static const _androidChannel = AndroidNotificationChannel(
    'hr_high_importance',
    'HR Notifications',
    description: 'Leave approvals, reminders and HR alerts',
    importance: Importance.high,
  );

  /// Call once from main() after Firebase.initializeApp().
  static Future<void> init() async {
    // Register background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission (iOS / Android 13+)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    print('[FCM] Permission: ${settings.authorizationStatus}');

    // Set up local notifications plugin
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    await _localNotifs.initialize(
      const InitializationSettings(android: androidInit, iOS: iosInit),
    );

    // Create Android notification channel
    await _localNotifs
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    // iOS foreground display options
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Handle foreground messages with local notification
    FirebaseMessaging.onMessage.listen((message) {
      final notif = message.notification;
      if (notif == null) return;
      _localNotifs.show(
        notif.hashCode,
        notif.title,
        notif.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _androidChannel.id,
            _androidChannel.name,
            channelDescription: _androidChannel.description,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: const DarwinNotificationDetails(),
        ),
      );
    });

    // Save token for this device
    await _saveToken();

    // Refresh token when it rotates
    _messaging.onTokenRefresh.listen(_saveToken);
  }

  static Future<void> _saveToken([String? token]) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    final fcmToken = token ?? await _messaging.getToken();
    if (fcmToken == null) return;

    try {
      await Supabase.instance.client
          .from('user_profiles')
          .update({'fcm_token': fcmToken})
          .eq('id', userId);
      print('[FCM] Token saved for user $userId');
    } catch (e) {
      print('[FCM] Failed to save token: $e');
    }
  }

  /// Call after the user logs in to ensure fresh token is stored.
  static Future<void> onLogin() => _saveToken();

  /// Clear the token from DB on logout so stale devices don't receive notifs.
  static Future<void> onLogout() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      if (Platform.isIOS) await _messaging.deleteToken();
      await Supabase.instance.client
          .from('user_profiles')
          .update({'fcm_token': null})
          .eq('id', userId);
    } catch (_) {}
  }
}
