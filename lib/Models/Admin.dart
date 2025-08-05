import 'User.dart';

// The Admin model.
class Admin {
  // It holds a User object.
  final User userProfile;

  Admin({required this.userProfile}) {
    // We must enforce the rule that this user IS an admin.
    if (userProfile.role != UserRole.admin) {
      throw ArgumentError('The provided user profile must have the role of Admin.');
    }
  }

  // All the properties are just pointers to the userProfile.
  String get id => userProfile.id;
  String get fullName => userProfile.fullName;
  String get email => userProfile.email;
// ...and so on for every single field.
}