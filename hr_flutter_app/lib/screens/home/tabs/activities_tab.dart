import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../providers/clock_provider.dart';
import '../../../services/location_service.dart';
import '../../../services/schedule_service.dart';
import '../../../services/leave_service.dart';
import '../../../models/work_schedule.dart';
import '../../../widgets/app_colors.dart';

class ActivitiesTab extends StatefulWidget {
  const ActivitiesTab({super.key});

  @override
  State<ActivitiesTab> createState() => _ActivitiesTabState();
}

class _ActivitiesTabState extends State<ActivitiesTab> {
  final _scheduleService = ScheduleService();
  final _leaveService = LeaveService();

  DateTime _weekStart = _getWeekStart(DateTime.now());
  List<WorkSchedule> _schedules = [];
  List<Map<String, dynamic>> _absentDates = [];
  bool _loadingSchedule = true;

  static DateTime _getWeekStart(DateTime date) {
    return date.subtract(Duration(days: date.weekday % 7));
  }

  @override
  void initState() {
    super.initState();
    _loadData();
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId != null) {
      context.read<ClockProvider>().init(userId);
    }
  }

  Future<void> _loadData() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    setState(() => _loadingSchedule = true);
    try {
      final schedules = await _scheduleService.getWeekSchedule(userId, _weekStart);
      final absent = await _leaveService.getAbsentDates(userId);
      setState(() {
        _schedules = schedules;
        _absentDates = absent;
      });
    } catch (_) {}
    setState(() => _loadingSchedule = false);
  }

  void _prevWeek() {
    setState(() => _weekStart = _weekStart.subtract(const Duration(days: 7)));
    _loadData();
  }

  void _nextWeek() {
    setState(() => _weekStart = _weekStart.add(const Duration(days: 7)));
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _CheckInCard(),
          const SizedBox(height: 16),
          _WorkScheduleCard(
            weekStart: _weekStart,
            schedules: _schedules,
            loading: _loadingSchedule,
            onPrev: _prevWeek,
            onNext: _nextWeek,
          ),
          if (_absentDates.isNotEmpty) ...[
            const SizedBox(height: 16),
            _AbsentCard(absentDates: _absentDates),
          ],
          const SizedBox(height: 16),
          _UpcomingHolidaysCard(),
        ],
      ),
    );
  }
}

class _CheckInCard extends StatefulWidget {
  @override
  State<_CheckInCard> createState() => _CheckInCardState();
}

class _CheckInCardState extends State<_CheckInCard> {
  final _locationService = LocationService();
  bool _locating = false;

  /// Handles GPS-aware clock-in: requests location, shows remote warning if
  /// outside office radius, then calls ClockProvider.clockIn with coordinates.
  Future<void> _handleClockIn(ClockProvider clock, String userId) async {
    setState(() => _locating = true);

    Position? pos;
    bool isRemote = false;
    int? distanceM;

    try {
      final perm = await _locationService.requestPermission();
      if (perm == LocationPermission.whileInUse ||
          perm == LocationPermission.always) {
        pos = await _locationService.getCurrentPosition();
        if (pos != null) {
          distanceM = _locationService.distanceFromOffice(pos).round();
          isRemote = !_locationService.isWithinOffice(pos);
        }
      }
    } catch (_) {
      // Location unavailable — proceed without GPS data
    } finally {
      if (mounted) setState(() => _locating = false);
    }

    if (!mounted) return;

    // Show warning dialog if employee is outside office radius
    if (isRemote && pos != null) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Working Remotely?'),
          content: Text(
            'You are ${distanceM}m from the office.\n'
            'Your clock-in will be flagged as remote.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Clock In Anyway'),
            ),
          ],
        ),
      );
      if (proceed != true || !mounted) return;
    }

    await clock.clockIn(
      userId,
      latitude: pos?.latitude,
      longitude: pos?.longitude,
      isRemote: isRemote,
      distanceMeters: distanceM,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ClockProvider>(
      builder: (context, clock, _) {
        final busy = clock.loading || _locating;
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: _buildTimerDigits(clock.elapsedFormatted),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      clock.isClockedIn
                          ? 'Currently checked in'
                          : 'Yet to check-in',
                      style: TextStyle(
                        color: clock.isClockedIn
                            ? AppColors.green
                            : AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    if (_locating)
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Text('Getting location…',
                            style: TextStyle(
                                fontSize: 11, color: AppColors.textGray)),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: busy
                      ? null
                      : () {
                          final userId = Supabase.instance.client.auth
                              .currentUser?.id;
                          if (userId == null) return;
                          if (clock.isClockedIn) {
                            clock.clockOut();
                          } else {
                            _handleClockIn(clock, userId);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        clock.isClockedIn ? AppColors.primary : AppColors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: busy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          clock.isClockedIn ? 'Check-Out' : 'Check-In',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          softWrap: false,
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildTimerDigits(String formatted) {
    final parts = formatted.split(':');
    final widgets = <Widget>[];
    for (int i = 0; i < parts.length; i++) {
      widgets.add(_DigitBox(parts[i]));
      if (i < parts.length - 1) {
        widgets.add(const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child:
              Text(':', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ));
      }
    }
    return widgets;
  }
}

class _DigitBox extends StatelessWidget {
  final String value;
  const _DigitBox(this.value);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0F0),
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        value,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: AppColors.textDark,
        ),
      ),
    );
  }
}

class _WorkScheduleCard extends StatelessWidget {
  final DateTime weekStart;
  final List<WorkSchedule> schedules;
  final bool loading;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  const _WorkScheduleCard({
    required this.weekStart,
    required this.schedules,
    required this.loading,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final weekEnd = weekStart.add(const Duration(days: 6));
    final fmt = DateFormat('dd-MMM-yyyy');
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F7F5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.access_time, color: Color(0xFF0D9488), size: 24),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Work Schedule',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      '${fmt.format(weekStart)} - ${fmt.format(weekEnd)}',
                      style: const TextStyle(color: AppColors.textGray, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            )
          else if (schedules.isEmpty)
            _buildEmptyWeek()
          else
            ...schedules.map((s) => _ScheduleRow(schedule: s)),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildEmptyWeek() {
    // Generate placeholder days
    return Column(
      children: List.generate(5, (i) {
        final day = weekStart.add(Duration(days: i));
        return _ScheduleRow.placeholder(day);
      }),
    );
  }
}

class _ScheduleRow extends StatelessWidget {
  final WorkSchedule? schedule;
  final DateTime? placeholderDate;

  const _ScheduleRow({this.schedule}) : placeholderDate = null;
  const _ScheduleRow.placeholder(this.placeholderDate) : schedule = null;

  @override
  Widget build(BuildContext context) {
    final date = schedule?.date ?? placeholderDate!;
    final dayFmt = DateFormat('d');
    final dayNameFmt = DateFormat('EEE').format(date).toUpperCase();

    Color statusColor = AppColors.textGray;
    String statusText = '';
    if (schedule?.isWeekend == true) {
      statusColor = AppColors.orange;
      statusText = 'Weekend';
    } else if (schedule?.isPresent == true) {
      statusColor = AppColors.green;
      statusText = 'Present';
    } else if (schedule?.isAbsent == true) {
      statusColor = AppColors.primary;
      statusText = 'Absent';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(dayFmt.format(date),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(dayNameFmt,
                    style: const TextStyle(fontSize: 11, color: AppColors.textGray)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  schedule?.shiftName ?? 'No shift',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                if (schedule?.startTime != null)
                  Text(
                    '${_fmt12h(schedule!.startTime!)} to ${_fmt12h(schedule!.endTime ?? '')}',
                    style: const TextStyle(color: AppColors.textGray, fontSize: 13),
                  ),
                if (statusText.isNotEmpty)
                  Text(statusText,
                      style: TextStyle(color: statusColor, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          if (schedule?.hoursWorked != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  _formatHours(schedule!.hoursWorked!),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const Text('Hrs', style: TextStyle(color: AppColors.textGray, fontSize: 12)),
              ],
            ),
        ],
      ),
    );
  }

  String _fmt12h(String time24) {
    if (time24.isEmpty) return '';
    try {
      final parts = time24.split(':');
      int h = int.parse(parts[0]);
      final m = parts[1];
      final ampm = h >= 12 ? 'PM' : 'AM';
      if (h == 0) h = 12;
      if (h > 12) h -= 12;
      return '$h:$m $ampm';
    } catch (_) {
      return time24;
    }
  }

  String _formatHours(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
  }
}

class _AbsentCard extends StatelessWidget {
  final List<Map<String, dynamic>> absentDates;
  const _AbsentCard({required this.absentDates});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFE4E6),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.beach_access, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Looks like you were absent on\nbelow listed dates :',
                  style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...absentDates.map((d) {
            final date = DateTime.parse(d['date']);
            final fmt = DateFormat('dd-MMM-yyyy').format(date);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(fmt,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const Text('1 Day', style: TextStyle(color: AppColors.textGray)),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text('Apply Leave',
                        style: TextStyle(color: AppColors.blue, fontWeight: FontWeight.w500)),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text('Regularize',
                        style: TextStyle(color: AppColors.orange, fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _UpcomingHolidaysCard extends StatelessWidget {
  // Hardcoded upcoming holidays (can be fetched from DB later)
  static const _holidays = [
    {'name': 'Holi (India)', 'date': 'Wed, Mar 04 2026'},
    {'name': 'Ramzan (India)', 'date': 'Fri, Mar 20 2026'},
    {'name': 'Good Friday (India)', 'date': 'Fri, Apr 03 2026'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFE4E6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.beach_access, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Upcoming Leave & Holidays',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ..._holidays.map((h) => ListTile(
                title: Text(h['name']!,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: Text(h['date']!, style: const TextStyle(color: AppColors.textGray)),
              )),
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                side: const BorderSide(color: AppColors.textDark),
              ),
              child: const Text('View More', style: TextStyle(color: AppColors.textDark)),
            ),
          ),
        ],
      ),
    );
  }
}
