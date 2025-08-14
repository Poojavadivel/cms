import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';


class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  String _captchaText = "A4B2C";

  @override
  void initState() {
    super.initState();
    _refreshCaptcha(); // Generate initial random captcha
  }

  void _refreshCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    setState(() {
      _captchaText = String.fromCharCodes(Iterable.generate(
          5, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF6B3DF5);
    const secondaryTextColor = Color(0xFF666666);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 900),
              child: Card(
                elevation: 12,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.0),
                ),
                child: Row(
                  children: [
                    if (MediaQuery.of(context).size.width > 768)
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(48.0),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(16.0),
                              bottomLeft: Radius.circular(16.0),
                            ),
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Welcome!",
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(height: 16),
                              Text(
                                "We are excited to have you back at Grow Hai and Glo Skin.",
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 32.0, vertical: 48.0),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                "Grow Hai and Glo Skin",
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF333333),
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                "Sign in to your account",
                                style: TextStyle(
                                  fontSize: 16,
                                  color: secondaryTextColor,
                                ),
                              ),
                              const SizedBox(height: 32),
                              TextFormField(
                                decoration: _buildInputDecoration(
                                    "Username", Icons.person_outline),
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                obscureText: true,
                                decoration: _buildInputDecoration(
                                    "Password", Icons.lock_outline),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      decoration: _buildInputDecoration(
                                          "Captcha", Icons.verified_user),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  // --- ADVANCED CAPTCHA WIDGET ---
                                  GestureDetector(
                                    onTap: _refreshCaptcha,
                                    child: ClipRRect(
                                      borderRadius:
                                      BorderRadius.circular(50),
                                      child: CustomPaint(
                                        size: const Size(120, 50),
                                        painter: CaptchaPainter(
                                            _captchaText,
                                            key: ValueKey(_captchaText)),
                                      ),
                                    ),
                                  )
                                ],
                              ),
                              const SizedBox(height: 32),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: primaryColor,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius:
                                      BorderRadius.circular(50),
                                    ),
                                    elevation: 5,
                                  ),
                                  child: const Text(
                                    "Login",
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              const Text(
                                "Version 0.1",
                                style: TextStyle(
                                  color: secondaryTextColor,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String label, IconData icon) {
    const primaryColor = Color(0xFF6B3DF5);
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Colors.grey[400]),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(50),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(50),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(50),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
    );
  }
}

/// A custom painter to draw a visually complex and distorted captcha.
class CaptchaPainter extends CustomPainter {
  final String text;
  final Key key; // Using a key ensures it repaints when the text changes.

  CaptchaPainter(this.text, {required this.key});

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(text.hashCode);
    final paint = Paint()..color = Colors.grey[200]!;
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    // Draw random noise lines
    for (int i = 0; i < 5; i++) {
      paint.color = Colors.grey[300 + random.nextInt(2) * 100]!;
      paint.strokeWidth = 1.0;
      canvas.drawLine(
        Offset(random.nextDouble() * size.width,
            random.nextDouble() * size.height),
        Offset(random.nextDouble() * size.width,
            random.nextDouble() * size.height),
        paint,
      );
    }

    // Draw the distorted text
    double x = 15.0;
    for (int i = 0; i < text.length; i++) {
      final char = text[i];
      final textStyle = TextStyle(
        color: Colors.grey[600 + random.nextInt(3) * 100]!,
        fontSize: 22 + random.nextDouble() * 8,
        fontWeight: FontWeight.bold,
        fontStyle: FontStyle.italic,
        shadows: const [
          Shadow(color: Colors.white, offset: Offset(1, 1), blurRadius: 1),
        ],
      );

      final textSpan = TextSpan(text: char, style: textStyle);
      final textPainter =
      TextPainter(text: textSpan, textDirection: TextDirection.ltr);
      textPainter.layout();

      // Apply random transformations
      final y = 10 + random.nextDouble() * (size.height - textPainter.height - 20);
      final rotation = (random.nextDouble() - 0.5) * 0.5; // -0.25 to 0.25 radians

      canvas.save();
      canvas.translate(x + textPainter.width / 2, y + textPainter.height / 2);
      canvas.rotate(rotation);
      textPainter.paint(
          canvas, Offset(-textPainter.width / 2, -textPainter.height / 2));
      canvas.restore();

      x += textPainter.width + (random.nextDouble() * 3);
    }
  }

  @override
  bool shouldRepaint(covariant CaptchaPainter oldDelegate) {
    // Repaint only when the text (and thus the key) changes.
    return oldDelegate.key != key;
  }
}
