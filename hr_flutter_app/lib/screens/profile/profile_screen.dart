import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../models/user_profile.dart';
import '../../providers/auth_provider.dart';
import '../../services/profile_service.dart';
import '../../widgets/app_colors.dart';

const _kIndigo = Color(0xFF4F46E5);
const _kAvatarRadius = 48.0;

class ProfileScreen extends StatefulWidget {
  /// Pass a [viewProfile] to show a peer's profile in read-only mode.
  /// Leave null to show the logged-in user's own profile.
  final UserProfile? viewProfile;
  const ProfileScreen({super.key, this.viewProfile});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showEditSheet() {
    final profile = context.read<AuthProvider>().profile;
    if (profile == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EditProfileSheet(profile: profile),
    );
  }

  Future<void> _pickAndUpload() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 16),
              const Text('Update Profile Photo',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              _SheetOption(Icons.camera_alt_outlined, 'Take Photo',
                  () => Navigator.pop(context, ImageSource.camera)),
              const SizedBox(height: 8),
              _SheetOption(Icons.photo_library_outlined, 'Choose from Gallery',
                  () => Navigator.pop(context, ImageSource.gallery)),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
    if (source == null || !mounted) return;

    final img = await ImagePicker().pickImage(
        source: source, maxWidth: 512, maxHeight: 512, imageQuality: 80);
    if (img == null || !mounted) return;

    setState(() => _uploading = true);
    try {
      await context.read<AuthProvider>().updateAvatar(img.path);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Profile photo updated'),
          backgroundColor: Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Upload failed: $e'),
            behavior: SnackBarBehavior.floating));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // If viewProfile is provided we're in peer-view (read-only) mode
    final isOwner = widget.viewProfile == null;
    final ownProfile = context.watch<AuthProvider>().profile;
    final profile = widget.viewProfile ?? ownProfile;
    final topPad = MediaQuery.of(context).padding.top;
    final coverHeight = topPad + kToolbarHeight + 80.0;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.background,
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                size: 20, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
              onPressed: () {},
            ),
          ],
        ),
        body: profile == null
            ? const Center(child: CircularProgressIndicator())
            : NestedScrollView(
                headerSliverBuilder: (ctx, _) => [
                  SliverToBoxAdapter(
                    child: _HeroSection(
                      profile: profile,
                      coverHeight: coverHeight,
                      uploading: _uploading,
                      onUpload: isOwner ? _pickAndUpload : null,
                      onEdit: isOwner ? _showEditSheet : null,
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _TabBarDelegate(
                      TabBar(
                        controller: _tabController,
                        labelColor: _kIndigo,
                        unselectedLabelColor: AppColors.textGray,
                        indicatorColor: _kIndigo,
                        indicatorWeight: 3,
                        indicatorSize: TabBarIndicatorSize.label,
                        labelStyle: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14),
                        unselectedLabelStyle: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w500),
                        tabs: const [
                          Tab(text: 'My Profile'),
                          Tab(text: 'Peers'),
                          Tab(text: 'Related Data'),
                        ],
                      ),
                    ),
                  ),
                ],
                body: TabBarView(
                  controller: _tabController,
                  children: [
                    _MyProfileTab(profile: profile),
                    _PeersTab(currentUserId: profile.id),
                    const _RelatedDataTab(),
                  ],
                ),
              ),
      ),
    );
  }
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  final UserProfile profile;
  final double coverHeight;
  final bool uploading;
  // null when viewing a peer (read-only, no upload)
  final VoidCallback? onUpload;
  final VoidCallback? onEdit;

  const _HeroSection({
    required this.profile,
    required this.coverHeight,
    required this.uploading,
    this.onUpload,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    // Outer Stack: gradient + white panel as background layers,
    // avatar positioned on top spanning both — so it isn't clipped by either.
    return Stack(
      alignment: Alignment.topCenter,
      children: [
        // ── Background layers (gradient then white) ────────────────────
        Column(
          children: [
            // Gradient cover
            Container(
              width: double.infinity,
              height: coverHeight,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF3730A3), _kIndigo, Color(0xFF6366F1)],
                ),
              ),
              child: CustomPaint(painter: _DotPainter()),
            ),
            // White info panel — top padding makes room for the avatar
            Container(
              color: Colors.white,
              width: double.infinity,
              padding: EdgeInsets.only(
                top: _kAvatarRadius + 14,
                left: 20,
                right: 20,
                bottom: 18,
              ),
              child: Column(
                children: [
                  Text(
                    profile.fullName,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                      letterSpacing: -0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: _kIndigo.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: _kIndigo.withValues(alpha: 0.25)),
                    ),
                    child: Text(
                      profile.role.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _kIndigo,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 16,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [
                      if (profile.department != null)
                        _Chip(Icons.business_outlined, profile.department!),
                      _Chip(Icons.location_on_outlined,
                          profile.location ?? 'Hyderabad'),
                      _Chip(Icons.badge_outlined,
                          profile.employeeId ?? 'SS015'),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _Btn(icon: Icons.share_outlined, label: 'Share',
                          onTap: () {}),
                      if (onEdit != null) ...[
                        const SizedBox(width: 10),
                        _Btn(icon: Icons.edit_outlined, label: 'Edit',
                            onTap: onEdit!, primary: true),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),

        // ── Avatar — painted on top of both layers ─────────────────────
        Positioned(
          top: coverHeight - _kAvatarRadius,
          child: GestureDetector(
            onTap: onUpload,
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      )
                    ],
                  ),
                  child: _avatar(profile),
                ),
                // Camera badge only shown for own profile
                if (onUpload != null)
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: Container(
                      width: 26, height: 26,
                      decoration: BoxDecoration(
                        color: _kIndigo,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: uploading
                          ? const Padding(
                              padding: EdgeInsets.all(5),
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.camera_alt_rounded,
                              color: Colors.white, size: 13),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _avatar(UserProfile p) {
    if (p.avatarUrl != null && p.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: _kAvatarRadius,
        backgroundImage: CachedNetworkImageProvider(p.avatarUrl!),
      );
    }
    return CircleAvatar(
      radius: _kAvatarRadius,
      backgroundColor: _kIndigo,
      child: Text(p.initials,
          style: const TextStyle(
              color: Colors.white, fontSize: 30, fontWeight: FontWeight.bold)),
    );
  }
}

class _DotPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = Colors.white.withValues(alpha: 0.07);
    for (double x = 0; x < size.width; x += 26) {
      for (double y = 0; y < size.height; y += 26) {
        canvas.drawCircle(Offset(x, y), 1.5, p);
      }
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip(this.icon, this.label);
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.textGray),
        const SizedBox(width: 4),
        Text(label,
            style: const TextStyle(
                fontSize: 13, color: AppColors.textGray)),
      ],
    );
  }
}

class _Btn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool primary;
  const _Btn(
      {required this.icon,
      required this.label,
      required this.onTap,
      this.primary = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
        decoration: BoxDecoration(
          color: primary ? _kIndigo : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
              color: primary ? _kIndigo : const Color(0xFFE2E8F0)),
          boxShadow: primary
              ? []
              : [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 4,
                      offset: const Offset(0, 2))
                ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 15,
                color: primary ? Colors.white : AppColors.textGray),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: primary ? Colors.white : AppColors.textDark)),
          ],
        ),
      ),
    );
  }
}

class _SheetOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SheetOption(this.icon, this.label, this.onTap);
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Icon(icon, color: _kIndigo, size: 22),
            const SizedBox(width: 14),
            Text(label,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

// ─── My Profile Tab ───────────────────────────────────────────────────────────

class _MyProfileTab extends StatelessWidget {
  final UserProfile profile;
  const _MyProfileTab({required this.profile});

  @override
  Widget build(BuildContext context) {
    final empId = profile.employeeId ?? 'SS015';
    final parts = profile.fullName.trim().split(' ');
    final firstName =
        parts.length >= 2 ? parts.sublist(0, parts.length - 1).join(' ') : profile.fullName;
    final lastName = parts.length >= 2 ? parts.last : '-';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Section('About', Icons.person_outline_rounded, [
            _Row2(
              _Field('Designation', profile.role.toUpperCase()),
              _Field('Employee ID', empId),
            ),
            _Field('Email Address', profile.email, link: true),
            if (profile.phone?.isNotEmpty == true)
              _Field('Mobile', profile.phone!),
          ]),
          _Section('Availability', Icons.schedule_rounded, [
            _Row2(
              _Field('Shift', profile.shift ?? 'Evening'),
              _Field('Location', profile.location ?? 'Hyderabad'),
            ),
            _Field('Time Zone', 'India Standard Time (GMT+05:30)'),
          ]),
          _Section('Personal Details', Icons.badge_outlined, [
            _Row2(
              _Field('First Name', firstName),
              _Field('Last Name', lastName),
            ),
            if (profile.nickname?.isNotEmpty == true)
              _Field('Nickname', profile.nickname!),
            _Row2(
              _Field('Gender', profile.gender ?? '-'),
              _Field('Date of Birth', profile.dateOfBirth ?? '-'),
            ),
            _Row2(
              _Field('Age', _age(profile.dateOfBirth)),
              _Field('Marital Status', profile.maritalStatus ?? '-'),
            ),
            _Row2(
              _Field('Blood Group', profile.bloodGroup ?? '-'),
              _Field('Work Permit', profile.workPermit ?? '-'),
            ),
            if (profile.aboutMe?.isNotEmpty == true)
              _Field('About Me', profile.aboutMe!),
            if (profile.expertise?.isNotEmpty == true)
              _Field('Ask me about', profile.expertise!),
            if (profile.experienceType?.isNotEmpty == true)
              _Field('Experience Type', profile.experienceType!),
          ]),
          _Section('Work Information', Icons.work_outline_rounded, [
            _Row2(
              _Field('Department',
                  profile.department ?? 'Sales Operation'),
              _Field('Status', 'Active'),
            ),
            _Row2(
              _Field('Date of Joining', profile.dateOfJoining ?? '-'),
              _Field('Employment Type', 'Permanent'),
            ),
            _Row2(
              _Field('Experience', _exp(profile.dateOfJoining)),
              _Field('Notice Period', '90 days'),
            ),
            _Row2(
              _Field('Source of Hire', 'ACE'),
              _Field('Probation', 'Confirmed'),
            ),
          ]),
          if (profile.reportsTo?.isNotEmpty == true)
            _Section('Reporting To', Icons.account_tree_outlined, [
              _ReportingCard(name: profile.reportsTo!),
            ]),
          _Section('Contact Details', Icons.contact_phone_outlined, [
            _Field('Work Email', profile.email, link: true),
            if (profile.phone?.isNotEmpty == true)
              _Field('Personal Mobile', profile.phone!, link: true),
            _Field('Present Address', '-'),
            _Field('Permanent Address', '-'),
          ]),
        ],
      ),
    );
  }

  String _age(String? dob) {
    if (dob == null || dob == '-') return '-';
    try {
      final p = dob.split('-');
      if (p.length == 3) {
        const m = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,
                   'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12};
        final b = DateTime(int.parse(p[2]), m[p[1]]??1, int.parse(p[0]));
        final n = DateTime.now();
        int y = n.year - b.year, mo = n.month - b.month;
        if (mo < 0) { y--; mo += 12; }
        return '$y yr $mo mo';
      }
    } catch (_) {}
    return '-';
  }

  String _exp(String? doj) {
    if (doj == null || doj == '-') return '-';
    try {
      final p = doj.split('-');
      if (p.length == 3) {
        const m = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,
                   'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12};
        final j = DateTime(int.parse(p[2]), m[p[1]]??1, int.parse(p[0]));
        final n = DateTime.now();
        int y = n.year - j.year, mo = n.month - j.month;
        if (mo < 0) { y--; mo += 12; }
        return '$y yr $mo mo';
      }
    } catch (_) {}
    return '-';
  }
}

// ─── Peers Tab ────────────────────────────────────────────────────────────────

class _PeersTab extends StatefulWidget {
  final String currentUserId;
  const _PeersTab({required this.currentUserId});
  @override
  State<_PeersTab> createState() => _PeersTabState();
}

class _PeersTabState extends State<_PeersTab> {
  final _svc = ProfileService();
  List<UserProfile> _all = [], _filtered = [];
  bool _loading = true;
  final _q = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
    _q.addListener(() {
      final s = _q.text.toLowerCase();
      setState(() => _filtered = s.isEmpty
          ? _all
          : _all.where((p) =>
              p.fullName.toLowerCase().contains(s) ||
              p.role.toLowerCase().contains(s)).toList());
    });
  }

  @override
  void dispose() { _q.dispose(); super.dispose(); }

  Future<void> _load() async {
    try {
      final list = await _svc.getActiveProfiles(excludeId: widget.currentUserId);
      if (mounted) setState(() { _all = list; _filtered = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 8, offset: const Offset(0, 2))
            ],
          ),
          child: TextField(
            controller: _q,
            decoration: InputDecoration(
              hintText: 'Search by name or role…',
              hintStyle: TextStyle(
                  color: AppColors.textGray.withValues(alpha: 0.6)),
              prefixIcon: const Icon(Icons.search_rounded,
                  color: AppColors.textGray),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 14),
            ),
          ),
        ),
      ),
      Expanded(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.people_outline_rounded,
                            size: 56, color: Colors.grey[300]),
                        const SizedBox(height: 12),
                        const Text('No peers found',
                            style: TextStyle(color: AppColors.textGray)),
                      ],
                    ))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) => _PeerCard(profile: _filtered[i]),
                  ),
      ),
    ]);
  }
}

class _PeerCard extends StatelessWidget {
  final UserProfile profile;
  const _PeerCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ProfileScreen(viewProfile: profile),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 6, offset: const Offset(0, 2))
          ],
        ),
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          leading: _buildAvatar(),
          title: Text(profile.fullName,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 14)),
          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox(height: 2),
            Text(profile.role.toUpperCase(),
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textGray,
                    fontWeight: FontWeight.w500)),
            const SizedBox(height: 3),
            Row(children: [
              Container(width: 6, height: 6,
                  decoration: const BoxDecoration(
                      color: Color(0xFF22C55E), shape: BoxShape.circle)),
              const SizedBox(width: 4),
              const Text('Active',
                  style: TextStyle(color: Color(0xFF22C55E),
                      fontSize: 12, fontWeight: FontWeight.w600)),
            ]),
          ]),
          trailing: const Icon(Icons.chevron_right_rounded,
              color: AppColors.textGray, size: 20),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (profile.avatarUrl?.isNotEmpty == true) {
      return CircleAvatar(radius: 26,
          backgroundImage: CachedNetworkImageProvider(profile.avatarUrl!));
    }
    const colors = [_kIndigo, AppColors.blue, Color(0xFF059669),
                    AppColors.orange, AppColors.primary];
    return CircleAvatar(
      radius: 26,
      backgroundColor: colors[profile.fullName.length % colors.length],
      child: Text(profile.initials,
          style: const TextStyle(color: Colors.white,
              fontWeight: FontWeight.bold, fontSize: 14)),
    );
  }
}

// ─── Related Data Tab ─────────────────────────────────────────────────────────

class _RelatedDataTab extends StatelessWidget {
  const _RelatedDataTab();

  static const _tiles = [
    (label: 'Leave',          icon: Icons.beach_access_rounded,  color: Color(0xFF7C3AED), bg: Color(0xFFF3EEFF)),
    (label: 'Time Logs',      icon: Icons.timer_outlined,        color: Color(0xFF0284C7), bg: Color(0xFFE0F2FE)),
    (label: 'Timesheets',     icon: Icons.assignment_outlined,   color: Color(0xFF0891B2), bg: Color(0xFFE0F9FF)),
    (label: 'Jobs',           icon: Icons.work_outline_rounded,  color: Color(0xFF059669), bg: Color(0xFFD1FAE5)),
    (label: 'Feedback',       icon: Icons.star_outline_rounded,  color: Color(0xFFD97706), bg: Color(0xFFFEF3C7)),
    (label: 'Travel Expense', icon: Icons.receipt_long_outlined, color: Color(0xFFDC2626), bg: Color(0xFFFEE2E2)),
    (label: 'Travel Request', icon: Icons.flight_outlined,       color: Color(0xFF7C3AED), bg: Color(0xFFF3EEFF)),
  ];

  void _onTap(BuildContext context, String label) {
    final t = _tiles.firstWhere((e) => e.label == label);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RelatedItemSheet(
        title: t.label,
        icon: t.icon,
        color: t.color,
        bgColor: t.bg,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3, childAspectRatio: 0.9,
          crossAxisSpacing: 12, mainAxisSpacing: 12),
      itemCount: _tiles.length,
      itemBuilder: (_, i) {
        final t = _tiles[i];
        return GestureDetector(
          onTap: () => _onTap(context, t.label),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 6, offset: const Offset(0, 2))
              ],
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                    color: t.bg, borderRadius: BorderRadius.circular(14)),
                child: Icon(t.icon, color: t.color, size: 26),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text(t.label,
                    textAlign: TextAlign.center, maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textDark)),
              ),
            ]),
          ),
        );
      },
    );
  }
}

// ─── Shared Widgets ───────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;
  const _Section(this.title, this.icon, this.children);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8, offset: const Offset(0, 2))
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
          decoration: const BoxDecoration(
            border: Border(
                bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1.5)),
          ),
          child: Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: _kIndigo.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 17, color: _kIndigo),
            ),
            const SizedBox(width: 10),
            Text(title,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14,
                    color: AppColors.textDark)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              children: children),
        ),
      ]),
    );
  }
}

class _Row2 extends StatelessWidget {
  final Widget left, right;
  const _Row2(this.left, this.right);
  @override
  Widget build(BuildContext context) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: left),
      const SizedBox(width: 12),
      Expanded(child: right),
    ]);
  }
}

class _Field extends StatelessWidget {
  final String label, value;
  final bool link;
  const _Field(this.label, this.value, {this.link = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500,
                color: AppColors.textGray, letterSpacing: 0.2)),
        const SizedBox(height: 3),
        GestureDetector(
          onTap: link && value != '-'
              ? () => Clipboard.setData(ClipboardData(text: value))
              : null,
          child: Text(value.isEmpty ? '-' : value,
              style: TextStyle(
                  fontWeight: FontWeight.w600, fontSize: 13,
                  color: link && value != '-' ? _kIndigo : AppColors.textDark)),
        ),
      ]),
    );
  }
}

class _ReportingCard extends StatelessWidget {
  final String name;
  const _ReportingCard({required this.name});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: _kIndigo.withValues(alpha: 0.15),
          child: const Icon(Icons.person, color: _kIndigo, size: 24),
        ),
        const SizedBox(width: 12),
        Text(name,
            style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14)),
      ]),
    );
  }
}

// ─── Edit Profile Sheet ───────────────────────────────────────────────────────

class _EditProfileSheet extends StatefulWidget {
  final UserProfile profile;
  const _EditProfileSheet({required this.profile});

  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  // Text controllers
  late final TextEditingController _nicknameCtrl;
  late final TextEditingController _dobCtrl;
  late final TextEditingController _aboutCtrl;
  late final TextEditingController _expertiseCtrl;
  late final TextEditingController _mobileCtrl;
  late final TextEditingController _departmentCtrl;
  late final TextEditingController _locationCtrl;

  // Dropdown values
  String? _gender;
  String? _experienceType;
  String? _maritalStatus;
  String? _bloodGroup;
  String? _workPermit;
  String? _shift;

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _nicknameCtrl     = TextEditingController(text: p.nickname ?? '');
    _dobCtrl          = TextEditingController(text: p.dateOfBirth ?? '');
    _aboutCtrl        = TextEditingController(text: p.aboutMe ?? '');
    _expertiseCtrl    = TextEditingController(text: p.expertise ?? '');
    _mobileCtrl       = TextEditingController(text: p.phone ?? '');
    _departmentCtrl   = TextEditingController(text: p.department ?? '');
    _locationCtrl     = TextEditingController(text: p.location ?? '');
    _gender           = p.gender;
    _experienceType   = p.experienceType;
    _maritalStatus    = p.maritalStatus;
    _bloodGroup       = p.bloodGroup;
    _workPermit       = p.workPermit;
    _shift            = p.shift;
  }

  @override
  void dispose() {
    _nicknameCtrl.dispose();
    _dobCtrl.dispose();
    _aboutCtrl.dispose();
    _expertiseCtrl.dispose();
    _mobileCtrl.dispose();
    _departmentCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  String _calcAge(String dob) {
    if (dob.isEmpty) return '';
    try {
      final d = DateTime.tryParse(dob);
      if (d != null) {
        final n = DateTime.now();
        int y = n.year - d.year;
        if (n.month < d.month || (n.month == d.month && n.day < d.day)) y--;
        return '$y yrs';
      }
    } catch (_) {}
    return '';
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = DateTime.tryParse(_dobCtrl.text) ?? DateTime(now.year - 25);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1940),
      lastDate: now,
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: _kIndigo),
        ),
        child: child!,
      ),
    );
    if (picked != null && mounted) {
      setState(() {
        _dobCtrl.text =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    try {
      final auth = context.read<AuthProvider>();
      await ProfileService().updateProfile(auth.profile!.id, {
        'nickname':        _nicknameCtrl.text.trim(),
        'gender':          _gender,
        'experience_type': _experienceType,
        'date_of_birth':   _dobCtrl.text.trim(),
        'marital_status':  _maritalStatus,
        'about_me':        _aboutCtrl.text.trim(),
        'blood_group':     _bloodGroup,
        'expertise':       _expertiseCtrl.text.trim(),
        'work_permit':     _workPermit,
        'phone':           _mobileCtrl.text.trim(),
        'department':      _departmentCtrl.text.trim(),
        'location':        _locationCtrl.text.trim(),
        'shift':           _shift,
      });
      await auth.refreshProfile();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Profile updated successfully'),
          backgroundColor: Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to save: $e'),
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final h = MediaQuery.of(context).size.height;
    final age = _calcAge(_dobCtrl.text);

    return Container(
      height: h * 0.93,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // ── Handle
          const SizedBox(height: 12),
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // ── Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 16, 10),
            child: Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: _kIndigo.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.edit_outlined, color: _kIndigo, size: 19),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text('Edit Profile',
                    style: TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w700,
                        color: AppColors.textDark)),
              ),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.close_rounded,
                      size: 18, color: AppColors.textGray),
                ),
              ),
            ]),
          ),
          Container(height: 1, color: const Color(0xFFE2E8F0)),

          // ── Scrollable form
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // ── Section: Basic Details
                  _editSectionHeader('Basic Details', Icons.person_outline_rounded),
                  _editCard([
                    _buildLabel('Gender'),
                    const SizedBox(height: 8),
                    _genderChips(),
                    const SizedBox(height: 16),
                    _textField('Nickname', _nicknameCtrl,
                        hint: 'e.g. Alex', icon: Icons.tag_rounded),
                    _dropdownField('Experience Type', _experienceType,
                        ['Fresher', '1–2 Years', '3–5 Years', '5–8 Years', '8+ Years'],
                        (v) => setState(() => _experienceType = v)),
                  ]),

                  // ── Section: Personal Details
                  _editSectionHeader('Personal Details', Icons.badge_outlined),
                  _editCard([
                    _dobField(age),
                    _dropdownField('Marital Status', _maritalStatus,
                        ['Single', 'Married', 'Divorced', 'Widowed'],
                        (v) => setState(() => _maritalStatus = v)),
                    _textField('About Me', _aboutCtrl,
                        hint: 'Write a short bio…',
                        icon: Icons.notes_rounded, maxLines: 3),
                    _dropdownField('Blood Group', _bloodGroup,
                        ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'],
                        (v) => setState(() => _bloodGroup = v)),
                    _textField('Ask me about / Expertise', _expertiseCtrl,
                        hint: 'e.g. Recruitment, HR Policy',
                        icon: Icons.lightbulb_outline_rounded),
                    _dropdownField('Work Permit', _workPermit,
                        ['Indian Citizen', 'Work Visa', 'Permanent Resident', 'Other'],
                        (v) => setState(() => _workPermit = v)),
                  ]),

                  // ── Section: Contact
                  _editSectionHeader('Contact', Icons.phone_outlined),
                  _editCard([
                    _textField('Mobile Number', _mobileCtrl,
                        hint: '+91 9876543210',
                        icon: Icons.smartphone_rounded,
                        keyboard: TextInputType.phone),
                  ]),

                  // ── Section: Work Information
                  _editSectionHeader('Work Information', Icons.work_outline_rounded),
                  _editCard([
                    _textField('Department', _departmentCtrl,
                        hint: 'e.g. Sales Operations',
                        icon: Icons.business_outlined),
                    _textField('Location', _locationCtrl,
                        hint: 'e.g. Hyderabad',
                        icon: Icons.location_on_outlined),
                    _dropdownField('Shift', _shift,
                        ['Morning', 'Evening', 'Night', 'General'],
                        (v) => setState(() => _shift = v)),
                  ]),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),

          // ── Bottom buttons
          Container(
            color: Colors.white,
            padding: EdgeInsets.fromLTRB(
                16, 12, 16, MediaQuery.of(context).padding.bottom + 16),
            child: Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: const Text('Cancel',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: _saving ? null : _submit,
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF16A34A),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: _saving
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5))
                        : const Text('Submit',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  // ── Helper builders ──────────────────────────────────────────────────────────

  Widget _editSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 0, 10),
      child: Row(children: [
        Icon(icon, size: 16, color: _kIndigo),
        const SizedBox(width: 7),
        Text(title,
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w700,
                color: _kIndigo, letterSpacing: 0.4)),
      ]),
    );
  }

  Widget _editCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8, offset: const Offset(0, 2))
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }

  Widget _buildLabel(String label) {
    return Text(label,
        style: const TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: AppColors.textGray, letterSpacing: 0.2));
  }

  Widget _genderChips() {
    const opts = ['Male', 'Female', 'Other', 'Prefer not to say'];
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: opts.map((o) {
        final sel = _gender == o;
        return GestureDetector(
          onTap: () => setState(() => _gender = o),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: sel ? _kIndigo : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: sel ? _kIndigo : const Color(0xFFE2E8F0)),
            ),
            child: Text(o,
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600,
                    color: sel ? Colors.white : AppColors.textGray)),
          ),
        );
      }).toList(),
    );
  }

  Widget _textField(String label, TextEditingController ctrl,
      {String hint = '',
      IconData? icon,
      int maxLines = 1,
      TextInputType keyboard = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _buildLabel(label),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
          keyboardType: keyboard,
          style: const TextStyle(fontSize: 14, color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
                color: AppColors.textGray.withValues(alpha: 0.5), fontSize: 13),
            prefixIcon: icon != null
                ? Icon(icon, size: 18, color: AppColors.textGray)
                : null,
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _kIndigo, width: 1.5)),
          ),
        ),
      ]),
    );
  }

  Widget _dobField(String age) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _buildLabel('Date of Birth'),
        const SizedBox(height: 6),
        Row(children: [
          Expanded(
            child: GestureDetector(
              onTap: _pickDate,
              child: AbsorbPointer(
                child: TextField(
                  controller: _dobCtrl,
                  readOnly: true,
                  style: const TextStyle(fontSize: 14, color: AppColors.textDark),
                  decoration: InputDecoration(
                    hintText: 'YYYY-MM-DD',
                    hintStyle: TextStyle(
                        color: AppColors.textGray.withValues(alpha: 0.5),
                        fontSize: 13),
                    prefixIcon: const Icon(Icons.cake_outlined,
                        size: 18, color: AppColors.textGray),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide:
                            const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide:
                            const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide:
                            const BorderSide(color: _kIndigo, width: 1.5)),
                  ),
                ),
              ),
            ),
          ),
          if (age.isNotEmpty) ...[
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: _kIndigo.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(age,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700,
                      color: _kIndigo)),
            ),
          ],
        ]),
      ]),
    );
  }

  Widget _dropdownField(String label, String? value, List<String> options,
      ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _buildLabel(label),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButton<String>(
            value: options.contains(value) ? value : null,
            isExpanded: true,
            underline: const SizedBox.shrink(),
            dropdownColor: Colors.white,
            hint: Text('Select…',
                style: TextStyle(
                    color: AppColors.textGray.withValues(alpha: 0.5),
                    fontSize: 13)),
            style: const TextStyle(fontSize: 14, color: AppColors.textDark),
            items: options
                .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                .toList(),
            onChanged: onChanged,
          ),
        ),
      ]),
    );
  }
}

// ─── Related Item Sheet (floating modal bottom sheet) ─────────────────────────

class _RelatedItemSheet extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _RelatedItemSheet({
    required this.title,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 4),
          // Title row with X button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.close_rounded,
                        size: 18, color: AppColors.textGray),
                  ),
                ),
              ],
            ),
          ),
          // Divider
          Container(height: 1, color: const Color(0xFFF1F5F9)),
          // Empty state content
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Icon(icon, color: color, size: 44),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'No $title Yet',
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textDark),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your $title records will appear here once they are added.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textGray,
                          height: 1.5),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── TabBar delegate ──────────────────────────────────────────────────────────

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabBarDelegate(this.tabBar);
  @override double get minExtent => tabBar.preferredSize.height;
  @override double get maxExtent => tabBar.preferredSize.height;
  @override
  Widget build(BuildContext context, double shrinkOffset, bool _) =>
      Container(color: Colors.white, child: tabBar);
  @override
  bool shouldRebuild(covariant _TabBarDelegate old) => tabBar != old.tabBar;
}
