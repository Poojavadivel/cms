import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../provider';
import { authService, logger } from '../../services';
import './LoginPage.css';
import MoviLogo from '../../components/common/Logo';
import { MdVisibility, MdVisibilityOff, MdRefresh, MdArrowForward, MdErrorOutline } from 'react-icons/md';

const PREFS_REMEMBER_ME_KEY = 'remember_me';
const PREFS_EMAIL_KEY = 'saved_email';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useApp();
  const canvasRef = useRef(null);

  // Get the path user was trying to access (for redirect after login)
  const from = location.state?.from?.pathname;

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [error, setError] = useState('');

  // Initialize
  useEffect(() => {
    logger.info('LOGIN_PAGE', 'Login page mounted');
    refreshCaptcha();
    loadUserPreferences();

    return () => {
      logger.info('LOGIN_PAGE', 'Login page unmounted');
    };
  }, []);

  // Redraw CAPTCHA when text changes
  useEffect(() => {
    if (captchaText) {
      drawCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaText]);

  const loadUserPreferences = () => {
    const savedRememberMe = localStorage.getItem(PREFS_REMEMBER_ME_KEY) === 'true';
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem(PREFS_EMAIL_KEY) || '';
      setRememberMe(savedRememberMe);
      setEmail(savedEmail);
    }
  };

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Create seeded random for consistency with same text
    let seed = captchaText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Clean subtle background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Minimal noise pattern
    ctx.fillStyle = 'rgba(209, 213, 219, 0.4)';
    for (let i = 0; i < 8; i++) {
      const x = seededRandom() * width;
      const y = seededRandom() * height;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Single subtle diagonal line
    ctx.strokeStyle = 'rgba(209, 213, 219, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.3);
    ctx.lineTo(width, height * 0.7);
    ctx.stroke();

    ctx.font = 'bold 22px "Consolas", monospace';
    ctx.textBaseline = 'middle';

    // Calculate total width with spacing
    let totalWidth = 0;
    const charWidths = [];
    for (let i = 0; i < captchaText.length; i++) {
      const w = ctx.measureText(captchaText[i]).width;
      charWidths.push(w);
      totalWidth += w;
    }
    totalWidth += (captchaText.length - 1) * 4;

    let x = (width - totalWidth) / 2;

    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const charWidth = charWidths[i];
      const y = height / 2 + (seededRandom() - 0.5) * 4;
      const rotation = (seededRandom() - 0.5) * 0.15;

      ctx.save();
      ctx.translate(x + charWidth / 2, y);
      ctx.rotate(rotation);

      ctx.fillStyle = '#0f766e'; // teal-700
      ctx.fillText(char, -charWidth / 2, 0);

      ctx.restore();

      x += charWidth + 4;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    logger.userAction('Login form submitted', { email: email.trim() });

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (!captchaInput) {
      setError('CAPTCHA is required');
      return;
    }

    if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
      setError('Invalid captcha. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const authResult = await authService.signIn(email.trim(), password.trim());

      localStorage.setItem(PREFS_REMEMBER_ME_KEY, rememberMe.toString());
      if (rememberMe) {
        localStorage.setItem(PREFS_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(PREFS_EMAIL_KEY);
      }

      setUser(authResult.user, authResult.token);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      const userRole = authResult.user.role.toLowerCase();
      let targetPath = '/doctor';

      if (userRole === 'admin' || userRole === 'superadmin') {
        targetPath = '/admin';
      } else if (userRole === 'doctor') {
        targetPath = '/doctor';
      } else if (userRole === 'pharmacist') {
        targetPath = '/pharmacist';
      } else if (userRole === 'pathologist') {
        targetPath = '/pathologist';
      }

      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-slate-50">

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-100/50 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-100/40 blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
      </div>

      {/* Main Card Container */}
      <div className="z-10 w-full max-w-[1100px] h-[650px] mx-4 sm:mx-8 md:mx-auto bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex overflow-hidden border border-white/50 backdrop-blur-xl">

        {/* Left Side: Brand Panel */}
        <div className="hidden lg:flex w-[45%] relative bg-gradient-to-br from-primary-800 via-primary-700 to-teal-800 flex-col justify-between p-12 overflow-hidden text-white">
          {/* Decorative overlays */}
          <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-40 mix-blend-screen"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl opacity-30 mix-blend-hard-light"></div>

          <div className="relative z-10 animate-fade-in" style={{ animationDuration: '0.8s' }}>
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-lg">
                <MoviLogo size={36} className="text-white drop-shadow-md" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-widest text-white/90 uppercase">Movi</h2>
                <div className="text-[10px] font-semibold text-teal-200 tracking-[0.2em] uppercase">Enterprise</div>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-teal-100">
              The Next Era of<br />Clinical Care.
            </h1>
            <p className="text-primary-100/90 text-[15px] leading-relaxed max-w-[85%] font-medium">
              A deeply integrated, highly secure ecosystem built to optimize patient outcomes and streamline hospital operations.
            </p>
          </div>

          {/* Social Proof / Trust Badge */}
          <div className="relative z-10 mt-auto animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="bg-black/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl relative overflow-hidden group hover:bg-black/20 transition-all duration-500">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-300 to-primary-500"></div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[13px] font-medium text-white/90 leading-relaxed italic mb-3">
                "We've reduced patient wait times by 40% since migrating our queue management to the Movi ecosystem."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white">DR</div>
                <div>
                  <div className="text-[11px] font-bold text-white tracking-wide">Dr. Sarah Jenkins</div>
                  <div className="text-[10px] text-teal-200 uppercase tracking-widest font-semibold">Chief of Surgery, Metro General</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full lg:w-[55%] bg-white flex flex-col justify-center px-8 sm:px-16 py-12 relative">

          <div className="max-w-[420px] w-full mx-auto animate-fade-in" style={{ animationDuration: '0.6s' }}>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="lg:hidden flex flex-col items-center mb-10 text-center">
              <div className="bg-gradient-to-br from-primary-700 to-primary-600 p-4 rounded-[1.25rem] shadow-lg shadow-primary-500/30 mb-5">
                <MoviLogo size={36} className="text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Movi Hospital</h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Enterprise Management System</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h2>
              <p className="text-slate-500 font-medium tracking-wide text-sm">Sign in to your secure workspace.</p>
            </div>

            {/* Error Toast */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl flex gap-3 text-[13px] mb-6 justify-center items-center shadow-sm animate-slide-up" style={{ animationDuration: '0.3s' }}>
                <MdErrorOutline className="w-5 h-5 flex-shrink-0 text-rose-500" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">

              {/* STAGGERED ANIMATIONS FOR FORM FIELDS */}
              <div className="space-y-5">
                {/* Email Field */}
                <div className="relative group animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block px-5 pb-2.5 pt-7 w-full text-slate-900 bg-slate-50/80 rounded-2xl border border-transparent appearance-none focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white peer transition-all duration-300 font-medium sm:text-sm shadow-sm"
                    placeholder=" "
                    disabled={isLoading}
                  />
                  <label htmlFor="email" className="absolute text-slate-400 font-medium duration-300 transform -translate-y-[0.85rem] scale-[0.8] top-4 z-10 origin-[0] left-5 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[0.85rem] cursor-text pointer-events-none">
                    Email Address or User ID
                  </label>
                </div>

                {/* Password Field */}
                <div className="relative group animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                  <input
                    type={obscurePassword ? 'password' : 'text'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block px-5 pb-2.5 pt-7 w-full text-slate-900 bg-slate-50/80 rounded-2xl border border-transparent appearance-none focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white peer transition-all duration-300 font-medium sm:text-sm shadow-sm pr-12"
                    placeholder=" "
                    disabled={isLoading}
                  />
                  <label htmlFor="password" className="absolute text-slate-400 font-medium duration-300 transform -translate-y-[0.85rem] scale-[0.8] top-4 z-10 origin-[0] left-5 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[0.85rem] cursor-text pointer-events-none">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setObscurePassword(!obscurePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 p-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                    title={obscurePassword ? "Show Password" : "Hide Password"}
                  >
                    {obscurePassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>

                {/* CAPTCHA Field */}
                <div className="flex gap-3 items-center animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      id="captcha"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      maxLength={5}
                      className="block px-5 pb-2.5 pt-7 w-full text-slate-900 bg-slate-50/80 rounded-2xl border border-transparent appearance-none focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white peer tracking-[0.25em] font-mono font-bold uppercase transition-all duration-300 shadow-sm text-sm"
                      placeholder=" "
                      disabled={isLoading}
                    />
                    <label htmlFor="captcha" className="absolute text-slate-400 font-medium duration-300 transform -translate-y-[0.85rem] scale-[0.8] top-4 z-10 origin-[0] left-5 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[0.85rem] cursor-text pointer-events-none">
                      Security Code
                    </label>
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shrink-0 h-[60px] shadow-sm hover:border-slate-300 transition-colors">
                    <canvas ref={canvasRef} width={120} height={46} className="rounded-xl bg-teal-50/40" />
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors shrink-0"
                      title="Refresh CAPTCHA"
                    >
                      <MdRefresh size={22} className="rotate-0 hover:rotate-180 transition-transform duration-500 delay-75" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-2 pb-2 animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-slate-50 border-slate-300 rounded-md focus:ring-primary-500/30 focus:ring-2 cursor-pointer transition-colors peer"
                      disabled={isLoading}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Stay signed in</span>
                </label>
                <button type="button" className="text-[13px] font-bold text-primary-600 hover:text-primary-800 transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden bg-primary-700 hover:bg-primary-800 text-white font-bold py-[1.125rem] px-6 rounded-2xl transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(15,118,110,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(15,118,110,0.6)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-[15px] tracking-wide relative z-10">Sign In</span>
                      <MdArrowForward size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Encrypted Session
              </div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider">
                © 2024 MOVI HOSPITAL
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
