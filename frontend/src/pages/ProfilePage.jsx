import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { deleteAccount } from "../api";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== user.email) {
      addToast("Email does not match", "error");
      return;
    }
    setDeleting(true);
    try {
      // DELETE /users/{user_id} — deletes the account
      await deleteAccount(user.id);
      addToast("Account deleted. Goodbye!");
      logout();
      navigate("/login");
    } catch (err) {
      addToast(
        err.response?.data?.detail || "Failed to delete account. Ask an admin.",
        "error"
      );
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Account details and settings</p>
      </div>

      {/* Account Info Card */}
      <div className="profile-card">
        <div className="profile-avatar-lg">{user?.email?.[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <h2 className="profile-email">{user?.email}</h2>
          <div className="profile-meta">
            <span className={`role-pill ${user?.is_admin ? "admin" : "user"}`}>
              {user?.is_admin ? "⭐ Admin" : "Regular User"}
            </span>
            <span className="profile-id">ID #{user?.id}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="profile-links">
        <button className="profile-link-btn" onClick={() => navigate("/orders")}>
          <span className="profile-link-icon">📦</span>
          <div>
            <span className="profile-link-title">Order History</span>
            <span className="profile-link-sub">View all your past orders</span>
          </div>
          <span className="profile-link-arrow">›</span>
        </button>
        <button className="profile-link-btn" onClick={() => navigate("/cart")}>
          <span className="profile-link-icon">🛒</span>
          <div>
            <span className="profile-link-title">Your Cart</span>
            <span className="profile-link-sub">Review items in your cart</span>
          </div>
          <span className="profile-link-arrow">›</span>
        </button>
        {user?.is_admin && (
          <button className="profile-link-btn" onClick={() => navigate("/admin")}>
            <span className="profile-link-icon">⚙️</span>
            <div>
              <span className="profile-link-title">Admin Panel</span>
              <span className="profile-link-sub">Manage users and menu</span>
            </div>
            <span className="profile-link-arrow">›</span>
          </button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="danger-zone">
        <h3 className="danger-zone-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Danger Zone
        </h3>
        <div className="danger-item">
          <div>
            <p className="danger-item-title">Delete Account</p>
            <p className="danger-item-desc">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            className="btn-danger-outline"
            onClick={() => setShowConfirm(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <h3 className="confirm-title">Delete your account?</h3>
            <p className="confirm-msg">
              This will permanently delete your account, cart, and order history.
              <strong> This cannot be undone.</strong>
            </p>
            <p className="confirm-instruction">
              Type your email <strong>{user?.email}</strong> to confirm:
            </p>
            <input
              type="email"
              className="field-input"
              placeholder={user?.email}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
            <div className="confirm-actions">
              <button
                className="btn-ghost"
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText !== user?.email}
              >
                {deleting
                  ? <><span className="spinner" /> Deleting…</>
                  : "Delete My Account"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
