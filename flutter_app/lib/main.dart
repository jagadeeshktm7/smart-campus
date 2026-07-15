// lib/main.dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/student/student_home.dart';
import 'screens/faculty/faculty_home.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const SmartCampusApp());
}

class SmartCampusApp extends StatelessWidget {
  const SmartCampusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider(create: (_) => ApiService()),
      ],
      child: MaterialApp(
        title: 'Smart Campus',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF1A237E),
            primary: const Color(0xFF1A237E),
            secondary: const Color(0xFF00695C),
          ),
          textTheme: GoogleFonts.dmSansTextTheme(),
          useMaterial3: true,
        ),
        home: const AuthGate(),
        routes: {
          '/login':   (_) => const LoginScreen(),
          '/student': (_) => const StudentHome(),
          '/faculty': (_) => const FacultyHome(),
        },
      ),
    );
  }
}

// ── Auth Gate — decides which screen to show on launch ───────
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final auth = context.read<AuthService>();
    await auth.loadStoredUser();
    if (!mounted) return;
    if (auth.isLoggedIn) {
      final role = auth.user?['role'];
      if (role == 'student') {
        Navigator.pushReplacementNamed(context, '/student');
      } else if (role == 'faculty' || role == 'hod') {
        Navigator.pushReplacementNamed(context, '/faculty');
      }
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
