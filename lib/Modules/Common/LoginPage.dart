import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:glowhair/Modules/Doctor/RootPage.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glowhair/providers/app_providers.dart';// UPDATED IMPORT
import 'package:shared_preferences/shared_preferences.dart';

import '../../Utils/Api_handler.dart';
import '../Admin/RootPage.dart';

const String _prefsRememberMeKey = 'remember_me';
const String _prefsEmailKey = 'saved_email';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _captchaController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _rememberMe = false;
  String _captchaText = "";

  @override
  void initState() {
    super.initState();
    _refreshCaptcha();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUserPreferences();
    });
  }

  void _loadUserPreferences() async {
    final prefs = ref.read(sharedPreferencesProvider);
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    setState(() {
      _captchaText = String.fromCharCodes(Iterable.generate(
          5, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_captchaController.text.toUpperCase() != _captchaText.toUpperCase()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid captcha. Please try again.')),
      );
      _refreshCaptcha();
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // UPDATED LOGIC: Directly call the AuthRepository provider.
      await ref.read(authRepositoryProvider).login(
        _emailController.text,
        _passwordController.text,
      );

      // Handle "Remember Me" logic on successful login.
      final prefs = ref.read(sharedPreferencesProvider);
      await prefs.setBool(_prefsRememberMeKey, _rememberMe);
      if (_rememberMe) {
        await prefs.setString(_prefsEmailKey, _emailController.text);
      } else {
        await prefs.remove(_prefsEmailKey);
      }

    } on ApiException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
      _refreshCaptcha();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('An unexpected error occurred: $e')),
      );
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final brandGradient = const LinearGradient(
      colors: [Color(0xFFff758c), Color(0xFFff7eb3)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
    final isMobile = MediaQuery.of(context).size.width < 700;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage("assets/loginbg.png"),
            fit: BoxFit.cover,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 1000),
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 25,
                    spreadRadius: 2,
                    offset: const Offset(0, 10),
                  )
                ],
                borderRadius: BorderRadius.circular(20),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: isMobile
                    ? _buildMobileLayout(brandGradient)
                    : _buildDesktopLayout(brandGradient),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDesktopLayout(LinearGradient brandGradient) {
    return Row(
      children: [
        Expanded(
          flex: 1,
          child: Container(
            height: 650,
            decoration: BoxDecoration(gradient: brandGradient),
            padding: const EdgeInsets.all(40),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Welcome to", style: GoogleFonts.poppins(color: Colors.white70, fontSize: 22)),
                  const SizedBox(height: 8),
                  Text("Glow Skin & Gro Hair", style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 32), textAlign: TextAlign.center),
                  const SizedBox(height: 20),
                  Text("Your beauty and wellness companion. Login to access your personalized care dashboard.", style: GoogleFonts.poppins(color: Colors.white70, fontSize: 16), textAlign: TextAlign.center),
                ],
              ),
            ),
          ),
        ),
        Expanded(
          flex: 1,
          child: Container(
            height: 650,
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 30),
            color: Colors.white,
            child: _buildLoginForm(),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileLayout(LinearGradient brandGradient) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          decoration: BoxDecoration(gradient: brandGradient),
          padding: const EdgeInsets.all(30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("Welcome to", style: GoogleFonts.poppins(color: Colors.white70, fontSize: 20)),
              const SizedBox(height: 8),
              Text("Glow Skin & Gro Hair", style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 26), textAlign: TextAlign.center),
              const SizedBox(height: 15),
              Text("Your beauty and wellness companion. Login to access your personalized care dashboard.", style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14), textAlign: TextAlign.center),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 25),
          color: Colors.white,
          child: _buildLoginForm(),
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.spa, color: Colors.pinkAccent, size: 38),
              const SizedBox(width: 8),
              Text("Glow Skin & Gro Hair", style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.grey[800])),
            ],
          ),
          const SizedBox(height: 20),
          Text("Hello!", style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey[800])),
          const SizedBox(height: 5),
          Text("Please enter your credentials to continue.", style: GoogleFonts.poppins(fontSize: 15, color: Colors.grey[600]), textAlign: TextAlign.center),
          const SizedBox(height: 25),
          TextFormField(
            controller: _emailController,
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.person_outline, color: Colors.grey[400]),
              hintText: "Email or Mobile",
              filled: true,
              fillColor: Colors.grey[100],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            validator: (value) => value == null || value.isEmpty ? 'Please enter your email or mobile number' : null,
          ),
          const SizedBox(height: 15),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.lock_outline, color: Colors.grey[400]),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey[400]),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              hintText: "Password",
              filled: true,
              fillColor: Colors.grey[100],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            validator: (value) => value == null || value.isEmpty ? 'Please enter your password' : null,
          ),
          const SizedBox(height: 15),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _captchaController,
                  decoration: InputDecoration(
                    prefixIcon: Icon(Icons.verified_user_outlined, color: Colors.grey[400]),
                    hintText: "Enter Captcha",
                    filled: true,
                    fillColor: Colors.grey[100],
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  validator: (value) => value == null || value.isEmpty ? 'Please enter the captcha' : null,
                ),
              ),
              const SizedBox(width: 15),
              Container(
                decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
                      child: CustomPaint(
                        size: const Size(100, 50),
                        painter: CaptchaPainter(_captchaText, key: ValueKey(_captchaText)),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: _refreshCaptcha,
                      color: Colors.grey[600],
                    ),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Checkbox(
                  value: _rememberMe,
                  onChanged: (val) => setState(() => _rememberMe = val ?? false),
                  activeColor: Colors.pinkAccent
              ),
              Text("Remember Me", style: GoogleFonts.poppins(color: Colors.grey[600])),
            ],
          ),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => DoctorRootPage()),
                );
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                backgroundColor: Colors.pinkAccent,
                shadowColor: Colors.pinkAccent.withOpacity(0.5),
                elevation: 8,
              ),
              child: Text(
                "Login",
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text("Version 1.0.0", style: GoogleFonts.poppins(color: Colors.grey[400], fontSize: 12)),
        ],
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
    final paint = Paint()..color = Colors.transparent;
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    for (int i = 0; i < 3; i++) {
      paint.color = Colors.grey[300 + random.nextInt(2) * 100]!;
      paint.strokeWidth = 1.0;
      canvas.drawLine(
        Offset(random.nextDouble() * size.width, random.nextDouble() * size.height),
        Offset(random.nextDouble() * size.width, random.nextDouble() * size.height),
        paint,
      );
    }

    double x = 10.0;
    for (int i = 0; i < text.length; i++) {
      final char = text[i];
      final textStyle = TextStyle(
        color: Colors.grey[600 + random.nextInt(3) * 100]!,
        fontSize: 20 + random.nextDouble() * 6,
        fontWeight: FontWeight.bold,
        fontStyle: FontStyle.italic,
        shadows: const [Shadow(color: Colors.white, offset: Offset(1, 1), blurRadius: 1)],
      );

      final textSpan = TextSpan(text: char, style: textStyle);
      final textPainter = TextPainter(text: textSpan, textDirection: TextDirection.ltr);
      textPainter.layout();

      final y = 10 + random.nextDouble() * (size.height - textPainter.height - 20);
      final rotation = (random.nextDouble() - 0.5) * 0.4;

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
    return oldDelegate.key != key;
  }
}
