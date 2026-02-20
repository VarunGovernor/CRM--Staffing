class UserProfile {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? avatarUrl;
  final String? phone;
  final String? reportsTo;
  final bool isActive;
  // Extended fields (pulled from Supabase when available)
  final String? employeeId;
  final String? department;
  final String? location;
  final String? shift;
  final String? gender;
  final String? dateOfBirth;
  final String? dateOfJoining;
  // Editable personal fields
  final String? nickname;
  final String? experienceType;
  final String? maritalStatus;
  final String? aboutMe;
  final String? bloodGroup;
  final String? expertise;
  final String? workPermit;

  UserProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.avatarUrl,
    this.phone,
    this.reportsTo,
    this.isActive = true,
    this.employeeId,
    this.department,
    this.location,
    this.shift,
    this.gender,
    this.dateOfBirth,
    this.dateOfJoining,
    this.nickname,
    this.experienceType,
    this.maritalStatus,
    this.aboutMe,
    this.bloodGroup,
    this.expertise,
    this.workPermit,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'employee',
      avatarUrl: json['avatar_url'],
      phone: json['phone'],
      reportsTo: json['reports_to'],
      isActive: json['is_active'] ?? true,
      employeeId: json['employee_id'],
      department: json['department'],
      location: json['location'],
      shift: json['shift'],
      gender: json['gender'],
      dateOfBirth: json['date_of_birth'],
      dateOfJoining: json['date_of_joining'],
      nickname: json['nickname'],
      experienceType: json['experience_type'],
      maritalStatus: json['marital_status'],
      aboutMe: json['about_me'],
      bloodGroup: json['blood_group'],
      expertise: json['expertise'],
      workPermit: json['work_permit'],
    );
  }

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return fullName.isNotEmpty ? fullName[0].toUpperCase() : 'U';
  }
}
