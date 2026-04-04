import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const { loginSuccess } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (location.state?.message) addToast(location.state.message, "success");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = recaptchaRef.current.getValue();
    if (!token) {
      addToast("Please complete the reCAPTCHA", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password, token);
      loginSuccess(res.data);
      addToast(`Welcome back, ${res.data.user.email.split("@")[0]}!`);
      navigate(res.data.user.is_admin ? "/admin" : "/menu");
    } catch (err) {
      addToast(err.response?.data?.detail || "Invalid credentials", "error");
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
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-brand-mark">✦</div>
            <h2 className="auth-left-title">Good food,<br /><em>great memories.</em></h2>
            <p className="auth-left-body">
              Order from the finest kitchen in town. Fresh ingredients,
              bold flavors, delivered to your door.
            </p>
            <div className="auth-left-stats">
              <div className="stat"><span className="stat-num">50+</span><span className="stat-label">Menu Items</span></div>
              <div className="stat-sep" />
              <div className="stat"><span className="stat-num">24/7</span><span className="stat-label">Ordering</span></div>
              <div className="stat-sep" />
              <div className="stat"><span className="stat-num">Fast</span><span className="stat-label">Delivery</span></div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label className="field-label">Email address</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                  <input
                    type="email" className="field-input" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"} className="field-input field-input--pass"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                  />
                  <button type="button" className="field-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LdVFaYsAAAAAP-lgTe91FaWsanq-mAX83GG3whZ"
                theme="dark"
                style={{ marginBottom: "1rem" }}
              /> 

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in…</> : "Sign In"}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
