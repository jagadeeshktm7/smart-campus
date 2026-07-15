// lib/screens/student/nodues_tab.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class NoDuesTab extends StatefulWidget {
  const NoDuesTab({super.key});
  @override State<NoDuesTab> createState() => _NoDuesTabState();
}

class _NoDuesTabState extends State<NoDuesTab>
    with SingleTickerProviderStateMixin {
  List<NoDuesItem> _dues     = [];
  bool             _loading  = true;
  int?             _expanded;
  bool             _requesting = false;
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _fetchDues();
  }

  Future<void> _fetchDues() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      final data = await api.get('/nodues/student');
      setState(() {
        _dues = (data['dues'] as List)
          .map((e) => NoDuesItem.fromJson(e)).toList();
      });
    } catch (e) {
      _snack(e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestApproval(int reqId) async {
    setState(() => _requesting = true);
    try {
      final auth = context.read<AuthService>();
      final api  = ApiService(token: auth.token);
      await api.post('/nodues/request/$reqId',
        {'message': 'Requesting no-dues approval'});
      _snack('✅ Request sent to faculty!');
    } catch (e) {
      _snack(e.toString());
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(msg),
        behavior: SnackBarBehavior.floating));
  }

  int get _approvedCount => _dues.where((d) => d.status == 'approved').length;
  double get _pct => _dues.isEmpty ? 0 : _approvedCount / _dues.length;

  Color _statusColor(String s) => {
    'approved': const Color(0xFF4CAF50),
    'rejected': const Color(0xFFf44336),
    'pending':  const Color(0xFFFF9800),
  }[s] ?? Colors.grey;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Progress header
        Container(
          color: const Color(0xFF1A237E),
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('$_approvedCount of ${_dues.length} cleared',
                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  Text('${(_pct * 100).round()}%',
                    style: const TextStyle(color: Color(0xFFFFD54F),
                      fontSize: 14, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _pct,
                  minHeight: 8,
                  backgroundColor: Colors.white24,
                  valueColor: AlwaysStoppedAnimation(
                    _pct >= 1.0
                      ? const Color(0xFF4CAF50)
                      : const Color(0xFFFFD54F)),
                ),
              ),
              if (_pct >= 1.0) ...[
                const SizedBox(height: 10),
                const Text('🎉 All dues cleared! Eligible for exam.',
                  style: TextStyle(color: Color(0xFF4CAF50),
                    fontWeight: FontWeight.w700)),
              ],
            ],
          ),
        ),

        // Tabs
        TabBar(
          controller: _tabCtrl,
          labelColor: const Color(0xFF1A237E),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF1A237E),
          tabs: const [
            Tab(text: 'Subject-wise'),
            Tab(text: 'Print View'),
          ],
        ),

        Expanded(
          child: TabBarView(
            controller: _tabCtrl,
            children: [
              // ── Subject-wise list ─────────────────────
              _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _fetchDues,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _dues.length,
                      itemBuilder: (_, i) => _buildCard(_dues[i]),
                    ),
                  ),

              // ── Print view ───────────────────────────
              _buildPrintView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCard(NoDuesItem d) {
    final isOpen = _expanded == d.reqId;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => setState(() =>
          _expanded = isOpen ? null : d.reqId),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: _statusColor(d.status),
                      borderRadius: BorderRadius.circular(10)),
                    child: Center(
                      child: Text(d.facultyInitials,
                        style: const TextStyle(color: Colors.white,
                          fontWeight: FontWeight.w700, fontSize: 14)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(d.subjectName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                        Text('${d.subjectCode} · ${d.facultyName}',
                          style: const TextStyle(
                            color: Colors.grey, fontSize: 11)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(d.status),
                      borderRadius: BorderRadius.circular(20)),
                    child: Text(d.status.toUpperCase(),
                      style: const TextStyle(color: Colors.white,
                        fontSize: 9, fontWeight: FontWeight.w800)),
                  ),
                ],
              ),

              // Quick chips
              const SizedBox(height: 10),
              Row(
                children: [
                  ...['A1','A2','A3'].asMap().entries.map((e) => _chip(
                    e.value,
                    [d.assign1, d.assign2, d.assign3][e.key],
                    const Color(0xFF388E3C),
                  )),
                  ...['Q1','Q2','Q3'].asMap().entries.map((e) => _chip(
                    e.value,
                    [d.mcq1, d.mcq2, d.mcq3][e.key],
                    const Color(0xFF1565C0),
                  )),
                  _chip('SEM', d.seminar, const Color(0xFF6A1B9A)),
                ],
              ),

              // Expanded detail
              if (isOpen) ...[
                const Divider(height: 20),
                _itemSection('Assignments',
                  ['Assign 1','Assign 2','Assign 3'],
                  [d.assign1, d.assign2, d.assign3],
                  const Color(0xFF388E3C)),
                const SizedBox(height: 12),
                _itemSection('MCQ Tests',
                  ['MCQ 1','MCQ 2','MCQ 3'],
                  [d.mcq1, d.mcq2, d.mcq3],
                  const Color(0xFF1565C0)),
                const SizedBox(height: 12),
                _itemSection('Seminar',
                  ['Seminar / Presentation'],
                  [d.seminar],
                  const Color(0xFF6A1B9A)),
                const SizedBox(height: 12),
                // Signature block
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: d.status == 'approved'
                      ? const Color(0xFFE8F5E9)
                      : const Color(0xFFFFF8F0),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _statusColor(d.status)),
                  ),
                  child: d.status == 'approved'
                    ? Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('✅ Faculty Approved',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF2E7D32))),
                                Text(d.facultyName,
                                  style: const TextStyle(
                                    color: Colors.grey, fontSize: 12)),
                              ],
                            ),
                          ),
                          Text(d.facultyInitials,
                            style: const TextStyle(
                              fontFamily: 'serif',
                              fontSize: 28,
                              color: Color(0xFF1A237E),
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.bold)),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('⏳ Pending Faculty Approval',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFE65100))),
                          if (d.facultyRemarks?.isNotEmpty == true) ...[
                            const SizedBox(height: 4),
                            Text('Note: ${d.facultyRemarks}',
                              style: const TextStyle(
                                color: Colors.red, fontSize: 12)),
                          ],
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: _requesting ? null
                              : () => _requestApproval(d.reqId),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1A237E),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                            ),
                            child: Text(_requesting
                              ? 'Sending...' : 'Request Approval'),
                          ),
                        ],
                      ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, bool done, Color color) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Column(
        children: [
          Container(
            width: 22, height: 22,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: done ? color : const Color(0xFFF5F5F5),
              border: done ? null : Border.all(color: Colors.grey.shade300)),
            child: done
              ? const Icon(Icons.check, color: Colors.white, size: 13)
              : null,
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(
            fontSize: 8, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _itemSection(String title, List<String> labels,
      List<bool> values, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.toUpperCase(),
          style: const TextStyle(fontSize: 10,
            fontWeight: FontWeight.w700, color: Colors.grey,
            letterSpacing: 0.8)),
        const SizedBox(height: 8),
        Row(
          children: labels.asMap().entries.map((e) {
            final done = values[e.key];
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: e.key < labels.length - 1 ? 8 : 0),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: done ? color.withOpacity(0.1) : const Color(0xFFFAFAFA),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: done ? color.withOpacity(0.4) : Colors.grey.shade200)),
                child: Column(
                  children: [
                    Container(
                      width: 26, height: 26,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: done ? color : Colors.grey.shade200),
                      child: done
                        ? const Icon(Icons.check, color: Colors.white, size: 15)
                        : null,
                    ),
                    const SizedBox(height: 4),
                    Text(e.value,
                      style: TextStyle(
                        fontSize: 10, fontWeight: FontWeight.w600,
                        color: done ? color : Colors.grey),
                      textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPrintView() {
    final auth = context.read<AuthService>();
    final user = auth.user;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [BoxShadow(
                color: Colors.black12, blurRadius: 10,
                offset: const Offset(0, 2))],
            ),
            child: Column(
              children: [
                // College header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 16, horizontal: 20),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1A237E),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(14),
                      topRight: Radius.circular(14)),
                  ),
                  child: const Column(
                    children: [
                      Text('STATE ENGINEERING COLLEGE',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white,
                          fontSize: 14, fontWeight: FontWeight.w800,
                          letterSpacing: 0.5)),
                      SizedBox(height: 4),
                      Text('Department of Computer Science & Engineering',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF90CAF9), fontSize: 11)),
                      SizedBox(height: 10),
                      Text('NO OBJECTION CERTIFICATE',
                        style: TextStyle(color: Color(0xFFFFD54F),
                          fontSize: 13, fontWeight: FontWeight.w800,
                          letterSpacing: 1)),
                    ],
                  ),
                ),

                // Student info grid
                _infoGrid(user),

                // Table
                _printTable(),

                // Footer
                _printFooter(user),

                // Status bar
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 10, horizontal: 16),
                  decoration: BoxDecoration(
                    color: _pct >= 1.0
                      ? const Color(0xFF4CAF50)
                      : const Color(0xFFFF9800),
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(14),
                      bottomRight: Radius.circular(14)),
                  ),
                  child: Text(
                    _pct >= 1.0
                      ? '✓ ALL DUES CLEARED — ELIGIBLE FOR EXAMINATION'
                      : '⚠ ${_dues.length - _approvedCount} SUBJECT(S) PENDING',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white,
                      fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Print button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _pct >= 1.0 ? () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text(
                    'Show this screen to the exam office for verification.'),
                    behavior: SnackBarBehavior.floating));
              } : null,
              icon: const Icon(Icons.print),
              label: Text(_pct >= 1.0
                ? 'Show to Exam Office'
                : 'Complete pending dues to unlock'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A237E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Text('🔒 Data verified from server — cannot be altered',
            style: TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _infoGrid(Map<String, dynamic>? user) {
    final items = [
      ['Name',     user?['name']        ?? ''],
      ['Roll No.', user?['roll_number'] ?? ''],
      ['Branch',   user?['dept_name']   ?? ''],
      ['Semester', 'Sem ${user?['semester'] ?? ''}'],
    ];
    return Table(
      border: TableBorder.all(color: Colors.grey.shade200),
      children: [
        TableRow(children: items.take(2).map((i) => _infoCell(i[0], i[1])).toList()),
        TableRow(children: items.skip(2).map((i) => _infoCell(i[0], i[1])).toList()),
      ],
    );
  }

  Widget _infoCell(String label, String value) => Padding(
    padding: const EdgeInsets.all(10),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label.toUpperCase(), style: const TextStyle(
        fontSize: 8, color: Colors.grey, letterSpacing: 0.5)),
      const SizedBox(height: 2),
      Text(value, style: const TextStyle(
        fontSize: 12, fontWeight: FontWeight.w700)),
    ]),
  );

  Widget _printTable() {
    const hdrs = ['#','Subject','Faculty','A1','A2','A3','Q1','Q2','Q3','SEM','Sign'];
    return Table(
      border: TableBorder.all(color: Colors.grey.shade200),
      columnWidths: const {
        0: FixedColumnWidth(24),
        1: FlexColumnWidth(2.5),
        2: FlexColumnWidth(2),
        3: FixedColumnWidth(24),
        4: FixedColumnWidth(24),
        5: FixedColumnWidth(24),
        6: FixedColumnWidth(24),
        7: FixedColumnWidth(24),
        8: FixedColumnWidth(24),
        9: FixedColumnWidth(28),
        10: FixedColumnWidth(36),
      },
      children: [
        // Header row
        TableRow(
          decoration: const BoxDecoration(color: Color(0xFFE3F2FD)),
          children: hdrs.map((h) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 2),
            child: Text(h, textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 7,
                fontWeight: FontWeight.w800, color: Color(0xFF1A237E))),
          )).toList(),
        ),
        // Data rows
        ..._dues.asMap().entries.map((entry) {
          final i = entry.key;
          final d = entry.value;
          final checks = [d.assign1, d.assign2, d.assign3,
            d.mcq1, d.mcq2, d.mcq3, d.seminar];
          return TableRow(
            decoration: BoxDecoration(
              color: i.isEven ? Colors.white : const Color(0xFFFAFAFA)),
            children: [
              _tc('${i+1}'),
              _tc(d.subjectCode, bold: true),
              _tc(d.facultyName, small: true),
              ...checks.map((done) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Icon(
                  done ? Icons.check_circle : Icons.radio_button_unchecked,
                  size: 14,
                  color: done ? const Color(0xFF4CAF50) : Colors.grey.shade300),
              )),
              // Signature
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: d.status == 'approved'
                  ? Text(d.facultyInitials,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'serif', fontSize: 14,
                        color: Color(0xFF1A237E),
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.bold))
                  : Text('—', textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.orange.shade400,
                        fontSize: 9, fontWeight: FontWeight.w700)),
              ),
            ],
          );
        }),
      ],
    );
  }

  Widget _tc(String text, {bool bold = false, bool small = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 2),
    child: Text(text, textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: small ? 8 : 9,
        fontWeight: bold ? FontWeight.w700 : FontWeight.normal)),
  );

  Widget _printFooter(Map<String, dynamic>? user) => Padding(
    padding: const EdgeInsets.all(14),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Generated on', style: TextStyle(fontSize: 9, color: Colors.grey)),
          Text(DateTime.now().toString().substring(0, 16),
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
        ]),
        Column(children: [
          Container(width: 80, height: 1, color: const Color(0xFF1A237E)),
          const SizedBox(height: 4),
          const Text('HOD Signature', style: TextStyle(
            fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF1A237E))),
        ]),
      ],
    ),
  );
}
