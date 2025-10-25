# Doctor Sidebar Implementation Guide

## 🎯 Goal
Add a sidebar matching Pathology/Pharmacy style for consistency across the application.

---

## 📊 Current State Analysis

### Pathology/Pharmacy Sidebar
```
Features:
- Vertical navigation on left
- Profile section at top
- Dashboard/Reports/Settings items
- Logout at bottom
- Dark background (professional)
- White text/icons
```

### Doctor Module (Current)
```
Missing:
- No sidebar navigation
- Mixed navigation in dashboard
- No profile section
- No logout button visible
- No clear navigation hierarchy
```

---

## 🏗️ Recommended Structure

### New File: `lib/Modules/Doctor/widgets/DoctorSidebar.dart`

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../../Utils/Colors.dart';
import '../../../Services/Authservices.dart';

class DoctorSidebar extends StatefulWidget {
  final String currentPage;
  final Function(String) onPageChanged;

  const DoctorSidebar({
    super.key,
    required this.currentPage,
    required this.onPageChanged,
  });

  @override
  State<DoctorSidebar> createState() => _DoctorSidebarState();
}

class _DoctorSidebarState extends State<DoctorSidebar> {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      color: AppColors.primary.withOpacity(0.95),
      child: Column(
        children: [
          // Profile Section
          _buildProfileSection(),
          
          const SizedBox(height: 24),
          
          // Navigation Items
          _buildNavItem(
            icon: Iconsax.home,
            label: 'Dashboard',
            page: 'dashboard',
            isActive: widget.currentPage == 'dashboard',
          ),
          _buildNavItem(
            icon: Iconsax.calendar,
            label: 'Appointments',
            page: 'appointments',
            isActive: widget.currentPage == 'appointments',
          ),
          _buildNavItem(
            icon: Iconsax.people,
            label: 'Patients',
            page: 'patients',
            isActive: widget.currentPage == 'patients',
          ),
          _buildNavItem(
            icon: Iconsax.clock,
            label: 'Schedule',
            page: 'schedule',
            isActive: widget.currentPage == 'schedule',
          ),
          _buildNavItem(
            icon: Iconsax.receipt,
            label: 'Medical Records',
            page: 'records',
            isActive: widget.currentPage == 'records',
          ),
          
          const Spacer(),
          
          // Settings
          _buildNavItem(
            icon: Iconsax.setting_2,
            label: 'Settings',
            page: 'settings',
            isActive: widget.currentPage == 'settings',
          ),
          
          const SizedBox(height: 8),
          
          // Logout
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _handleLogout,
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: Colors.red.withOpacity(0.3),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Iconsax.logout,
                      color: Colors.red,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Logout',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.red,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildProfileSection() {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          Center(
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.accentPink,
                  ],
                ),
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: Center(
                child: Text(
                  'DR',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          
          // Name
          Center(
            child: Text(
              'Dr. John Smith',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 0.3,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          
          const SizedBox(height: 4),
          
          // Specialization
          Center(
            child: Text(
              'Dermatologist',
              style: GoogleFonts.roboto(
                fontSize: 12,
                fontWeight: FontWeight.w400,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required String page,
    required bool isActive,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => widget.onPageChanged(page),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isActive
                ? Colors.white.withOpacity(0.15)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isActive
                  ? Colors.white.withOpacity(0.3)
                  : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: isActive
                        ? FontWeight.w700
                        : FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              if (isActive)
                Icon(
                  Iconsax.arrow_right_3,
                  color: Colors.white,
                  size: 16,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Iconsax.warning_2, color: Colors.red),
            const SizedBox(width: 12),
            const Text('Confirm Logout'),
          ],
        ),
        content: const Text(
          'Are you sure you want to logout? You will need to login again to access your account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              // Call logout from AuthService
              await AuthService.instance.logout();
              if (mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔧 Integration in RootPage

### Updated RootPage.dart

```dart
import 'package:flutter/material.dart';
import './widgets/DoctorSidebar.dart';
import './DashboardPageTabbed.dart';
import './AppointmentsPage.dart';

class DoctorRootPage extends StatefulWidget {
  const DoctorRootPage({super.key});

  @override
  State<DoctorRootPage> createState() => _DoctorRootPageState();
}

class _DoctorRootPageState extends State<DoctorRootPage> {
  String _currentPage = 'dashboard';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          DoctorSidebar(
            currentPage: _currentPage,
            onPageChanged: (page) {
              setState(() => _currentPage = page);
            },
          ),
          
          // Main Content
          Expanded(
            child: _buildPageContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildPageContent() {
    switch (_currentPage) {
      case 'dashboard':
        return const DoctorDashboardTabbedScreen();
      case 'appointments':
        return const AppointmentsPage();
      case 'patients':
        return const Center(child: Text('Patients Page'));
      case 'schedule':
        return const Center(child: Text('Schedule Page'));
      case 'records':
        return const Center(child: Text('Medical Records Page'));
      case 'settings':
        return const Center(child: Text('Settings Page'));
      default:
        return const DoctorDashboardTabbedScreen();
    }
  }
}
```

---

## 📱 Responsive Design

### Desktop (1200px+)
```
┌─────────┬──────────────────────────────┐
│Sidebar  │ Main Content                 │
│(280px)  │ (Responsive)                 │
│         │                              │
└─────────┴──────────────────────────────┘
```

### Tablet (600px - 1200px)
```
Option 1: Keep sidebar, shrink to 240px
Option 2: Convert to collapsible drawer

class DoctorSidebar {
  bool get isCollapsed => MediaQuery.of(context).size.width < 900;
}
```

### Mobile (< 600px)
```
No sidebar, use Drawer instead

Scaffold(
  drawer: DoctorSidebar(...),
  appBar: AppBar(
    leading: MenuButton(),
  ),
)
```

---

## 🎨 Color Scheme

```dart
// Primary Background (Sidebar)
AppColors.primary.withOpacity(0.95)  // Dark professional

// Active Item
Colors.white.withOpacity(0.15)  // Subtle highlight

// Hover State
Colors.white.withOpacity(0.08)  // Very subtle

// Text
Colors.white  // High contrast

// Icons
Colors.white  // Consistent
Iconsax icons (20-22px)
```

---

## ✨ Features

1. **Profile Section**
   - Avatar with initials
   - Doctor name
   - Specialization

2. **Navigation Items**
   - Dashboard
   - Appointments (with our new table!)
   - Patients
   - Schedule
   - Medical Records

3. **Settings & Logout**
   - Settings page
   - Logout with confirmation

4. **Active State Indicator**
   - Highlight current page
   - Arrow indicator
   - Bold font weight

---

## 🚀 Implementation Steps

1. **Create DoctorSidebar.dart**
   ```bash
   # Copy code from above section
   ```

2. **Update RootPage.dart**
   ```bash
   # Integrate sidebar with content
   ```

3. **Update Main Navigation**
   ```dart
   // In main.dart, use DoctorRootPage instead of DashboardPageTabbed
   ```

4. **Test All Pages**
   - Navigate between sections
   - Test logout
   - Test responsive behavior

5. **Consistency Pass**
   - Match Pathology colors
   - Match Pharmacy spacing
   - Use same icons

---

## 🔗 Consistency with Other Modules

### Pathology Sidebar
- ✅ Same width (280px)
- ✅ Same background color style
- ✅ Same navigation item styling
- ✅ Same logout styling

### Pharmacy Sidebar  
- ✅ Profile section at top
- ✅ Icon + label pattern
- ✅ Active state highlighting
- ✅ Logout at bottom

---

## 📊 Benefits

| Aspect | Benefit |
|--------|---------|
| Consistency | Matches other modules |
| Navigation | Clear, easy to use |
| Professionalism | Enterprise appearance |
| Organization | Logical page hierarchy |
| Mobile-ready | Converts to drawer |
| Accessibility | Clear labels + icons |

---

## 🧪 Testing Checklist

- [ ] Sidebar renders on all pages
- [ ] Navigation works between pages
- [ ] Active page highlights correctly
- [ ] Logout button shows confirmation
- [ ] Responsive on tablet/mobile
- [ ] Colors match design
- [ ] Icons are correct size
- [ ] Text is readable
- [ ] Animations are smooth

---

## 📝 Notes

- Profile data should come from `AuthService.instance.userProfile()`
- Logout should clear local cache via `AuthService.instance.logout()`
- Add animations for page transitions
- Consider adding search in sidebar for quick navigation
- Can add recent items or favorites

---

**Status:** ✅ Ready to Implement
**Priority:** High (Improves UX significantly)
**Estimated Time:** 2-3 hours

