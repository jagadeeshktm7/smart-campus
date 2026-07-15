// lib/screens/student/faculty_search_tab.dart
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class FacultySearchTab extends StatefulWidget {
  const FacultySearchTab({super.key});
  @override State<FacultySearchTab> createState() => _FacultySearchTabState();
}

class _FacultySearchTabState extends State<FacultySearchTab> {
  final _ctrl = TextEditingController();
  List<FacultyModel> _results = [];
  Map<int, Map<String, dynamic>> _liveStatus = {};
  bool _loading = false;

  static const _statusColors = {
    'available':  Color(0xFF4CAF50),
    'busy':       Color(0xFFFF9800),
    'in_class':   Color(0xFF1565C0),
    'in_meeting': Color(0xFF9C27B0),
    'absent':     Color(0xFFf44336),
  };
  static const _statusLabels = {
    'available':  'Available',
    'busy':       'Busy',
    'in_class':   'In Class',
    'in_meeting': 'In Meeting',
    'absent':     'Absent',
  };

  Future<void> _search() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() { _loading = true; _results = []; });
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      final data = await api.get('/faculty/search',
        query: {'q': _ctrl.text.trim()});
      final list = (data['faculty'] as List)
        .map((e) => FacultyModel.fromJson(e)).toList();
      setState(() => _results = list);

      // Subscribe to Firebase for each result
      for (final f in list) {
        final ref = FirebaseDatabase.instance.ref('faculty_status/${f.facultyId}');
        ref.onValue.listen((event) {
          if (event.snapshot.exists) {
            setState(() {
              _liveStatus[f.facultyId] =
                Map<String, dynamic>.from(event.snapshot.value as Map);
            });
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getStatus(FacultyModel f) =>
    _liveStatus[f.facultyId]?['status'] ?? f.status;

  String _getRoom(FacultyModel f) {
    final live = _liveStatus[f.facultyId];
    return live?['roomNumber']?.toString() ?? f.roomNumber ?? '—';
  }

  int? _getFloor(FacultyModel f) {
    final live = _liveStatus[f.facultyId];
    if (live?['floor'] != null) return live!['floor'] as int?;
    return f.floor;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search bar
        Container(
          color: const Color(0xFF1A237E),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Search faculty by name or dept...',
                    hintStyle: const TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.white24,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 12),
                    prefixIcon: const Icon(Icons.search, color: Colors.white60),
                  ),
                  onSubmitted: (_) => _search(),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _loading ? null : _search,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF1A237E),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                ),
                child: _loading
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Go',
                      style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
        ),

        // Results
        Expanded(
          child: _results.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.person_search,
                      size: 64, color: Color(0xFFBDBDBD)),
                    const SizedBox(height: 12),
                    Text(_loading ? 'Searching...' : 'Search for a faculty member',
                      style: const TextStyle(color: Colors.grey)),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _results.length,
                itemBuilder: (_, i) {
                  final f = _results[i];
                  final status = _getStatus(f);
                  final color  = _statusColors[status] ?? Colors.grey;
                  final label  = _statusLabels[status] ?? status;
                  final room   = _getRoom(f);
                  final floor  = _getFloor(f);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Avatar
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1A237E),
                              borderRadius: BorderRadius.circular(12)),
                            child: Center(
                              child: Text(f.initials,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16)),
                            ),
                          ),
                          const SizedBox(width: 14),
                          // Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(f.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15)),
                                Text('${f.designation} · ${f.deptName}',
                                  style: const TextStyle(
                                    color: Colors.grey, fontSize: 12)),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on,
                                      size: 13, color: Colors.grey),
                                    const SizedBox(width: 2),
                                    Text(
                                      floor != null
                                        ? 'Floor $floor · Room $room'
                                        : 'Room $room',
                                      style: const TextStyle(
                                        fontSize: 12, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: color,
                                    borderRadius: BorderRadius.circular(20)),
                                  child: Text(label,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
        ),
      ],
    );
  }
}
