import 'dart:convert';

// For a robust system, we define roles as an enum, not a raw String.
// This prevents typos and makes the code self-documenting.
enum UserRole {
  superadmin,
  admin,
  doctor,
  pharmacist,
  pathologist,
  reception,
  unknown, // A fallback for safety
}

/// The foundational User model for the Hospital Management System.
/// This class represents the core identity and shared data for any person
/// interacting with the system, regardless of their role.
class User {
  /// The unique identifier from the authentication system (e.g., Firebase Auth UID).
  final String id;

  /// The user's designated role within the HMS.
  final UserRole role;

  final String firstName;
  final String lastName;

  /// We use DateTime for dates. It's type-safe and prevents formatting errors.
  /// The conversion to a displayable String should happen in the UI, not in the model.
  final DateTime? dateOfBirth;

  final String email;
  final String phone;

  // Address information
  final String country;
  final String state;
  final String city;

  /// A timestamp for when the user record was created in the database.
  final DateTime createdAt;

  User({
    required this.id,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.dateOfBirth,
    required this.email,
    required this.phone,
    required this.country,
    required this.state,
    required this.city,
    required this.createdAt,
  });

  /// A computed property to get the full name.
  String get fullName => '$firstName $lastName';

  /// A computed property to calculate the current age.
  /// Returns null if dateOfBirth is not set.
  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    int age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }

  /// Creates a copy of the instance with optional new values.
  /// This is invaluable for state management (e.g., with Riverpod or BLoC).
  User copyWith({
    String? id,
    UserRole? role,
    String? firstName,
    String? lastName,
    DateTime? dateOfBirth,
    String? email,
    String? phone,
    String? country,
    String? state,
    String? city,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      role: role ?? this.role,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      country: country ?? this.country,
      state: state ?? this.state,
      city: city ?? this.city,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Serializes the User object to a Map (JSON).
  /// This is used when sending data TO the server (Node.js).
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      // We store the enum as a string for readability in the database.
      'role': role.name,
      'firstName': firstName,
      'lastName': lastName,
      // Dates are sent in a standard, machine-readable format (ISO 8601).
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'email': email,
      'phone': phone,
      'country': country,
      'state': state,
      'city': city,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Deserializes a Map (from JSON) into a User object.
  /// This is used when receiving data FROM the server.
  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] ?? '',
      // We parse the string from the DB back into our safe UserRole enum.
      role: UserRole.values.firstWhere(
            (e) => e.name == map['role'],
        orElse: () => UserRole.unknown,
      ),
      firstName: map['firstName'] ?? '',
      lastName: map['lastName'] ?? '',
      // We safely parse the date string back into a DateTime object.
      dateOfBirth: map['dateOfBirth'] != null
          ? DateTime.tryParse(map['dateOfBirth'])
          : null,
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      country: map['country'] ?? '',
      state: map['state'] ?? '',
      city: map['city'] ?? '',
      // We must also parse the createdAt timestamp.
      createdAt: map['createdAt'] != null
          ? DateTime.parse(map['createdAt'])
          : DateTime.now(), // Provide a fallback.
    );
  }

  /// Helper method for JSON encoding.
  String toJson() => json.encode(toMap());

  /// Helper method for JSON decoding.
  factory User.fromJson(String source) => User.fromMap(json.decode(source));
}
