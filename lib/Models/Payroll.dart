// lib/Models/Payroll.dart

class SalaryComponent {
  final String name;
  final String type; // 'earning', 'deduction', 'reimbursement'
  final double amount;
  final bool isPercentage;
  final String percentageOf; // 'basic', 'gross', 'ctc'
  final bool isTaxable;
  final bool isStatutory;
  final String calculationFormula;
  final String description;

  SalaryComponent({
    required this.name,
    required this.type,
    this.amount = 0,
    this.isPercentage = false,
    this.percentageOf = 'basic',
    this.isTaxable = true,
    this.isStatutory = false,
    this.calculationFormula = '',
    this.description = '',
  });

  factory SalaryComponent.fromMap(Map<String, dynamic> map) {
    return SalaryComponent(
      name: map['name']?.toString() ?? '',
      type: map['type']?.toString() ?? 'earning',
      amount: (map['amount'] ?? 0).toDouble(),
      isPercentage: map['isPercentage'] == true,
      percentageOf: map['percentageOf']?.toString() ?? 'basic',
      isTaxable: map['isTaxable'] != false,
      isStatutory: map['isStatutory'] == true,
      calculationFormula: map['calculationFormula']?.toString() ?? '',
      description: map['description']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'amount': amount,
      'isPercentage': isPercentage,
      'percentageOf': percentageOf,
      'isTaxable': isTaxable,
      'isStatutory': isStatutory,
      'calculationFormula': calculationFormula,
      'description': description,
    };
  }
}

class AttendanceSummary {
  final int totalDays;
  final int presentDays;
  final int absentDays;
  final int halfDays;
  final int lateDays;
  final double overtimeHours;
  final Map<String, int> leaves;
  final int holidays;
  final int weekends;

  AttendanceSummary({
    this.totalDays = 0,
    this.presentDays = 0,
    this.absentDays = 0,
    this.halfDays = 0,
    this.lateDays = 0,
    this.overtimeHours = 0,
    this.leaves = const {},
    this.holidays = 0,
    this.weekends = 0,
  });

  factory AttendanceSummary.fromMap(Map<String, dynamic> map) {
    Map<String, int> parseLeaves(dynamic l) {
      if (l is Map) {
        return l.map((k, v) => MapEntry(k.toString(), (v ?? 0) is int ? v : int.tryParse(v.toString()) ?? 0));
      }
      return {'casual': 0, 'sick': 0, 'earned': 0, 'unpaid': 0, 'other': 0};
    }

    return AttendanceSummary(
      totalDays: int.tryParse(map['totalDays']?.toString() ?? '0') ?? 0,
      presentDays: int.tryParse(map['presentDays']?.toString() ?? '0') ?? 0,
      absentDays: int.tryParse(map['absentDays']?.toString() ?? '0') ?? 0,
      halfDays: int.tryParse(map['halfDays']?.toString() ?? '0') ?? 0,
      lateDays: int.tryParse(map['lateDays']?.toString() ?? '0') ?? 0,
      overtimeHours: (map['overtimeHours'] ?? 0).toDouble(),
      leaves: parseLeaves(map['leaves']),
      holidays: int.tryParse(map['holidays']?.toString() ?? '0') ?? 0,
      weekends: int.tryParse(map['weekends']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalDays': totalDays,
      'presentDays': presentDays,
      'absentDays': absentDays,
      'halfDays': halfDays,
      'lateDays': lateDays,
      'overtimeHours': overtimeHours,
      'leaves': leaves,
      'holidays': holidays,
      'weekends': weekends,
    };
  }
}

class StatutoryCompliance {
  final String pfNumber;
  final String esiNumber;
  final String uanNumber;
  final String panNumber;
  final String aadharNumber;
  final bool pfApplicable;
  final bool esiApplicable;
  final bool ptApplicable;
  final double employeePF;
  final double employerPF;
  final double employeeESI;
  final double employerESI;
  final double professionalTax;
  final double tdsDeducted;

  StatutoryCompliance({
    this.pfNumber = '',
    this.esiNumber = '',
    this.uanNumber = '',
    this.panNumber = '',
    this.aadharNumber = '',
    this.pfApplicable = true,
    this.esiApplicable = false,
    this.ptApplicable = true,
    this.employeePF = 0,
    this.employerPF = 0,
    this.employeeESI = 0,
    this.employerESI = 0,
    this.professionalTax = 0,
    this.tdsDeducted = 0,
  });

  factory StatutoryCompliance.fromMap(Map<String, dynamic> map) {
    return StatutoryCompliance(
      pfNumber: map['pfNumber']?.toString() ?? '',
      esiNumber: map['esiNumber']?.toString() ?? '',
      uanNumber: map['uanNumber']?.toString() ?? '',
      panNumber: map['panNumber']?.toString() ?? '',
      aadharNumber: map['aadharNumber']?.toString() ?? '',
      pfApplicable: map['pfApplicable'] != false,
      esiApplicable: map['esiApplicable'] == true,
      ptApplicable: map['ptApplicable'] != false,
      employeePF: (map['employeePF'] ?? 0).toDouble(),
      employerPF: (map['employerPF'] ?? 0).toDouble(),
      employeeESI: (map['employeeESI'] ?? 0).toDouble(),
      employerESI: (map['employerESI'] ?? 0).toDouble(),
      professionalTax: (map['professionalTax'] ?? 0).toDouble(),
      tdsDeducted: (map['tdsDeducted'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pfNumber': pfNumber,
      'esiNumber': esiNumber,
      'uanNumber': uanNumber,
      'panNumber': panNumber,
      'aadharNumber': aadharNumber,
      'pfApplicable': pfApplicable,
      'esiApplicable': esiApplicable,
      'ptApplicable': ptApplicable,
      'employeePF': employeePF,
      'employerPF': employerPF,
      'employeeESI': employeeESI,
      'employerESI': employerESI,
      'professionalTax': professionalTax,
      'tdsDeducted': tdsDeducted,
    };
  }
}

class LoanAdvance {
  final String type; // 'loan', 'advance', 'recovery'
  final double amount;
  final double installmentAmount;
  final double remainingAmount;
  final String description;
  final DateTime date;

  LoanAdvance({
    this.type = 'advance',
    this.amount = 0,
    this.installmentAmount = 0,
    this.remainingAmount = 0,
    this.description = '',
    DateTime? date,
  }) : date = date ?? DateTime.now();

  factory LoanAdvance.fromMap(Map<String, dynamic> map) {
    return LoanAdvance(
      type: map['type']?.toString() ?? 'advance',
      amount: (map['amount'] ?? 0).toDouble(),
      installmentAmount: (map['installmentAmount'] ?? 0).toDouble(),
      remainingAmount: (map['remainingAmount'] ?? 0).toDouble(),
      description: map['description']?.toString() ?? '',
      date: map['date'] != null ? DateTime.tryParse(map['date'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'amount': amount,
      'installmentAmount': installmentAmount,
      'remainingAmount': remainingAmount,
      'description': description,
      'date': date.toIso8601String(),
    };
  }
}

class Payroll {
  final String id;
  final String staffId;
  final String staffName;
  final String staffCode;
  final String department;
  final String designation;
  final String email;
  final String contact;

  final int payPeriodMonth;
  final int payPeriodYear;
  final DateTime payPeriodStart;
  final DateTime payPeriodEnd;
  final DateTime? paymentDate;

  final String status; // 'draft', 'pending', 'approved', 'processed', 'paid', 'rejected', 'on_hold'

  final double basicSalary;
  final List<SalaryComponent> earnings;
  final List<SalaryComponent> deductions;
  final List<SalaryComponent> reimbursements;

  final double totalEarnings;
  final double totalDeductions;
  final double totalReimbursements;
  final double grossSalary;
  final double netSalary;
  final double ctc;

  final AttendanceSummary attendance;
  final StatutoryCompliance statutory;
  final List<LoanAdvance> loansAdvances;
  final double totalLoanDeduction;

  final double overtimePay;
  final double bonus;
  final double incentives;
  final double arrears;
  final int lossOfPayDays;
  final double lossOfPayAmount;

  final String paymentMode;
  final String bankName;
  final String accountNumber;
  final String ifscCode;
  final String transactionId;
  final String chequeNumber;

  final String submittedBy;
  final DateTime? submittedAt;
  final String approvedBy;
  final DateTime? approvedAt;
  final String rejectedBy;
  final DateTime? rejectedAt;
  final String rejectionReason;

  final String notes;
  final String internalNotes;
  final String adminRemarks;

  final int revisionNumber;
  final String previousRevisionId;
  final bool isRevision;

  final List<String> tags;
  final String payrollGroup;
  final Map<String, dynamic> metadata;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool isSelected;

  Payroll({
    required this.id,
    required this.staffId,
    required this.staffName,
    this.staffCode = '',
    this.department = '',
    this.designation = '',
    this.email = '',
    this.contact = '',
    required this.payPeriodMonth,
    required this.payPeriodYear,
    required this.payPeriodStart,
    required this.payPeriodEnd,
    this.paymentDate,
    this.status = 'draft',
    this.basicSalary = 0,
    this.earnings = const [],
    this.deductions = const [],
    this.reimbursements = const [],
    this.totalEarnings = 0,
    this.totalDeductions = 0,
    this.totalReimbursements = 0,
    this.grossSalary = 0,
    this.netSalary = 0,
    this.ctc = 0,
    AttendanceSummary? attendance,
    StatutoryCompliance? statutory,
    this.loansAdvances = const [],
    this.totalLoanDeduction = 0,
    this.overtimePay = 0,
    this.bonus = 0,
    this.incentives = 0,
    this.arrears = 0,
    this.lossOfPayDays = 0,
    this.lossOfPayAmount = 0,
    this.paymentMode = 'bank_transfer',
    this.bankName = '',
    this.accountNumber = '',
    this.ifscCode = '',
    this.transactionId = '',
    this.chequeNumber = '',
    this.submittedBy = '',
    this.submittedAt,
    this.approvedBy = '',
    this.approvedAt,
    this.rejectedBy = '',
    this.rejectedAt,
    this.rejectionReason = '',
    this.notes = '',
    this.internalNotes = '',
    this.adminRemarks = '',
    this.revisionNumber = 1,
    this.previousRevisionId = '',
    this.isRevision = false,
    this.tags = const [],
    this.payrollGroup = 'regular',
    this.metadata = const {},
    this.createdAt,
    this.updatedAt,
    this.isSelected = false,
  })  : attendance = attendance ?? AttendanceSummary(),
        statutory = statutory ?? StatutoryCompliance();

  // Helper method for parsing dates
  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    try {
      return DateTime.tryParse(v.toString());
    } catch (_) {
      return null;
    }
  }

  // Helper method for parsing string lists
  static List<String> _parseStringList(dynamic v) {
    if (v == null) return <String>[];
    if (v is List) return v.map((e) => e.toString()).toList();
    return <String>[];
  }

  // Helper method for parsing metadata
  static Map<String, dynamic> _parseMetadata(dynamic m) {
    if (m == null) return <String, dynamic>{};
    if (m is Map) {
      return Map<String, dynamic>.from(m);
    }
    return <String, dynamic>{};
  }

  // Helper method for parsing SalaryComponent lists
  static List<SalaryComponent> _parseSalaryComponentList(dynamic v) {
    if (v == null) return <SalaryComponent>[];
    if (v is List) {
      return v.map((e) {
        if (e is Map) {
          return SalaryComponent.fromMap(Map<String, dynamic>.from(e));
        }
        return null;
      }).whereType<SalaryComponent>().toList();
    }
    return <SalaryComponent>[];
  }

  // Helper method for parsing LoanAdvance lists
  static List<LoanAdvance> _parseLoanAdvanceList(dynamic v) {
    if (v == null) return <LoanAdvance>[];
    if (v is List) {
      return v.map((e) {
        if (e is Map) {
          return LoanAdvance.fromMap(Map<String, dynamic>.from(e));
        }
        return null;
      }).whereType<LoanAdvance>().toList();
    }
    return <LoanAdvance>[];
  }

  factory Payroll.fromMap(Map<String, dynamic> map) {
    return Payroll(
      id: map['_id']?.toString() ?? map['id']?.toString() ?? '',
      staffId: map['staffId']?.toString() ?? '',
      staffName: map['staffName']?.toString() ?? '',
      staffCode: map['staffCode']?.toString() ?? '',
      department: map['department']?.toString() ?? '',
      designation: map['designation']?.toString() ?? '',
      email: map['email']?.toString() ?? '',
      contact: map['contact']?.toString() ?? '',
      payPeriodMonth: int.tryParse(map['payPeriodMonth']?.toString() ?? '0') ?? 0,
      payPeriodYear: int.tryParse(map['payPeriodYear']?.toString() ?? '0') ?? 0,
      payPeriodStart: _parseDate(map['payPeriodStart']) ?? DateTime.now(),
      payPeriodEnd: _parseDate(map['payPeriodEnd']) ?? DateTime.now(),
      paymentDate: _parseDate(map['paymentDate']),
      status: map['status']?.toString() ?? 'draft',
      basicSalary: (map['basicSalary'] ?? 0).toDouble(),
      earnings: _parseSalaryComponentList(map['earnings']),
      deductions: _parseSalaryComponentList(map['deductions']),
      reimbursements: _parseSalaryComponentList(map['reimbursements']),
      totalEarnings: (map['totalEarnings'] ?? 0).toDouble(),
      totalDeductions: (map['totalDeductions'] ?? 0).toDouble(),
      totalReimbursements: (map['totalReimbursements'] ?? 0).toDouble(),
      grossSalary: (map['grossSalary'] ?? 0).toDouble(),
      netSalary: (map['netSalary'] ?? 0).toDouble(),
      ctc: (map['ctc'] ?? 0).toDouble(),
      attendance: map['attendance'] != null ? AttendanceSummary.fromMap(Map<String, dynamic>.from(map['attendance'])) : null,
      statutory: map['statutory'] != null ? StatutoryCompliance.fromMap(Map<String, dynamic>.from(map['statutory'])) : null,
      loansAdvances: _parseLoanAdvanceList(map['loansAdvances']),
      totalLoanDeduction: (map['totalLoanDeduction'] ?? 0).toDouble(),
      overtimePay: (map['overtimePay'] ?? 0).toDouble(),
      bonus: (map['bonus'] ?? 0).toDouble(),
      incentives: (map['incentives'] ?? 0).toDouble(),
      arrears: (map['arrears'] ?? 0).toDouble(),
      lossOfPayDays: int.tryParse(map['lossOfPayDays']?.toString() ?? '0') ?? 0,
      lossOfPayAmount: (map['lossOfPayAmount'] ?? 0).toDouble(),
      paymentMode: map['paymentMode']?.toString() ?? 'bank_transfer',
      bankName: map['bankName']?.toString() ?? '',
      accountNumber: map['accountNumber']?.toString() ?? '',
      ifscCode: map['ifscCode']?.toString() ?? '',
      transactionId: map['transactionId']?.toString() ?? '',
      chequeNumber: map['chequeNumber']?.toString() ?? '',
      submittedBy: map['submittedBy']?.toString() ?? '',
      submittedAt: _parseDate(map['submittedAt']),
      approvedBy: map['approvedBy']?.toString() ?? '',
      approvedAt: _parseDate(map['approvedAt']),
      rejectedBy: map['rejectedBy']?.toString() ?? '',
      rejectedAt: _parseDate(map['rejectedAt']),
      rejectionReason: map['rejectionReason']?.toString() ?? '',
      notes: map['notes']?.toString() ?? '',
      internalNotes: map['internalNotes']?.toString() ?? '',
      adminRemarks: map['adminRemarks']?.toString() ?? '',
      revisionNumber: int.tryParse(map['revisionNumber']?.toString() ?? '1') ?? 1,
      previousRevisionId: map['previousRevisionId']?.toString() ?? '',
      isRevision: map['isRevision'] == true,
      tags: _parseStringList(map['tags']),
      payrollGroup: map['payrollGroup']?.toString() ?? 'regular',
      metadata: _parseMetadata(map['metadata']),
      createdAt: _parseDate(map['createdAt']),
      updatedAt: _parseDate(map['updatedAt']),
      isSelected: map['isSelected'] == true,
    );
  }

  factory Payroll.fromJson(Map<String, dynamic> json) => Payroll.fromMap(json);

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) '_id': id,
      'staffId': staffId,
      'staffName': staffName,
      'staffCode': staffCode,
      'department': department,
      'designation': designation,
      'email': email,
      'contact': contact,
      'payPeriodMonth': payPeriodMonth,
      'payPeriodYear': payPeriodYear,
      'payPeriodStart': payPeriodStart.toIso8601String(),
      'payPeriodEnd': payPeriodEnd.toIso8601String(),
      if (paymentDate != null) 'paymentDate': paymentDate!.toIso8601String(),
      'status': status,
      'basicSalary': basicSalary,
      'earnings': earnings.map((e) => e.toJson()).toList(),
      'deductions': deductions.map((e) => e.toJson()).toList(),
      'reimbursements': reimbursements.map((e) => e.toJson()).toList(),
      'totalEarnings': totalEarnings,
      'totalDeductions': totalDeductions,
      'totalReimbursements': totalReimbursements,
      'grossSalary': grossSalary,
      'netSalary': netSalary,
      'ctc': ctc,
      'attendance': attendance.toJson(),
      'statutory': statutory.toJson(),
      'loansAdvances': loansAdvances.map((e) => e.toJson()).toList(),
      'totalLoanDeduction': totalLoanDeduction,
      'overtimePay': overtimePay,
      'bonus': bonus,
      'incentives': incentives,
      'arrears': arrears,
      'lossOfPayDays': lossOfPayDays,
      'lossOfPayAmount': lossOfPayAmount,
      'paymentMode': paymentMode,
      'bankName': bankName,
      'accountNumber': accountNumber,
      'ifscCode': ifscCode,
      'transactionId': transactionId,
      'chequeNumber': chequeNumber,
      'submittedBy': submittedBy,
      if (submittedAt != null) 'submittedAt': submittedAt!.toIso8601String(),
      'approvedBy': approvedBy,
      if (approvedAt != null) 'approvedAt': approvedAt!.toIso8601String(),
      'rejectedBy': rejectedBy,
      if (rejectedAt != null) 'rejectedAt': rejectedAt!.toIso8601String(),
      'rejectionReason': rejectionReason,
      'notes': notes,
      'internalNotes': internalNotes,
      'adminRemarks': adminRemarks,
      'revisionNumber': revisionNumber,
      'previousRevisionId': previousRevisionId,
      'isRevision': isRevision,
      'tags': tags,
      'payrollGroup': payrollGroup,
      'metadata': metadata,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      'isSelected': isSelected,
    };
  }

  Payroll copyWith({
    String? id,
    String? staffId,
    String? staffName,
    String? staffCode,
    String? department,
    String? designation,
    String? email,
    String? contact,
    int? payPeriodMonth,
    int? payPeriodYear,
    DateTime? payPeriodStart,
    DateTime? payPeriodEnd,
    DateTime? paymentDate,
    String? status,
    double? basicSalary,
    List<SalaryComponent>? earnings,
    List<SalaryComponent>? deductions,
    List<SalaryComponent>? reimbursements,
    double? totalEarnings,
    double? totalDeductions,
    double? totalReimbursements,
    double? grossSalary,
    double? netSalary,
    double? ctc,
    AttendanceSummary? attendance,
    StatutoryCompliance? statutory,
    List<LoanAdvance>? loansAdvances,
    double? totalLoanDeduction,
    double? overtimePay,
    double? bonus,
    double? incentives,
    double? arrears,
    int? lossOfPayDays,
    double? lossOfPayAmount,
    String? paymentMode,
    String? bankName,
    String? accountNumber,
    String? ifscCode,
    String? transactionId,
    String? chequeNumber,
    String? notes,
    String? internalNotes,
    String? adminRemarks,
    List<String>? tags,
    String? payrollGroup,
    Map<String, dynamic>? metadata,
    bool? isSelected,
  }) {
    return Payroll(
      id: id ?? this.id,
      staffId: staffId ?? this.staffId,
      staffName: staffName ?? this.staffName,
      staffCode: staffCode ?? this.staffCode,
      department: department ?? this.department,
      designation: designation ?? this.designation,
      email: email ?? this.email,
      contact: contact ?? this.contact,
      payPeriodMonth: payPeriodMonth ?? this.payPeriodMonth,
      payPeriodYear: payPeriodYear ?? this.payPeriodYear,
      payPeriodStart: payPeriodStart ?? this.payPeriodStart,
      payPeriodEnd: payPeriodEnd ?? this.payPeriodEnd,
      paymentDate: paymentDate ?? this.paymentDate,
      status: status ?? this.status,
      basicSalary: basicSalary ?? this.basicSalary,
      earnings: earnings ?? List.from(this.earnings),
      deductions: deductions ?? List.from(this.deductions),
      reimbursements: reimbursements ?? List.from(this.reimbursements),
      totalEarnings: totalEarnings ?? this.totalEarnings,
      totalDeductions: totalDeductions ?? this.totalDeductions,
      totalReimbursements: totalReimbursements ?? this.totalReimbursements,
      grossSalary: grossSalary ?? this.grossSalary,
      netSalary: netSalary ?? this.netSalary,
      ctc: ctc ?? this.ctc,
      attendance: attendance ?? this.attendance,
      statutory: statutory ?? this.statutory,
      loansAdvances: loansAdvances ?? List.from(this.loansAdvances),
      totalLoanDeduction: totalLoanDeduction ?? this.totalLoanDeduction,
      overtimePay: overtimePay ?? this.overtimePay,
      bonus: bonus ?? this.bonus,
      incentives: incentives ?? this.incentives,
      arrears: arrears ?? this.arrears,
      lossOfPayDays: lossOfPayDays ?? this.lossOfPayDays,
      lossOfPayAmount: lossOfPayAmount ?? this.lossOfPayAmount,
      paymentMode: paymentMode ?? this.paymentMode,
      bankName: bankName ?? this.bankName,
      accountNumber: accountNumber ?? this.accountNumber,
      ifscCode: ifscCode ?? this.ifscCode,
      transactionId: transactionId ?? this.transactionId,
      chequeNumber: chequeNumber ?? this.chequeNumber,
      notes: notes ?? this.notes,
      internalNotes: internalNotes ?? this.internalNotes,
      adminRemarks: adminRemarks ?? this.adminRemarks,
      tags: tags ?? List.from(this.tags),
      payrollGroup: payrollGroup ?? this.payrollGroup,
      metadata: metadata ?? Map.from(this.metadata),
      submittedBy: submittedBy,
      submittedAt: submittedAt,
      approvedBy: approvedBy,
      approvedAt: approvedAt,
      rejectedBy: rejectedBy,
      rejectedAt: rejectedAt,
      rejectionReason: rejectionReason,
      revisionNumber: revisionNumber,
      previousRevisionId: previousRevisionId,
      isRevision: isRevision,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isSelected: isSelected ?? this.isSelected,
    );
  }

  String get payPeriodDisplay {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (payPeriodMonth >= 1 && payPeriodMonth <= 12) {
      return '${months[payPeriodMonth - 1]} $payPeriodYear';
    }
    return '$payPeriodMonth/$payPeriodYear';
  }

  String get payrollCode {
    return metadata['payrollCode']?.toString() ?? '';
  }

  @override
  String toString() {
    return 'Payroll(id: $id, staffName: $staffName, period: $payPeriodDisplay, status: $status, netSalary: $netSalary)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Payroll && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
