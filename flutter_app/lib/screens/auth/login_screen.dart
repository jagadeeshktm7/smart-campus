// lib/screens/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _loading    = false;
  bool _showPass   = false;

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      _snack('Please enter email and password');
      return;
    }
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final user = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
      if (!mounted) return;
      final role = user['role'];
      if (role == 'student') {
        Navigator.pushReplacementNamed(context, '/student');
      } else if (role == 'faculty' || role == 'hod') {
        Navigator.pushReplacementNamed(context, '/faculty');
      } else {
        _snack('Admin panel: use web dashboard');
      }
    } catch (e) {
      _snack(e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFF1A237E), Color(0xFF1565C0)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Text('SC',
                        style: TextStyle(color: Colors.white,
                          fontSize: 28, fontWeight: FontWeight.w900)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Smart Campus',
                    style: TextStyle(color: Colors.white,
                      fontSize: 28, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 6),
                  const Text('Faculty Locator & No-Dues System',
                    style: TextStyle(color: Color(0xFF90CAF9), fontSize: 14)),
                  const SizedBox(height: 40),

                  // Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: Colors.black26,
                          blurRadius: 20, offset: const Offset(0, 8)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Sign In',
                          style: TextStyle(fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1A237E))),
                        const SizedBox(height: 20),

                        // Email
                        const Text('College Email',
                          style: TextStyle(fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF555555))),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            hintText: 'you@college.edu',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12)),
                        ),
                        const SizedBox(height: 16),

                        // Password
                        const Text('Password',
                          style: TextStyle(fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF555555))),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _passCtrl,
                          obscureText: !_showPass,
                          decoration: InputDecoration(
                            hintText: 'Enter password',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                            suffixIcon: IconButton(
                              icon: Icon(_showPass
                                ? Icons.visibility_off
                                : Icons.visibility),
                              onPressed: () =>
                                setState(() => _showPass = !_showPass),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Login button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _login,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1A237E),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _loading
                              ? const SizedBox(width: 20, height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2))
                              : const Text('Sign In',
                                  style: TextStyle(fontSize: 16,
                                    fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Contact admin to get your credentials.\nRole is auto-assigned by the system.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF90CAF9), fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
