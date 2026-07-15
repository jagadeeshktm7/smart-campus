// lib/services/auth_service.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;

  Map<String, dynamic>? get user  => _user;
  String?               get token => _token;
  bool get isLoggedIn => _token != null && _user != null;

  // ── Load stored session ──────────────────────────────────
  Future<void> loadStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('sc_token');
    final userJson = prefs.getString('sc_user');
    if (userJson != null) _user = jsonDecode(userJson);
    notifyListeners();
  }

  // ── Login ────────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String email, String password) async {
    final api  = ApiService();
    final data = await api.post('/auth/login', {
      'email': email, 'password': password,
    });

    _token = data['token'];
    _user  = data['user'];

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('sc_token', _token!);
    await prefs.setString('sc_user',  jsonEncode(_user));

    notifyListeners();
    return _user!;
  }

  // ── Logout ───────────────────────────────────────────────
  Future<void> logout() async {
    _token = null;
    _user  = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('sc_token');
    await prefs.remove('sc_user');
    notifyListeners();
  }

  // ── Change password ─────────────────────────────────────
  Future<void> changePassword(String oldPass, String newPass) async {
    final api = ApiService(token: _token);
    await api.post('/auth/change-password', {
      'old_password': oldPass,
      'new_password': newPass,
    });
  }
}
