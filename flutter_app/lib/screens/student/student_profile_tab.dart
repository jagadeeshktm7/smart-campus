// lib/screens/student/student_profile_tab.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';

class StudentProfileTab extends StatelessWidget {
  const StudentProfileTab({super.key});
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user ?? {};
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Avatar
        Center(
          child: Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF1A237E),
              borderRadius: BorderRadius.circular(20)),
            child: Center(
              child: Text(
                (user['name'] ?? 'U').split(' ')
                  .map((w) => w.isNotEmpty ? w[0] : '').take(2).join(),
                style: const TextStyle(color: Colors.white,
                  fontSize: 28, fontWeight: FontWeight.w800)),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Text(user['name'] ?? '',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        Text(user['email'] ?? '',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 24),
        // Info cards
        ...[
          ['Roll Number', user['roll_number'] ?? '—'],
          ['Department',  user['dept_name']   ?? '—'],
          ['Semester',    'Semester ${user['semester'] ?? '—'}'],
          ['Role',        (user['role'] ?? '').toUpperCase()],
        ].map((item) => Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            title: Text(item[0], style: const TextStyle(
              fontSize: 12, color: Colors.grey)),
            subtitle: Text(item[1], style: const TextStyle(
              fontSize: 15, fontWeight: FontWeight.w700,
              color: Color(0xFF1A237E))),
          ),
        )),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: () async {
            await auth.logout();
            if (context.mounted) {
              Navigator.pushReplacementNamed(context, '/login');
            }
          },
          icon: const Icon(Icons.logout),
          label: const Text('Logout'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFf44336),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }
}
