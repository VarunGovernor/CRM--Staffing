import 'package:flutter/material.dart';
import '../../widgets/app_colors.dart';

class PostStatusSheet extends StatefulWidget {
  const PostStatusSheet({super.key});

  @override
  State<PostStatusSheet> createState() => _PostStatusSheetState();
}

class _PostStatusSheetState extends State<PostStatusSheet> {
  final _textCtrl = TextEditingController();
  String _audience = 'User';
  bool _isPosting = false;

  static const _audiences = ['User', 'Team', 'Organization', 'Everyone'];

  Future<void> _pickAudience() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Post to',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ..._audiences.map((a) => ListTile(
                title: Text(a),
                trailing: _audience == a
                    ? const Icon(Icons.check, color: AppColors.blue)
                    : null,
                onTap: () => Navigator.pop(context, a),
              )),
          const SizedBox(height: 8),
        ],
      ),
    );
    if (result != null) setState(() => _audience = result);
  }

  void _post() async {
    if (_textCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write something to post')),
      );
      return;
    }
    setState(() => _isPosting = true);
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() => _isPosting = false);
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Status posted successfully'),
        backgroundColor: Color(0xFF22C55E),
      ),
    );
  }

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    final keyboardPad = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF5F5F5),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 4),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4)
                      ],
                    ),
                    child: const Icon(Icons.close,
                        size: 18, color: Colors.black87),
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: _isPosting ? null : _post,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: _isPosting
                          ? Colors.grey[300]
                          : const Color(0xFF4DD8C8),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: _isPosting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white),
                          )
                        : const Text('Post',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),

          // Audience selector
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _pickAudience,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('To : ',
                            style: TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                        Text(_audience,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down, size: 18),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                // Text size button
                GestureDetector(
                  onTap: () {},
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('T\u207A',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Text input
          Flexible(
            child: Padding(
              padding:
                  EdgeInsets.fromLTRB(16, 0, 16, keyboardPad > 0 ? 8 : 0),
              child: TextField(
                controller: _textCtrl,
                maxLines: null,
                minLines: 6,
                autofocus: true,
                style: const TextStyle(fontSize: 16),
                decoration: const InputDecoration(
                  hintText: 'Type @ to mention someone',
                  hintStyle: TextStyle(
                      color: AppColors.textGray, fontSize: 16),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),

          // Bottom toolbar
          Container(
            color: Colors.white,
            padding: EdgeInsets.fromLTRB(
                16, 10, 16, 10 + (keyboardPad > 0 ? 0 : bottomPad)),
            child: Row(
              children: [
                // Image attachment
                GestureDetector(
                  onTap: () {},
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.image_rounded,
                        color: Color(0xFFF59E0B), size: 24),
                  ),
                ),
                const SizedBox(width: 12),
                // More attachments
                GestureDetector(
                  onTap: () {},
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.blue,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.add,
                        color: Colors.white, size: 24),
                  ),
                ),
              ],
            ),
          ),
          if (keyboardPad > 0) SizedBox(height: keyboardPad),
        ],
      ),
    );
  }
}
