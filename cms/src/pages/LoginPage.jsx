import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserSession, getUserSession } from '../auth/sessionController';
import { demoUsers } from '../data/roleConfig';

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  );
}

function LoginArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, fill: 'white' }}>
      <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-8v2h8v14z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="input-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="input-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const activeSession = getUserSession();
    if (activeSession) {
      navigate(`/dashboard?role=${encodeURIComponent(activeSession.role)}`, { replace: true });
      return;
    }

    document.title = 'MIT Connect — Multi Role Login';
  }, [navigate]);

  const hint = `Demo ${role.toUpperCase()}: ${demoUsers[role].userId} / ${demoUsers[role].password}`;

  function handleSubmit(event) {
    event.preventDefault();

    if (!userId.trim() || !password) {
      setError('Please enter your role, user ID and password.');
      return;
    }

    setLoading(true);
    setError('');

    window.setTimeout(() => {
      const allowedUser = demoUsers[role];
      if (allowedUser.userId === userId.trim() && allowedUser.password === password) {
        createUserSession(role, userId.trim());
        navigate(`/dashboard?role=${encodeURIComponent(role)}`, { replace: true });
        return;
      }

      setError('Invalid credentials for selected role. Check the demo hint and try again.');
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-showcase">
          <div className="showcase-badge">Movi Institute of Technology</div>
          <div className="showcase-brand-card">
            <div className="brand-icon">
              <GraduationIcon />
            </div>
            <div>
              <h1>MIT Connect</h1>
              <p>Unified Campus Management System</p>
            </div>
          </div>

          <div className="showcase-copy">
            <h2>Welcome to the smart MIT workspace</h2>
            <p>
              One secure place for students, faculty, finance, and administration teams to manage academics,
              records, payroll, billing, and campus operations at Movi Institute of Technology.
            </p>
          </div>

          <div className="showcase-grid">
            <article className="showcase-card">
              <h3>Overview</h3>
              <p>Dashboard, students, faculty, and department visibility.</p>
            </article>
            <article className="showcase-card">
              <h3>Administration</h3>
              <p>Admissions, fee control, payroll, and invoice handling.</p>
            </article>
            <article className="showcase-card">
              <h3>Intelligence</h3>
              <p>Analytics, alerts, and role-based settings in one place.</p>
            </article>
            <article className="showcase-card">
              <h3>Academics</h3>
              <p>Exams, timetable, attendance, placement, and facilities.</p>
            </article>
          </div>
        </section>

        <section className="login-container">
          <div className="login-brand login-brand-split">
            <div className="brand-mark-row">
              <div className="brand-icon">
                <GraduationIcon />
              </div>
              <div>
                <h1>Sign In</h1>
                <p>Access your role-based dashboard</p>
              </div>
            </div>
          </div>

          <div className="role-switcher">
            {Object.keys(demoUsers).map((roleKey) => (
              <button
                key={roleKey}
                type="button"
                className={`role-switch-btn${roleKey === role ? ' active' : ''}`}
                onClick={() => setRole(roleKey)}
              >
                {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group role-select-hidden">
              <label htmlFor="role">Role</label>
              <div className="input-wrap">
                <UserIcon />
                <select id="role" name="role" value={role} onChange={(event) => setRole(event.target.value)} required>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="faculty">Faculty</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <div className="input-wrap">
                <UserIcon />
                <input
                  type="text"
                  id="userId"
                  name="userId"
                  placeholder="e.g. STU-2024-1547"
                  autoComplete="username"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <LockIcon />
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" id="remember" />
                Remember me
              </label>
              <a href="#" className="forgot-link" onClick={(event) => event.preventDefault()}>
                Forgot password?
              </a>
            </div>

            {error ? <div className="login-message login-error">{error}</div> : null}
            <div className="login-message login-hint">{hint}</div>

            <button type="submit" className="btn-login" id="loginBtn" disabled={loading}>
              <LoginArrowIcon />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <span>Secure Access</span>
          </div>

          <div className="login-links">
            <a href="#" onClick={(event) => event.preventDefault()}>
              Help Center
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              Privacy Policy
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              Terms of Use
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
