import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount, refreshCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (user && !isAdmin) refreshCount();
  }, [user, isAdmin, location.pathname, refreshCount]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = (p) => location.pathname === p;

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Brand */}
        <Link to={user ? (isAdmin ? "/admin" : "/menu") : "/"} className="nav-brand">
          <div className="nav-brand-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 14c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="nav-brand-text">
            <span className="nav-brand-name">Feastly</span>
            <span className="nav-brand-tagline">Flying Cutter</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links-desktop">
          {user ? (
            <>
              <NavLink to="/menu" active={isActive("/menu")}>Menu</NavLink>
              {!isAdmin && (
                <>
                  <NavLink to="/cart" active={isActive("/cart")}>
                    Cart
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                  </NavLink>
                  <NavLink to="/orders" active={isActive("/orders")}>Orders</NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink to="/admin" active={isActive("/admin")}>
                  <span className="admin-pill">Admin</span>
                </NavLink>
              )}
              <div className="nav-sep" />
              <div className="nav-user-dropdown">
                <button className="nav-user-info nav-user-trigger">
                  <div className="nav-avatar">{user.email[0].toUpperCase()}</div>
                  <span className="nav-email">{user.email}</span>
                  <span className="nav-chevron">▾</span>
                </button>
                <div className="nav-dropdown">
                  <Link to="/profile" className="nav-dropdown-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </Link>
                  <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" active={isActive("/login")}>Sign In</NavLink>
              <Link to="/signup" className="btn-nav-cta">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <span className={`ham-line${mobileOpen ? " open" : ""}`} />
          <span className={`ham-line${mobileOpen ? " open" : ""}`} />
          <span className={`ham-line${mobileOpen ? " open" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`nav-mobile${mobileOpen ? " open" : ""}`}>
        {user ? (
          <>
            <Link to="/menu" className="nav-mobile-link">Menu</Link>
            {!isAdmin && (
              <>
                <Link to="/cart" className="nav-mobile-link">
                  Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
                <Link to="/orders" className="nav-mobile-link">Orders</Link>
              </>
            )}
            {isAdmin && <Link to="/admin" className="nav-mobile-link">Admin Panel</Link>}
            <Link to="/profile" className="nav-mobile-link">My Profile</Link>
            <div className="nav-mobile-divider" />
            <span className="nav-mobile-email">{user.email}</span>
            <button className="nav-mobile-logout" onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-mobile-link">Sign In</Link>
            <Link to="/signup" className="nav-mobile-link">Create Account</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className={`nav-link${active ? " nav-link--active" : ""}`}>
      {children}
    </Link>
  );
}
