// lib/models/models.dart
// ─────────────────────────────────────────────────────────────
//  All data models for Smart Campus app
// ─────────────────────────────────────────────────────────────

class FacultyModel {
  final int    facultyId;
  final String name;
  final String email;
  final String deptName;
  final String deptCode;
  final String designation;
  final String status;
  final String? roomNumber;
  final int?   floor;
  final String? availableUntil;
  final String? notes;

  FacultyModel({
    required this.facultyId,
    required this.name,
    required this.email,
    required this.deptName,
    required this.deptCode,
    required this.designation,
    required this.status,
    this.roomNumber,
    this.floor,
    this.availableUntil,
    this.notes,
  });

  factory FacultyModel.fromJson(Map<String, dynamic> j) => FacultyModel(
    facultyId:      j['faculty_id'],
    name:           j['name']        ?? '',
    email:          j['email']       ?? '',
    deptName:       j['dept_name']   ?? '',
    deptCode:       j['dept_code']   ?? '',
    designation:    j['designation'] ?? 'Faculty',
    status:         j['status']      ?? 'available',
    roomNumber:     j['room_number'],
    floor:          j['floor'],
    availableUntil: j['available_until'],
    notes:          j['notes'],
  );

  String get initials => name.split(' ')
    .where((w) => w.isNotEmpty).take(2)
    .map((w) => w[0].toUpperCase()).join();

  String get statusLabel => {
    'available':  'Available',
    'busy':       'Busy',
    'in_class':   'In Class',
    'in_meeting': 'In Meeting',
    'absent':     'Absent',
  }[status] ?? status;
}

// ─────────────────────────────────────────────────────────────
class NoDuesItem {
  final int    reqId;
  final String subjectCode;
  final String subjectName;
  final String facultyName;
  final String deptName;
  final bool   assign1;
  final bool   assign2;
  final bool   assign3;
  final bool   mcq1;
  final bool   mcq2;
  final bool   mcq3;
  final bool   seminar;
  final String status;       // pending | approved | rejected
  final String? approvedAt;
  final String? facultyRemarks;
  final String? signatureData;
  final String? qrVerifyHash;

  NoDuesItem({
    required this.reqId,
    required this.subjectCode,
    required this.subjectName,
    required this.facultyName,
    required this.deptName,
    required this.assign1,
    required this.assign2,
    required this.assign3,
    required this.mcq1,
    required this.mcq2,
    required this.mcq3,
    required this.seminar,
    required this.status,
    this.approvedAt,
    this.facultyRemarks,
    this.signatureData,
    this.qrVerifyHash,
  });

  factory NoDuesItem.fromJson(Map<String, dynamic> j) => NoDuesItem(
    reqId:          j['req_id'],
    subjectCode:    j['subject_code']  ?? '',
    subjectName:    j['subject_name']  ?? '',
    facultyName:    j['faculty_name']  ?? '',
    deptName:       j['dept_name']     ?? '',
    assign1:        j['assign1_submitted'] == 1 || j['assign1_submitted'] == true,
    assign2:        j['assign2_submitted'] == 1 || j['assign2_submitted'] == true,
    assign3:        j['assign3_submitted'] == 1 || j['assign3_submitted'] == true,
    mcq1:           j['mcq1_cleared']  == 1 || j['mcq1_cleared']  == true,
    mcq2:           j['mcq2_cleared']  == 1 || j['mcq2_cleared']  == true,
    mcq3:           j['mcq3_cleared']  == 1 || j['mcq3_cleared']  == true,
    seminar:        j['seminar_done']  == 1 || j['seminar_done']  == true,
    status:         j['overall_status'] ?? 'pending',
    approvedAt:     j['approved_at'],
    facultyRemarks: j['faculty_remarks'],
    signatureData:  j['signature_data'],
    qrVerifyHash:   j['qr_verify_hash'],
  );

  bool get allItemsDone =>
    assign1 && assign2 && assign3 &&
    mcq1 && mcq2 && mcq3 && seminar;

  String get facultyInitials => facultyName.split(' ')
    .where((w) => w.isNotEmpty).take(2)
    .map((w) => w[0].toUpperCase()).join();
}

// ─────────────────────────────────────────────────────────────
class TimetableEntry {
  final String subjectCode;
  final String subjectName;
  final String startTime;
  final String endTime;
  final String roomNumber;
  final int    floor;
  final String building;

  TimetableEntry({
    required this.subjectCode,
    required this.subjectName,
    required this.startTime,
    required this.endTime,
    required this.roomNumber,
    required this.floor,
    required this.building,
  });

  factory TimetableEntry.fromJson(Map<String, dynamic> j) => TimetableEntry(
    subjectCode: j['subject_code'] ?? '',
    subjectName: j['subject_name'] ?? '',
    startTime:   j['start_time']   ?? '',
    endTime:     j['end_time']     ?? '',
    roomNumber:  j['room_number']  ?? '',
    floor:       j['floor']        ?? 0,
    building:    j['building']     ?? '',
  );
}

// ─────────────────────────────────────────────────────────────
class NoDuesRequest {
  final int    requestId;
  final int    reqId;
  final String studentName;
  final String rollNumber;
  final String subjectName;
  final String subjectCode;
  final String requestedAt;
  final bool   assign1;
  final bool   assign2;
  final bool   assign3;
  final bool   mcq1;
  final bool   mcq2;
  final bool   mcq3;
  final bool   seminar;

  NoDuesRequest({
    required this.requestId,
    required this.reqId,
    required this.studentName,
    required this.rollNumber,
    required this.subjectName,
    required this.subjectCode,
    required this.requestedAt,
    required this.assign1,
    required this.assign2,
    required this.assign3,
    required this.mcq1,
    required this.mcq2,
    required this.mcq3,
    required this.seminar,
  });

  factory NoDuesRequest.fromJson(Map<String, dynamic> j) => NoDuesRequest(
    requestId:   j['request_id'],
    reqId:       j['req_id'],
    studentName: j['student_name'] ?? '',
    rollNumber:  j['roll_number']  ?? '',
    subjectName: j['subject_name'] ?? '',
    subjectCode: j['subject_code'] ?? '',
    requestedAt: j['requested_at'] ?? '',
    assign1:     j['assign1_submitted'] == 1 || j['assign1_submitted'] == true,
    assign2:     j['assign2_submitted'] == 1 || j['assign2_submitted'] == true,
    assign3:     j['assign3_submitted'] == 1 || j['assign3_submitted'] == true,
    mcq1:        j['mcq1_cleared']  == 1 || j['mcq1_cleared']  == true,
    mcq2:        j['mcq2_cleared']  == 1 || j['mcq2_cleared']  == true,
    mcq3:        j['mcq3_cleared']  == 1 || j['mcq3_cleared']  == true,
    seminar:     j['seminar_done']  == 1 || j['seminar_done']  == true,
  );
}
