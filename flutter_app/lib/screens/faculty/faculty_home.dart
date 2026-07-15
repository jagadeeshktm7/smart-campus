// lib/screens/faculty/faculty_home.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class FacultyHome extends StatefulWidget {
  const FacultyHome({super.key});
  @override State<FacultyHome> createState() => _FacultyHomeState();
}

class _FacultyHomeState extends State<FacultyHome>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  List<TimetableEntry> _schedule = [];
  List<NoDuesRequest>  _pending  = [];
  String _currentStatus = 'available';
  String _selectedRoom  = '';
  String _notes         = '';
  List<Map<String, dynamic>> _rooms = [];
  bool _loadingSchedule = true;
  bool _loadingPending  = true;
  final _qrCtrl  = TextEditingController();
  final _pinCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
    _loadAll();
  }

  Future<void> _loadAll() async {
    await Future.wait([_loadSchedule(), _loadPending(), _loadRooms()]);
  }

  Future<void> _loadRooms() async {
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      final data = await api.get('/admin/rooms');
      setState(() => _rooms = List<Map<String, dynamic>>.from(data['rooms']));
    } catch (_) {}
  }

  Future<void> _loadSchedule() async {
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      final data = await api.get('/faculty/today-schedule');
      setState(() {
        _schedule = (data['schedule'] as List)
          .map((e) => TimetableEntry.fromJson(e)).toList();
        _loadingSchedule = false;
      });
    } catch (_) {
      setState(() => _loadingSchedule = false);
    }
  }

  Future<void> _loadPending() async {
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      final data = await api.get('/nodues/faculty/pending');
      setState(() {
        _pending = (data['requests'] as List)
          .map((e) => NoDuesRequest.fromJson(e)).toList();
        _loadingPending = false;
      });
    } catch (_) {
      setState(() => _loadingPending = false);
    }
  }

  Future<void> _updateStatus() async {
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      await api.put('/faculty/status', {
        'status': _currentStatus,
        if (_selectedRoom.isNotEmpty) 'room_id': int.tryParse(_selectedRoom),
        if (_notes.isNotEmpty) 'notes': _notes,
      });
      _snack('✅ Status updated!');
    } catch (e) { _snack(e.toString()); }
  }

  Future<void> _qrCheckin() async {
    if (_qrCtrl.text.isEmpty) { _snack('Enter QR code'); return; }
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      final data = await api.post('/faculty/qr-checkin',
        {'qr_code_hash': _qrCtrl.text.trim()});
      _snack(data['message'] ?? 'Checked in!');
      _qrCtrl.clear();
    } catch (e) { _snack(e.toString()); }
  }

  Future<void> _approveRequest(int reqId, String action) async {
    if (_pinCtrl.text.isEmpty) { _snack('Enter your PIN'); return; }
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      await api.post('/nodues/approve/$reqId', {
        'pin': _pinCtrl.text,
        'action': action,
        'remarks': action == 'reject' ? 'Incomplete submissions' : '',
      });
      _snack('Request ${action}d!');
      _pinCtrl.clear();
      Navigator.pop(context);
      _loadPending();
    } catch (e) { _snack(e.toString()); }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  void _showPinDialog(int reqId, String action) {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: Text(action == 'approve' ? '✅ Confirm Approval' : '❌ Confirm Rejection'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Enter your login password as approval PIN.',
          style: TextStyle(fontSize: 13, color: Colors.grey)),
        const SizedBox(height: 12),
        TextField(
          controller: _pinCtrl,
          obscureText: true,
          decoration: InputDecoration(
            labelText: 'PIN / Password',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10)))),
      ]),
      actions: [
        TextButton(onPressed: () { _pinCtrl.clear(); Navigator.pop(context); },
          child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () => _approveRequest(reqId, action),
          style: ElevatedButton.styleFrom(
            backgroundColor: action == 'approve'
              ? const Color(0xFF4CAF50) : const Color(0xFFf44336),
            foregroundColor: Colors.white),
          child: const Text('Confirm')),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user ?? {};
    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Faculty Portal',
            style: TextStyle(color: Colors.white,
              fontSize: 16, fontWeight: FontWeight.w800)),
          Text(user['name'] ?? '',
            style: const TextStyle(color: Color(0xFF80CBC4), fontSize: 12)),
        ]),
        backgroundColor: const Color(0xFF00695C),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white70),
            onPressed: () async {
              await auth.logout();
              if (mounted) Navigator.pushReplacementNamed(context, '/login');
            }),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF80CBC4),
          isScrollable: true,
          tabs: [
            const Tab(text: 'My Status'),
            const Tab(text: "Today's Classes"),
            Tab(text: 'Approvals (${_pending.length})'),
            const Tab(text: 'QR Check-In'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _buildStatusTab(),
          _buildScheduleTab(),
          _buildApprovalsTab(),
          _buildQrTab(),
        ],
      ),
    );
  }

  // ── STATUS TAB ───────────────────────────────────────────────
  Widget _buildStatusTab() {
    final opts = [
      {'value':'available',  'label':'Available',  'emoji':'✅', 'color':const Color(0xFF4CAF50)},
      {'value':'busy',       'label':'Busy',        'emoji':'⏳', 'color':const Color(0xFFFF9800)},
      {'value':'in_class',   'label':'In Class',    'emoji':'📚', 'color':const Color(0xFF1565C0)},
      {'value':'in_meeting', 'label':'In Meeting',  'emoji':'🤝', 'color':const Color(0xFF9C27B0)},
      {'value':'absent',     'label':'Absent',      'emoji':'❌', 'color':const Color(0xFFf44336)},
    ];
    return ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Update Your Status',
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
      const SizedBox(height: 14),
      GridView.count(
        crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.1, crossAxisSpacing: 10, mainAxisSpacing: 10,
        children: opts.map((opt) {
          final selected = _currentStatus == opt['value'];
          final color = opt['color'] as Color;
          return GestureDetector(
            onTap: () => setState(() => _currentStatus = opt['value'] as String),
            child: Container(
              decoration: BoxDecoration(
                color: selected ? color.withOpacity(0.1) : Colors.white,
                border: Border.all(color: selected ? color : Colors.grey.shade200, width: 2),
                borderRadius: BorderRadius.circular(14)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(opt['emoji'] as String, style: const TextStyle(fontSize: 24)),
                const SizedBox(height: 4),
                Text(opt['label'] as String,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                    color: selected ? color : Colors.grey)),
              ]),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
      const Text('Room', style: TextStyle(fontSize: 13,
        fontWeight: FontWeight.w600, color: Color(0xFF555555))),
      const SizedBox(height: 6),
      DropdownButtonFormField<String>(
        value: _selectedRoom.isEmpty ? null : _selectedRoom,
        hint: const Text('Select room'),
        decoration: InputDecoration(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
        items: _rooms.map((r) => DropdownMenuItem(
          value: r['room_id'].toString(),
          child: Text('Room ${r['room_number']} — Floor ${r['floor']}'))).toList(),
        onChanged: (v) => setState(() => _selectedRoom = v ?? ''),
      ),
      const SizedBox(height: 12),
      const Text('Notes (optional)', style: TextStyle(fontSize: 13,
        fontWeight: FontWeight.w600, color: Color(0xFF555555))),
      const SizedBox(height: 6),
      TextField(
        decoration: InputDecoration(
          hintText: 'e.g. Back after lunch',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
        onChanged: (v) => _notes = v,
      ),
      const SizedBox(height: 20),
      ElevatedButton(
        onPressed: _updateStatus,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00695C),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
        child: const Text('Update Status',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
      ),
    ]);
  }

  // ── SCHEDULE TAB ─────────────────────────────────────────────
  Widget _buildScheduleTab() {
    if (_loadingSchedule) return const Center(child: CircularProgressIndicator());
    if (_schedule.isEmpty) return const Center(
      child: Text('No classes today 🎉',
        style: TextStyle(fontSize: 16, color: Colors.grey)));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _schedule.length,
      itemBuilder: (_, i) {
        final c = _schedule[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(width: 4, height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A237E),
                  borderRadius: BorderRadius.circular(4))),
              const SizedBox(width: 14),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(c.subjectName, style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14)),
                  Text(c.subjectCode, style: const TextStyle(
                    color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('📍 Room ${c.roomNumber}, Floor ${c.floor}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF555555))),
                ],
              )),
              Column(children: [
                Text('${c.startTime.substring(0,5)}',
                  style: const TextStyle(fontSize: 14,
                    fontWeight: FontWeight.w800, color: Color(0xFF1565C0))),
                Text('to ${c.endTime.substring(0,5)}',
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ]),
            ]),
          ),
        );
      },
    );
  }

  // ── APPROVALS TAB ────────────────────────────────────────────
  Widget _buildApprovalsTab() {
    if (_loadingPending) return const Center(child: CircularProgressIndicator());
    if (_pending.isEmpty) return const Center(
      child: Text('No pending approvals ✅',
        style: TextStyle(fontSize: 16, color: Colors.grey)));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _pending.length,
      itemBuilder: (_, i) {
        final r = _pending[i];
        final checks = [
          ['Assign 1', r.assign1], ['Assign 2', r.assign2], ['Assign 3', r.assign3],
          ['MCQ 1', r.mcq1], ['MCQ 2', r.mcq2], ['MCQ 3', r.mcq3],
          ['Seminar', r.seminar],
        ];
        return Card(
          margin: const EdgeInsets.only(bottom: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(r.studentName, style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.w800)),
              Text('${r.rollNumber} · ${r.subjectName}',
                style: const TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: checks.map((c) {
                  final done = c[1] as bool;
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: done ? const Color(0xFF4CAF50) : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(20)),
                    child: Text(c[0] as String,
                      style: TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700,
                        color: done ? Colors.white : Colors.grey)),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: ElevatedButton(
                  onPressed: () => _showPinDialog(r.reqId, 'approve'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4CAF50),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10))),
                  child: const Text('✅ Approve'))),
                const SizedBox(width: 10),
                Expanded(child: ElevatedButton(
                  onPressed: () => _showPinDialog(r.reqId, 'reject'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFf44336),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10))),
                  child: const Text('❌ Reject'))),
              ]),
            ]),
          ),
        );
      },
    );
  }

  // ── QR CHECK-IN TAB ──────────────────────────────────────────
  Widget _buildQrTab() {
    return ListView(padding: const EdgeInsets.all(20), children: [
      const Icon(Icons.qr_code_scanner, size: 80, color: Color(0xFF00695C)),
      const SizedBox(height: 16),
      const Text('QR Code Check-In',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      const Text(
        'Scan the QR code posted at your classroom door. '
        'This confirms your physical location and updates your '
        'status to Available at that room in real-time.',
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5)),
      const SizedBox(height: 24),
      const Text('QR Code Value',
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
          color: Color(0xFF555555))),
      const SizedBox(height: 6),
      TextField(
        controller: _qrCtrl,
        decoration: InputDecoration(
          hintText: 'Scan or type QR code (e.g. QR_CSE_208)',
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12)),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14, vertical: 14),
          suffixIcon: const Icon(Icons.qr_code)),
      ),
      const SizedBox(height: 16),
      ElevatedButton.icon(
        onPressed: _qrCheckin,
        icon: const Icon(Icons.location_on),
        label: const Text('Check In to This Room',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00695C),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12))),
      ),
      const SizedBox(height: 20),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF4CAF5044))),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('How it works:',
              style: TextStyle(fontWeight: FontWeight.w800,
                color: Color(0xFF2E7D32))),
            SizedBox(height: 8),
            Text('1. QR code is printed at every room door\n'
              '2. You scan it when you arrive\n'
              '3. Your location updates instantly on the student app\n'
              '4. Students can see you are in that room',
              style: TextStyle(fontSize: 13, color: Color(0xFF388E3C),
                height: 1.6)),
          ],
        ),
      ),
    ]);
  }
}
