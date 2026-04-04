import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api";
import { useToast } from "../context/ToastContext";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignupPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const recaptchaRef = useRef(null);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = recaptchaRef.current.getValue();
    if (!token) {
      addToast("Please complete the reCAPTCHA", "error");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, token);
      addToast("Account created! Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      addToast(err.response?.data?.detail || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <div className="auth-split">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-brand-mark">✦</div>
            <h2 className="auth-left-title">Join the<br /><em>Feastly family.</em></h2>
            <p className="auth-left-body">
              Create your free account and start exploring our menu. 
              Fresh, delicious meals — just a few clicks away.
            </p>
            <div className="auth-features">
              {["Free to join","Instant access","Order anytime"].map((f) => (
                <div key={f} className="auth-feature">
                  <span className="auth-feature-check">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">It's free and takes 30 seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label className="field-label">Email address</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                  <input type="email" className="field-input" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type={showPass ? "text" : "password"} className="field-input field-input--pass"
                    placeholder="Min. 6 characters" value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  <button type="button" className="field-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {password && (
                  <div className="strength-bar">
                    <div className="strength-track">
                      <div className={`strength-fill strength-${strength.level}`} style={{ width: strength.pct }} />
                    </div>
                    <span className={`strength-label strength-${strength.level}`}>{strength.label}</span>
                  </div>
                )}
              </div>

              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LdVFaYsAAAAAP-lgTe91FaWsanq-mAX83GG3whZ"
                theme="dark"
                style={{ marginBottom: "1rem" }}
              />

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating account…</> : "Create Free Account"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStrength(pw) {
  if (!pw) return { level: "none", label: "", pct: "0%" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: "weak",   label: "Weak",   pct: "25%" };
  if (score <= 2) return { level: "fair",   label: "Fair",   pct: "50%" };
  if (score <= 3) return { level: "good",   label: "Good",   pct: "75%" };
  return             { level: "strong", label: "Strong", pct: "100%" };
}
