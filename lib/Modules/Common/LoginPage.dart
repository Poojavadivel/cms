// login_page.dart
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';

import '../../Providers/app_providers.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Api_handler.dart';
import '../../Utils/Colors.dart';
import '../Admin/RootPage.dart';
import '../Doctor/RootPage.dart';
import '../Pharmacist/root_page.dart';
import '../Pathologist/root_page.dart';

const String _prefsRememberMeKey = 'remember_me';
const String _prefsEmailKey = 'saved_email';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _captchaController = TextEditingController();
  final AuthService _authService = AuthService.instance;

  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _rememberMe = false;
  String _captchaText = "";

  @override
  void initState() {
    super.initState();
    _refreshCaptcha();
    _loadUserPreferences();
  }

  void _loadUserPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool(_prefsRememberMeKey) ?? false;
    if (rememberMe) {
      final savedEmail = prefs.getString(_prefsEmailKey) ?? '';
      if (mounted) {
        setState(() {
          _rememberMe = rememberMe;
          _emailController.text = savedEmail;
        });
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _captchaController.dispose();
    super.dispose();
  }

  void _refreshCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final random = Random();
    setState(() {
      _captchaText = String.fromCharCodes(Iterable.generate(
          5, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    if (_captchaController.text.toUpperCase() != _captchaText.toUpperCase()) {
      _showError('Invalid captcha. Please try again.');
      _refreshCaptcha();
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authResult = await _authService.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefsRememberMeKey, _rememberMe);
      if (_rememberMe) {
        await prefs.setString(_prefsEmailKey, _emailController.text.trim());
      } else {
        await prefs.remove(_prefsEmailKey);
      }

      if (!mounted) return;

      final appProvider = Provider.of<AppProvider>(context, listen: false);
      appProvider.setUser(authResult.user, authResult.token);

      if (appProvider.isAdmin) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AdminRootPage()));
      } else if (appProvider.isDoctor) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DoctorRootPage()));
      } else if (appProvider.isPharmacist) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const PharmacistRootPage()));
      } else if (appProvider.isPathologist) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const PathologistRootPage()));
      } else {
        // Fallback to doctor page for unknown roles
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DoctorRootPage()));
      }
    } on ApiException catch (e) {
      _showError(e.message);
      _refreshCaptcha();
    } catch (e) {
      _showError('An unexpected error occurred. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isMobile = size.width < 800;

    return Scaffold(
      backgroundColor: AppColors.kBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Center(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 16 : 20,
                  vertical: isMobile ? 12 : 20,
                ),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: 1100,
                    maxHeight: constraints.maxHeight - (isMobile ? 24 : 40),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(isMobile ? 16 : 22),
                    child: Container(
                      color: AppColors.white,
                      child: isMobile ? _buildMobileLayout() : _buildDesktopLayout(),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildDesktopLayout() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Row(
          children: [
            // Left enterprise hero with shimmer effect
            Expanded(
              flex: 1,
              child: Stack(
                children: [
                  // Base container
                  Container(
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradient,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(22),
                        bottomLeft: Radius.circular(22),
                      ),
                      boxShadow: [
                        BoxShadow(color: AppColors.primary.withOpacity(0.06), blurRadius: 24, offset: const Offset(0, 8)),
                      ],
                    ),
                  ),
                  // Z-axis diagonal shimmer overlay
                  Shimmer.fromColors(
                    baseColor: Colors.transparent,
                    highlightColor: Colors.white.withOpacity(0.2),
                    direction: ShimmerDirection.ttb,
                    period: const Duration(seconds: 4),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.white.withOpacity(0.15),
                            Colors.white.withOpacity(0.3),
                            Colors.white.withOpacity(0.15),
                            Colors.transparent,
                          ],
                          stops: const [0.0, 0.3, 0.5, 0.7, 1.0],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          transform: GradientRotation(0.5),
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(22),
                          bottomLeft: Radius.circular(22),
                        ),
                      ),
                    ),
                  ),
                  // Content
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
                    child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top section
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo + Title
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Container(
                                height: 44,
                                width: 44,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.2),
                                    width: 1.5,
                                  ),
                                ),
                                child: Center(
                                  child: Icon(
                                    Icons.local_hospital_rounded,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'KARUR GASTRO',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        color: AppColors.white,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 1.5,
                                        height: 1.2,
                                      ),
                                    ),
                                    Text(
                                      'Healthcare Management',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: AppColors.white.withOpacity(0.75),
                                        fontWeight: FontWeight.w400,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),
                          // Hero heading
                          Text(
                            'Enterprise Healthcare\nManagement System',
                            style: GoogleFonts.inter(
                              color: AppColors.white,
                              fontSize: 34,
                              fontWeight: FontWeight.w800,
                              height: 1.15,
                              letterSpacing: -1.2,
                            ),
                          ),
                          const SizedBox(height: 18),
                          Text(
                            'Secure, HIPAA-compliant platform with role-based access control, comprehensive audit trails, and real-time analytics for modern healthcare operations.',
                            style: GoogleFonts.inter(
                              color: AppColors.white.withOpacity(0.88),
                              fontSize: 15,
                              height: 1.65,
                              fontWeight: FontWeight.w400,
                              letterSpacing: 0.1,
                            ),
                            maxLines: 3,
                          ),
                        ],
                      ),

                      // Middle section - Features
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'KEY FEATURES',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: AppColors.white.withOpacity(0.6),
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.8,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: [
                              _featureChip(Icons.lock_outline, 'Secure Access'),
                              _featureChip(Icons.shield_outlined, 'HIPAA Compliant'),
                              _featureChip(Icons.analytics_outlined, 'Real-time Analytics'),
                              _featureChip(Icons.backup_outlined, 'Auto Backup'),
                            ],
                          ),
                        ],
                      ),

                      // Bottom section
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.white.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: AppColors.white.withOpacity(0.2),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified_rounded, color: AppColors.white, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  'Trusted by 150+ Healthcare Institutions',
                                  style: GoogleFonts.inter(
                                    color: AppColors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            '24/7 Support  •  ISO 27001 Certified  •  99.9% Uptime',
                            style: GoogleFonts.inter(
                              color: AppColors.white.withOpacity(0.72),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Right form
            Expanded(
              flex: 1,
              child: Container(
                color: AppColors.white,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 28),
                  child: _buildLoginForm(),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _logoWithFallback() {
    return ClipOval(
      child: Image.asset(
        'assets/karurlogo.png',
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return ClipOval(
            child: SvgPicture.asset(
              'assets/icons/medical_cross.svg',
              color: AppColors.white,
              fit: BoxFit.scaleDown,
              placeholderBuilder: (_) => _circleFallback(),
            ),
          );
        },
      ),
    );
  }

  Widget _circleFallback() {
    return Container(
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white24,
      ),
      child: Icon(
        Icons.local_hospital_rounded,
        color: AppColors.white,
        size: 20,
      ),
    );
  }


  Widget _buildMobileLayout() {
    return Column(
      children: [
        // compact hero
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
          child: Column(
            children: [
              SizedBox(
                height: 32,
                width: 32,
                child: _logoWithFallback(),
              ),
              const SizedBox(height: 8),
              Text('KARUR GASTRO',
                  style: GoogleFonts.inter(
                    color: AppColors.white, 
                    fontSize: 15, 
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  )),
              const SizedBox(height: 4),
              Text('Healthcare Management System',
                  style: GoogleFonts.inter(
                    color: AppColors.white.withOpacity(0.8), 
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.3,
                  ), 
                  textAlign: TextAlign.center),
            ],
          ),
        ),

        // form card - scrollable if needed
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: _buildLoginForm(compact: true),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginForm({bool compact = false}) {
    final double spacing = compact ? 10 : 14;
    final double sectionSpacing = compact ? 14 : 18;
    
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!compact) ...[
            // Professional brand header (desktop only)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.grey50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.grey200, width: 1),
              ),
              child: Row(
                children: [
                  Container(
                    height: 34,
                    width: 34,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary700, AppColors.primary600],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Icon(Icons.local_hospital_rounded, color: Colors.white, size: 18),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('KARUR GASTRO',
                            style: GoogleFonts.inter(
                              color: AppColors.grey800, 
                              fontSize: 12, 
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                            )),
                        Text('Healthcare Management',
                            style: GoogleFonts.inter(
                              color: AppColors.grey500, 
                              fontSize: 10, 
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.2,
                            )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: sectionSpacing + 4),
          ],
          Text('Welcome Back', 
              style: GoogleFonts.inter(
                fontSize: compact ? 22 : 28, 
                fontWeight: FontWeight.w700, 
                color: AppColors.grey800, 
                letterSpacing: -0.8,
                height: 1.2,
              )),
          const SizedBox(height: 6),
          Text('Sign in to access your healthcare dashboard',
              style: GoogleFonts.inter(
                fontSize: 14, 
                color: AppColors.grey600, 
                fontWeight: FontWeight.w400,
                letterSpacing: 0.1,
                height: 1.5,
              )),
          SizedBox(height: sectionSpacing + 2),

          // Email field with enhanced styling
          Text('Email Address or Mobile', 
              style: GoogleFonts.inter(
                fontSize: 13, 
                color: AppColors.grey700, 
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              )),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            textInputAction: TextInputAction.next,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.2),
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.email_outlined, color: AppColors.grey500, size: 19),
              hintText: 'Enter your email or mobile number',
              hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.grey400, letterSpacing: 0.1),
              filled: true,
              fillColor: AppColors.grey50,
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: BorderSide(color: AppColors.grey200, width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: BorderSide(color: AppColors.grey200, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: const BorderSide(color: Colors.red, width: 1),
              ),
            ),
            validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
          ),
          SizedBox(height: spacing),

          // Password field with enhanced styling
          Text('Password', 
              style: GoogleFonts.inter(
                fontSize: 13, 
                color: AppColors.grey700, 
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              )),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.2),
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.lock_outline, color: AppColors.grey500, size: 19),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, 
                  color: AppColors.grey500,
                  size: 19,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                tooltip: _obscurePassword ? 'Show password' : 'Hide password',
              ),
              hintText: 'Enter your secure password',
              hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.grey400, letterSpacing: 0.1),
              filled: true,
              fillColor: AppColors.grey50,
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: BorderSide(color: AppColors.grey200, width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: BorderSide(color: AppColors.grey200, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), 
                borderSide: const BorderSide(color: Colors.red, width: 1),
              ),
            ),
            validator: (value) => value == null || value.isEmpty ? 'Required' : null,
          ),
          SizedBox(height: spacing),

          // Professional Captcha Section
          Text('Security Verification', 
              style: GoogleFonts.inter(
                fontSize: 13, 
                color: AppColors.grey700, 
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              )),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextFormField(
                  controller: _captchaController,
                  textCapitalization: TextCapitalization.characters,
                  style: GoogleFonts.robotoMono(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 2.5),
                  decoration: InputDecoration(
                    prefixIcon: Icon(Icons.shield_outlined, color: AppColors.grey500, size: 19),
                    hintText: 'Enter code',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.grey400, letterSpacing: 0.1),
                    filled: true,
                    fillColor: AppColors.grey50,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10), 
                      borderSide: BorderSide(color: AppColors.grey200, width: 1),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppColors.grey200, width: 1),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppColors.primary, width: 2),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10), 
                      borderSide: const BorderSide(color: Colors.red, width: 1),
                    ),
                  ),
                  validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 8),
              // Compact Captcha Display
              Container(
                width: 95,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.grey200, width: 1),
                ),
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(9),
                      child: CustomPaint(
                        size: const Size(95, 44),
                        painter: EnterpriseCaptchaPainter(_captchaText),
                      ),
                    ),
                    Positioned(
                      top: 2,
                      right: 2,
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: _refreshCaptcha,
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              color: AppColors.white.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Icon(Icons.refresh, size: 13, color: AppColors.grey600),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          SizedBox(height: sectionSpacing),

          // Remember + forgot with better styling
          Row(
            children: [
              SizedBox(
                height: 18,
                width: 18,
                child: Checkbox(
                  value: _rememberMe,
                  onChanged: (val) => setState(() => _rememberMe = val ?? false),
                  activeColor: AppColors.primary600,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
              ),
              const SizedBox(width: 8),
              Text('Remember me for 30 days', 
                  style: GoogleFonts.inter(
                    color: AppColors.grey600, 
                    fontSize: 13, 
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.1,
                  )),
              const Spacer(),
              TextButton(
                onPressed: () {
                  // TODO: Forgot password
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  minimumSize: const Size(0, 28),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text('Forgot Password?', 
                    style: GoogleFonts.inter(
                      color: AppColors.primary600, 
                      fontSize: 13, 
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.1,
                    )),
              ),
            ],
          ),

          SizedBox(height: sectionSpacing),

          // Professional CTA button
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleLogin,
              style: ElevatedButton.styleFrom(
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: EdgeInsets.zero,
                backgroundColor: AppColors.primary,
              ),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary700, AppColors.primary600],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: _isLoading
                      ? const SizedBox(
                          height: 22, 
                          width: 22, 
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Sign In to Dashboard', 
                                style: GoogleFonts.inter(
                                  color: Colors.white, 
                                  fontWeight: FontWeight.w700, 
                                  fontSize: 15,
                                  letterSpacing: 0.3,
                                  height: 1,
                                )),
                            const SizedBox(width: 10),
                            const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                          ],
                        ),
                ),
              ),
            ),
          ),

          if (!compact) ...[
            SizedBox(height: sectionSpacing + 4),
            // Professional footer
            Divider(color: AppColors.grey200, thickness: 1),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.security_rounded, size: 14, color: AppColors.grey500),
                const SizedBox(width: 6),
                Text('Enterprise-grade Security', 
                    style: GoogleFonts.inter(
                      color: AppColors.grey600, 
                      fontSize: 11, 
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    )),
              ],
            ),
            const SizedBox(height: 8),
            Center(
              child: Text('v1.0.0 • © 2024 Karur Gastro Foundation', 
                  style: GoogleFonts.inter(
                    color: AppColors.grey400, 
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  )),
            ),
          ],
        ],
      ),
    );
  }

  Widget _featureChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.white.withOpacity(0.1), 
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.white.withOpacity(0.15), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: AppColors.white.withOpacity(0.95)),
          const SizedBox(width: 7),
          Text(text, style: GoogleFonts.inter(
            color: AppColors.white.withOpacity(0.95), 
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          )),
        ],
      ),
    );
  }

}

// Enterprise-grade Captcha Painter - Clean and Professional
class EnterpriseCaptchaPainter extends CustomPainter {
  final String text;

  EnterpriseCaptchaPainter(this.text);

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(text.hashCode);
    final paint = Paint();

    // Clean subtle background
    final bgPaint = Paint()..color = const Color(0xFFF8F9FA);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Minimal noise pattern - subtle dots
    paint.color = AppColors.grey300.withOpacity(0.3);
    for (int i = 0; i < 8; i++) {
      canvas.drawCircle(
        Offset(random.nextDouble() * size.width, random.nextDouble() * size.height),
        0.8,
        paint,
      );
    }

    // Single subtle diagonal line
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 0.5;
    paint.color = AppColors.grey300.withOpacity(0.4);
    canvas.drawLine(
      Offset(0, size.height * 0.3),
      Offset(size.width, size.height * 0.7),
      paint,
    );

    paint.style = PaintingStyle.fill;

    // Calculate positioning for centered text
    double totalWidth = 0;
    List<TextPainter> painters = [];
    
    for (int i = 0; i < text.length; i++) {
      final char = text[i];
      // Professional monospace-style font
      final textStyle = TextStyle(
        color: AppColors.grey800,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        fontFamily: 'RobotoMono',
        letterSpacing: 1,
      );

      final textSpan = TextSpan(text: char, style: textStyle);
      final textPainter = TextPainter(text: textSpan, textDirection: TextDirection.ltr);
      textPainter.layout();
      painters.add(textPainter);
      totalWidth += textPainter.width + 2;
    }

    // Center and render characters with minimal rotation
    double x = (size.width - totalWidth) / 2;
    for (int i = 0; i < painters.length; i++) {
      final textPainter = painters[i];
      final y = (size.height - textPainter.height) / 2 + (random.nextDouble() - 0.5) * 4;
      final rotation = (random.nextDouble() - 0.5) * 0.15; // Minimal rotation

      canvas.save();
      canvas.translate(x + textPainter.width / 2, y + textPainter.height / 2);
      canvas.rotate(rotation);
      textPainter.paint(canvas, Offset(-textPainter.width / 2, -textPainter.height / 2));
      canvas.restore();

      x += textPainter.width + 2;
    }
  }

  @override
  bool shouldRepaint(covariant EnterpriseCaptchaPainter oldDelegate) {
    return oldDelegate.text != text;
  }
}
