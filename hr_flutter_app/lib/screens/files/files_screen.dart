import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/employee_file.dart';
import '../../services/files_service.dart';
import '../../widgets/app_colors.dart';

class FilesScreen extends StatefulWidget {
  const FilesScreen({super.key});

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  final _service = FilesService();
  List<EmployeeFile> _files = [];
  bool _loading = true;
  bool _uploading = false;
  String _selectedCategory = 'all';

  static const _categories = [
    ('all', 'All'),
    ('offer_letter', 'Offer Letter'),
    ('payslip', 'Payslip'),
    ('contract', 'Contract'),
    ('id_proof', 'ID Proof'),
    ('other', 'Other'),
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final data = await _service.getFiles(userId);
      setState(() => _files = data);
    } catch (e) {
      debugPrint('Files error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  List<EmployeeFile> get _filtered {
    if (_selectedCategory == 'all') return _files;
    return _files.where((f) => f.category == _selectedCategory).toList();
  }

  Future<void> _uploadFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;

    final pickedFile = result.files.first;
    if (pickedFile.path == null) return;

    // Ask for category
    final category = await _pickCategory();
    if (category == null || !mounted) return;

    setState(() => _uploading = true);
    try {
      final userId = Supabase.instance.client.auth.currentUser!.id;
      await _service.uploadFile(
        userId: userId,
        file: File(pickedFile.path!),
        name: pickedFile.name,
        category: category,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('File uploaded successfully'),
              backgroundColor: AppColors.green),
        );
        await _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Upload failed: $e'),
              backgroundColor: AppColors.primary),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<String?> _pickCategory() async {
    return showModalBottomSheet<String>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text('Select Category',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.textDark)),
            ),
            ..._categories
                .where((c) => c.$1 != 'all')
                .map((c) => ListTile(
                      title: Text(c.$2),
                      onTap: () => Navigator.pop(context, c.$1),
                    )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _openFile(EmployeeFile file) async {
    final uri = Uri.parse(file.fileUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot open file')),
      );
    }
  }

  IconData _iconFor(String category) {
    switch (category) {
      case 'offer_letter':
        return Icons.description_outlined;
      case 'payslip':
        return Icons.receipt_long_outlined;
      case 'contract':
        return Icons.handshake_outlined;
      case 'id_proof':
        return Icons.badge_outlined;
      default:
        return Icons.insert_drive_file_outlined;
    }
  }

  Color _colorFor(String category) {
    switch (category) {
      case 'offer_letter':
        return AppColors.green;
      case 'payslip':
        return AppColors.blue;
      case 'contract':
        return AppColors.orange;
      case 'id_proof':
        return const Color(0xFF8B5CF6);
      default:
        return AppColors.textGray;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'My Files',
          style: TextStyle(
              color: AppColors.textDark,
              fontWeight: FontWeight.bold,
              fontSize: 18),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _uploading ? null : _uploadFile,
        backgroundColor: AppColors.blue,
        icon: _uploading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.upload_file, color: Colors.white),
        label: Text(_uploading ? 'Uploading…' : 'Upload',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Category chips
                SizedBox(
                  height: 52,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    scrollDirection: Axis.horizontal,
                    children: _categories.map((c) {
                      final selected = _selectedCategory == c.$1;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(c.$2),
                          selected: selected,
                          onSelected: (_) =>
                              setState(() => _selectedCategory = c.$1),
                          selectedColor: AppColors.blue,
                          labelStyle: TextStyle(
                            color:
                                selected ? Colors.white : AppColors.textGray,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                          backgroundColor: Colors.white,
                          side: BorderSide(
                              color: selected
                                  ? AppColors.blue
                                  : Colors.grey.shade300),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.folder_open,
                                  size: 56,
                                  color: AppColors.textGray
                                      .withValues(alpha: 0.4)),
                              const SizedBox(height: 12),
                              const Text('No files yet. Upload one!',
                                  style: TextStyle(
                                      color: AppColors.textGray,
                                      fontSize: 14)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, i) => _buildFileCard(filtered[i]),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildFileCard(EmployeeFile file) {
    final color = _colorFor(file.category);
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _openFile(file),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_iconFor(file.category), color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(file.name,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AppColors.textDark),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Text(file.categoryLabel,
                          style: TextStyle(
                              fontSize: 12, color: color)),
                      if (file.formattedSize.isNotEmpty) ...[
                        const Text(' · ',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textGray)),
                        Text(file.formattedSize,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textGray)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  DateFormat('dd MMM yy').format(file.createdAt.toLocal()),
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textGray),
                ),
                const SizedBox(height: 4),
                const Icon(Icons.open_in_new,
                    size: 14, color: AppColors.textGray),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
