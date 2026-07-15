// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // ── Change this to your server IP/domain ────────────────
  static const String baseUrl = 'http://10.0.2.2:5000/api';
  // For physical device on same WiFi: 'http://192.168.1.XXX:5000/api'
  // For production: 'https://your-domain.com/api'

  final String? token;
  ApiService({this.token});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // ── GET ──────────────────────────────────────────────────
  Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final res  = await http.get(uri, headers: _headers);
    return _handle(res);
  }

  // ── POST ─────────────────────────────────────────────────
  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await http.post(uri,
      headers: _headers, body: jsonEncode(body));
    return _handle(res);
  }

  // ── PUT ──────────────────────────────────────────────────
  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await http.put(uri,
      headers: _headers, body: jsonEncode(body));
    return _handle(res);
  }

  // ── PATCH ────────────────────────────────────────────────
  Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await http.patch(uri,
      headers: _headers, body: jsonEncode(body));
    return _handle(res);
  }

  // ── Response handler ─────────────────────────────────────
  dynamic _handle(http.Response res) {
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw ApiException(
      body['message'] ?? 'Server error',
      res.statusCode,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override String toString() => message;
}
