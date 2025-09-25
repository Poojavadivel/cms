// login_page.dart
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../Providers/app_providers.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Api_handler.dart';
import '../../Utils/Colors.dart';
import '../Admin/RootPage.dart';
import '../Doctor/RootPage.dart';

const String _prefsRememberMeKey = 'remember_me';
const String _prefsEmailKey = 'saved_email';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _captchaController = TextEditingController();
  final AuthService _authService = AuthService.instance;

  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _rememberMe = false;
  String _captchaText = "";

  late final AnimationController _animController;
  late final Animation<Offset> _slideAnim;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _refreshCaptcha();
    _loadUserPreferences();

    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();
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
    _animController.dispose();
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
      } else {
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
    final isMobile = MediaQuery.of(context).size.width < 800;

    return Scaffold(
      backgroundColor: AppColors.kBg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1100),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  color: AppColors.white,
                  child: isMobile ? _buildMobileLayout() : _buildDesktopLayout(),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDesktopLayout() {
    // Use IntrinsicHeight so both Expanded children will match height.
    return IntrinsicHeight(
      child: Row(
        children: [
          // Left enterprise hero
          Expanded(
            flex: 1,
            child: Container(
              // Make container fill the available vertical space created by IntrinsicHeight
              height: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 44, vertical: 30),
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
              // Make scrollable to avoid overflow on smaller heights
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top row: logo + contact
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Use the provided karurlogo.png with fallback
                        _logoWithFallback(),
                        const SizedBox(width: 22),
                        Flexible(
                          child: Text(
                            'Karur Gastro Foundation',
                            style: GoogleFonts.lexend(
                              fontSize: 24,
                              color: AppColors.white,
                              fontWeight: FontWeight.w600,
                            ),
                            softWrap: true,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                    ),

                    const SizedBox(height: 20),

                    FadeTransition(
                      opacity: _fadeAnim,
                      child: SlideTransition(
                        position: _slideAnim,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 18),
                            // Big heading with safe layout
                            Text(
                              'Secure Clinical\nOperations',
                              style: GoogleFonts.poppins(
                                color: AppColors.white,
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
                                height: 1.05,
                              ),
                            ),
                            const SizedBox(height: 22),
                            SizedBox(
                              width: 460,
                              child: Text(
                                'Designed for hospitals and clinics — secure role based access, audit trails, HIPAA-like controls, realtime reporting and scalable integrations.',
                                style: GoogleFonts.poppins(color: AppColors.white70, fontSize: 14, height: 1.6),
                              ),
                            ),
                            const SizedBox(height: 60),

                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                _featureChip(Icons.lock_outline, 'Secure SSO'),
                                _featureChip(Icons.storage_outlined, 'Reliable Backups'),
                                _featureChip(Icons.dashboard_outlined, 'Realtime Dashboards'),
                                _featureChip(Icons.shield_outlined, 'Audit Trails'),
                              ],
                            ),

                            const SizedBox(height: 92),

                            // Trust badges + CTA
                            Row(
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Trusted by', style: GoogleFonts.poppins(color: AppColors.white70, fontSize: 12)),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: [
                                        _smallBadge('assets/karurlogo.png'),
                                        _smallBadge('assets/icons/medical_cross.svg', isSvg: true),
                                      ],
                                    ),
                                  ],
                                ),
                                const Spacer(),
                                ElevatedButton(
                                  onPressed: () {
                                    // Request demo / contact sales
                                  },
                                  style: ElevatedButton.styleFrom(
                                    elevation: 8,
                                    backgroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12),
                                    child: Text('Help & Support', style: GoogleFonts.poppins(color: AppColors.primary700, fontWeight: FontWeight.w700)),
                                  ),
                                )
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Right form
          Expanded(
            flex: 1,
            child: Container(
              // Force fill vertical space from IntrinsicHeight
              height: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 36),
              color: AppColors.white,
              child: FadeTransition(
                opacity: _fadeAnim,
                child: SlideTransition(
                  position: _slideAnim,
                  child: _buildLoginForm(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _logoWithFallback() {
    return SizedBox(
      height: 44,
      width: 44,
      child: Builder(
        builder: (context) {
          return ClipOval(
            child: Image.asset(
              'assets/karurlogo.png',
              height: 44,
              width: 44,
              fit: BoxFit.cover, // ensures it fills circle
              errorBuilder: (context, error, stackTrace) {
                // First fallback: try SVG logo inside circle
                return ClipOval(
                  child: SvgPicture.asset(
                    'assets/icons/medical_cross.svg',
                    height: 44,
                    width: 44,
                    color: AppColors.white,
                    fit: BoxFit.scaleDown,
                    placeholderBuilder: (_) => _circleFallback(),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _circleFallback() {
    return Container(
      height: 44,
      width: 44,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white24,
      ),
      child: Icon(
        Icons.local_hospital_rounded,
        color: AppColors.white,
        size: 22,
      ),
    );
  }


  Widget _buildMobileLayout() {
    return Column(
      children: [
        // compact hero
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
          child: Column(
            children: [
              // Prefer using the png for mobile too, with fallback handled
              _logoWithFallback(),
              const SizedBox(height: 12),
              Text('Karur Gastro Foundation',
                  style: GoogleFonts.poppins(color: AppColors.white, fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Secure access to patient dashboards and reports.',
                  style: GoogleFonts.poppins(color: AppColors.white70, fontSize: 13), textAlign: TextAlign.center),
            ],
          ),
        ),

        // form card
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
          color: AppColors.white,
          child: _buildLoginForm(),
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // brand row
          Row(
            children: [
              Container(
                height: 46,
                width: 46,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Icon(Icons.local_hospital_rounded, color: AppColors.primary, size: 26),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Karur Gastro Foundation',
                    style: GoogleFonts.poppins(color: AppColors.grey800, fontSize: 18, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text('Hello!', style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.grey800)),
          const SizedBox(height: 6),
          Text('Please enter your credentials to continue.',
              style: GoogleFonts.poppins(fontSize: 13, color: AppColors.grey600)),
          const SizedBox(height: 22),

          // Email
          Text('Email or Mobile', style: GoogleFonts.poppins(fontSize: 13, color: AppColors.grey700)),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.person_outline, color: AppColors.grey400),
              hintText: 'Email or Mobile',
              filled: true,
              fillColor: AppColors.grey100,
              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            validator: (value) => value == null || value.trim().isEmpty ? 'Please enter email or mobile' : null,
          ),
          const SizedBox(height: 14),

          // Password
          Text('Password', style: GoogleFonts.poppins(fontSize: 13, color: AppColors.grey700)),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.lock_outline, color: AppColors.grey400),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: AppColors.grey400),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                tooltip: _obscurePassword ? 'Show password' : 'Hide password',
              ),
              hintText: 'Password',
              filled: true,
              fillColor: AppColors.grey100,
              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            validator: (value) => value == null || value.isEmpty ? 'Please enter your password' : null,
          ),
          const SizedBox(height: 14),

          // Captcha row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Captcha', style: GoogleFonts.poppins(fontSize: 13, color: AppColors.grey700)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _captchaController,
                      decoration: InputDecoration(
                        prefixIcon: Icon(Icons.verified_user_outlined, color: AppColors.grey400),
                        hintText: 'Enter Captcha',
                        filled: true,
                        fillColor: AppColors.grey100,
                        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter the captcha' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Captcha preview
              Container(
                width: 120,
                height: 52,
                decoration: BoxDecoration(color: AppColors.grey200, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
                      child: CustomPaint(
                        size: const Size(80, 52),
                        painter: CaptchaPainter(_captchaText, key: ValueKey('c1_')),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, size: 18),
                      color: AppColors.grey600,
                      onPressed: _refreshCaptcha,
                      tooltip: 'Regenerate captcha',
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Remember + forgot
          Row(
            children: [
              Checkbox(
                value: _rememberMe,
                onChanged: (val) => setState(() => _rememberMe = val ?? false),
                activeColor: AppColors.primary600,
              ),
              Text('Remember Me', style: GoogleFonts.poppins(color: AppColors.grey600)),
              const Spacer(),
              TextButton(
                onPressed: () {
                  // TODO: Forgot password
                },
                child: Text('Forgot?', style: GoogleFonts.poppins(color: AppColors.primary600)),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // CTA button
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleLogin,
              style: ElevatedButton.styleFrom(
                elevation: 14,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: EdgeInsets.zero,
                shadowColor: AppColors.primary.withOpacity(0.25),
                backgroundColor: AppColors.primary,
              ),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [AppColors.primary700, AppColors.primary600]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('Login', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
            ),
          ),

          const SizedBox(height: 18),

          // Footer small text
          Row(
            children: [
              Text('Version 1.0.0', style: GoogleFonts.poppins(color: AppColors.grey400, fontSize: 12)),
              const Spacer(),
              Text('Built for Karur Gastro', style: GoogleFonts.poppins(color: AppColors.grey400, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _stat(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: GoogleFonts.poppins(color: AppColors.white, fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(label, style: GoogleFonts.poppins(color: AppColors.white70, fontSize: 12)),
      ],
    );
  }

  Widget _featureChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: AppColors.white.withOpacity(0.06), borderRadius: BorderRadius.circular(10)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.white70),
          const SizedBox(width: 8),
          Text(text, style: GoogleFonts.poppins(color: AppColors.white70, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _smallBadge(String assetPath, {bool isSvg = false}) {
    return Container(
      height: 28,
      width: 28,
      decoration: BoxDecoration(color: AppColors.white.withOpacity(0.06), borderRadius: BorderRadius.circular(6)),
      child: Center(
        child: isSvg
            ? SvgPicture.asset(assetPath, height: 18, width: 18, color: AppColors.white70)
        :Image.asset(
          assetPath,
          height: 18,
          width: 18,
          fit: BoxFit.contain,
          // If the image fails to load, show a backup asset first,
          // and if even that fails, show an icon.
          errorBuilder: (context, error, stackTrace) {
            return Image.asset(
              'assets/sampledoctor.png',
              height: 18,
              width: 18,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.work_outline,
                  color: AppColors.white70,
                  size: 16,
                );
              },
            );
          },
        )

      ),
    );
  }
}

class CaptchaPainter extends CustomPainter {
  final String text;
  final Key key;

  CaptchaPainter(this.text, {required this.key});

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(text.hashCode);
    final paint = Paint();
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), Paint()..color = AppColors.transparent);

    // background noise lines
    for (int i = 0; i < 3; i++) {
      paint.color = AppColors.captchaGreyVariants[random.nextInt(AppColors.captchaGreyVariants.length)];
      paint.strokeWidth = 1.0;
      canvas.drawLine(
        Offset(random.nextDouble() * size.width, random.nextDouble() * size.height),
        Offset(random.nextDouble() * size.width, random.nextDouble() * size.height),
        paint,
      );
    }

    double x = 8.0;
    for (int i = 0; i < text.length; i++) {
      final char = text[i];
      final textStyle = TextStyle(
        color: AppColors.captchaGreyVariants[random.nextInt(AppColors.captchaGreyVariants.length)],
        fontSize: 18 + random.nextDouble() * 6,
        fontWeight: FontWeight.bold,
        fontStyle: FontStyle.italic,
        shadows: [Shadow(color: AppColors.white.withOpacity(0.8), offset: const Offset(1, 1), blurRadius: 1)],
      );

      final textSpan = TextSpan(text: char, style: textStyle);
      final textPainter = TextPainter(text: textSpan, textDirection: TextDirection.ltr);
      textPainter.layout();

      final y = 6 + random.nextDouble() * (size.height - textPainter.height - 12);
      final rotation = (random.nextDouble() - 0.5) * 0.45;

      canvas.save();
      canvas.translate(x + textPainter.width / 2, y + textPainter.height / 2);
      canvas.rotate(rotation);
      textPainter.paint(canvas, Offset(-textPainter.width / 2, -textPainter.height / 2));
      canvas.restore();

      x += textPainter.width + (random.nextDouble() * 2);
    }
  }

  @override
  bool shouldRepaint(covariant CaptchaPainter oldDelegate) {
    return oldDelegate.text != text || oldDelegate.key != key;
  }
}
