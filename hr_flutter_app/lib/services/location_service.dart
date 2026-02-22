import 'package:geolocator/geolocator.dart';

/// Update these coordinates to your actual office GPS location.
const double kOfficeLatitude = 17.3850;
const double kOfficeLongitude = 78.4867;
const double kOfficeRadiusMeters = 500;

class LocationService {
  /// Request location permission. Returns the resulting permission status.
  Future<LocationPermission> requestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return LocationPermission.denied;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission;
  }

  /// Returns the current device position, or null if unavailable.
  Future<Position?> getCurrentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  /// Distance from [pos] to the configured office in metres.
  double distanceFromOffice(Position pos) {
    return Geolocator.distanceBetween(
      pos.latitude,
      pos.longitude,
      kOfficeLatitude,
      kOfficeLongitude,
    );
  }

  /// True if [pos] is within [kOfficeRadiusMeters] of the office.
  bool isWithinOffice(Position pos) {
    return distanceFromOffice(pos) <= kOfficeRadiusMeters;
  }
}
