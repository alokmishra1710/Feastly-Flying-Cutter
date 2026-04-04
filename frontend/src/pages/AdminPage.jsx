import { useState, useEffect } from "react";
import {
  getAllUsers, adminCreateUser, toggleAdmin, deleteAccount,
  createFood, getFoods, updateFood, deleteFood,
  getAllOrders,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user && !isAdmin) navigate("/menu");
    if (!user) navigate("/login");
  }, [user, isAdmin]);

  if (!isAdmin) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: "⊞" },
    { id: "orders",   label: "Orders",   icon: "📦" },
    { id: "users",    label: "Users",    icon: "👥" },
    { id: "food",     label: "Menu",     icon: "🍽️" },
  ];

  return (
    <div className="page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-sub">Manage your restaurant</p>
        </div>
        <div className="admin-badge">
          <span className="admin-badge-dot" />
          Logged in as Admin
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((t) => (
          <button key={t.id}
            className={`tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}>
            <span className="tab-icon">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "orders"   && <OrdersTab />}
      {activeTab === "users"    && <UsersTab />}
      {activeTab === "food"     && <FoodTab />}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────
function OverviewTab() {
  const [users, setUsers] = useState([]);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllUsers(), getFoods(), getAllOrders()])
      .then(([u, f, o]) => { setUsers(u.data); setFoods(f.data); setOrders(o.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;

  const admins = users.filter((u) => u.is_admin).length;
  const revenue = orders.reduce((s, o) => s + o.total_price, 0);

  const stats = [
    { label: "Total Users",   value: users.length,            icon: "👥", color: "var(--blue)" },
    { label: "Total Orders",  value: orders.length,           icon: "📦", color: "var(--accent)" },
    { label: "Menu Items",    value: foods.length,            icon: "🍽️", color: "var(--green)" },
    { label: "Total Revenue", value: `₹${revenue.toFixed(0)}`, icon: "💰", color: "var(--amber)" },
  ];

  return (
    <div className="overview-tab">
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color }}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-glow" />
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="admin-card">
        <h3 className="admin-card-title">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          <div className="recent-orders-list">
            {[...orders].slice(0, 5).map((o) => (
              <div key={o.id} className="recent-order-row">
                <div className="recent-order-id">#{o.id}</div>
                <div className="recent-order-info">
                  <span className="recent-order-email">{o.user?.email ?? `User #${o.user_id}`}</span>
                  <span className="recent-order-date">{formatDate(o.created_at)}</span>
                </div>
                <span className="recent-order-amount">₹{o.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent users */}
      <div className="admin-card">
        <h3 className="admin-card-title">Recent Registrations</h3>
        <div className="recent-users">
          {[...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((u) => (
            <div key={u.id} className="recent-user-row">
              <div className="recent-user-avatar">{u.email[0].toUpperCase()}</div>
              <div className="recent-user-info">
                <span className="recent-user-email">{u.email}</span>
                <span className="recent-user-date">{formatDate(u.created_at)}</span>
              </div>
              <span className={`role-pill ${u.is_admin ? "admin" : "user"}`}>
                {u.is_admin ? "Admin" : "User"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu preview */}
      <div className="admin-card">
        <h3 className="admin-card-title">Menu Highlights</h3>
        <div className="menu-preview-grid">
          {foods.slice(0, 6).map((f) => (
            <div key={f.id} className="menu-preview-item">
              <span className="menu-preview-name">{f.name}</span>
              <span className="menu-preview-price">₹{f.price.toFixed(2)}</span>
            </div>
          ))}
          {foods.length === 0 && <p className="muted">No food items yet. Add some in the Menu tab.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Orders Tab (new) ──────────────────────────────────────────
function OrdersTab() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    // GET /orders/all — admin only, returns all orders from all users
    getAllOrders()
      .then((r) => {
        const sorted = [...r.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(sorted);
      })
      .catch(() => addToast("Failed to load orders", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      String(o.id).includes(q) ||
      String(o.user_id).includes(q) ||
      (o.user?.email ?? "").toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
    );
  });

  const totalRevenue = filtered.reduce((s, o) => s + o.total_price, 0);

  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;

  return (
    <div className="admin-section">
      {/* Revenue summary bar */}
      <div className="orders-summary-bar">
        <div className="orders-summary-item">
          <span className="orders-summary-label">Showing</span>
          <span className="orders-summary-value">{filtered.length} orders</span>
        </div>
        <div className="orders-summary-sep" />
        <div className="orders-summary-item">
          <span className="orders-summary-label">Revenue</span>
          <span className="orders-summary-value revenue">₹{totalRevenue.toFixed(2)}</span>
        </div>
        <div className="orders-summary-sep" />
        <div className="orders-summary-item">
          <span className="orders-summary-label">Avg. order</span>
          <span className="orders-summary-value">
            {filtered.length > 0 ? `₹${(totalRevenue / filtered.length).toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-title-row">
          <h3 className="admin-card-title">All Orders</h3>
          <span className="count-badge">{filtered.length}</span>
        </div>

        {/* Search */}
        <div className="search-wrap sm" style={{ marginBottom: "1rem" }}>
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input className="search-input" placeholder="Search by order ID, user email, address…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <p className="muted">No orders found.</p>
        ) : (
          <div className="admin-orders-list">
            {filtered.map((order) => {
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className={`admin-order-card${isOpen ? " open" : ""}`}>
                  <button className="admin-order-header" onClick={() => setExpanded(isOpen ? null : order.id)}>
                    <div className="admin-order-left">
                      <span className="admin-order-id">#{order.id}</span>
                      <div className="admin-order-meta">
                        <span className="admin-order-user">{order.user?.email ?? `User #${order.user_id}`}</span>
                        <span className="admin-order-date">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="admin-order-right">
                      <span className="admin-order-items-count">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                      <span className="admin-order-amount">₹{order.total_price.toFixed(2)}</span>
                      <span className={`order-chevron${isOpen ? " order-chevron--open" : ""}`}>▾</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="admin-order-details">
                      <div className="admin-order-address">
                        <span>📍</span>
                        <span>{order.address}</span>
                      </div>
                      <div className="order-items-table">
                        <div className="order-items-head">
                          <span>Item ID</span><span>Qty</span><span>Price at order</span><span>Subtotal</span>
                        </div>
                        {order.items.map((item) => (
                          <div key={item.id} className="order-items-row">
                            <span>Food #{item.food_id}</span>
                            <span>× {item.quantity}</span>
                            <span>₹{item.price_at_order.toFixed(2)}</span>
                            <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="order-items-total">
                          <span>Total</span><span /><span />
                          <span>₹{order.total_price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────
function UsersTab() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    getAllUsers().then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) || String(u.id).includes(search)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminCreateUser(email, password);
      addToast("User created successfully!");
      setEmail(""); setPassword(""); setShowForm(false);
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to create user", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (u) => {
    setTogglingId(u.id);
    setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, is_admin: !usr.is_admin } : usr));
    try {
      const res = await toggleAdmin(u.id);
      addToast(res.data.message || "Role updated");
      load();
    } catch (err) {
      setUsers((prev) => prev.map((usr) => usr.id === u.id ? { ...usr, is_admin: u.is_admin } : usr));
      addToast(err.response?.data?.detail || "Failed to update role", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (u) => {
    setDeletingId(u.id);
    try {
      await deleteAccount(u.id);
      setUsers((prev) => prev.filter((usr) => usr.id !== u.id));
      addToast(`User ${u.email} deleted`);
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to delete user", "error");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="admin-section">
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Delete User?</h3>
            <p className="confirm-msg">Permanently delete <strong>{confirmDelete.email}</strong>? This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}>
                {deletingId === confirmDelete.id ? <><span className="spinner" /> Deleting…</> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="search-wrap sm">
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input className="search-input" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn-primary sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New User"}
        </button>
      </div>

      {showForm && (
        <div className="admin-card form-card">
          <h3 className="admin-card-title">Create New User</h3>
          <form onSubmit={handleCreate} className="create-user-form">
            <div className="field-group">
              <label className="field-label">Email</label>
              <input type="email" className="field-input" placeholder="user@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input type="password" className="field-input" placeholder="Min. 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? <><span className="spinner" /> Creating…</> : "Create User"}
            </button>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-title-row">
          <h3 className="admin-card-title">All Users</h3>
          <span className="count-badge">{filtered.length}</span>
        </div>
        {loading ? (
          <div className="page-loader"><div className="loader-ring" /></div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr><th>ID</th><th>Email</th><th>Joined</th><th>Role</th><th>Promote/Demote</th><th>Delete</th></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td><span className="user-id">#{u.id}</span></td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-sm">{u.email[0].toUpperCase()}</div>
                        <div className="user-cell-info">
                          <span className="user-cell-email">{u.email}</span>
                          {u.is_admin && (
                            <span className="admin-live-badge">
                              <span className="admin-live-dot" />Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td><span className={`role-pill ${u.is_admin ? "admin" : "user"}`}>{u.is_admin ? "⭐ Admin" : "User"}</span></td>
                    <td>
                      <button className={`btn-role-toggle ${u.is_admin ? "demote" : "promote"}`}
                        onClick={() => handleToggle(u)} disabled={togglingId === u.id}>
                        {togglingId === u.id ? <span className="spinner spinner--sm" /> : u.is_admin ? "Demote" : "Promote"}
                      </button>
                    </td>
                    <td>
                      <button className="btn-delete-user" onClick={() => setConfirmDelete(u)} disabled={deletingId === u.id} title="Delete user">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="table-empty">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Food Tab — with inline edit + delete ──────────────────────
function FoodTab() {
  const { addToast } = useToast();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state — which food is currently being edited
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [confirmDeleteFood, setConfirmDeleteFood] = useState(null);
  const [deletingFoodId, setDeletingFoodId] = useState(null);

  const load = () => {
    setLoading(true);
    getFoods().then((r) => setFoods(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { addToast("Enter a valid price", "error"); return; }
    setAdding(true);
    try {
      await createFood(name, description, p);
      addToast(`"${name}" added to menu!`);
      setName(""); setDescription(""); setPrice("");
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to add item", "error");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (f) => {
    setEditId(f.id);
    setEditName(f.name);
    setEditDesc(f.description);
    setEditPrice(String(f.price));
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName(""); setEditDesc(""); setEditPrice("");
  };

  const handleSave = async (foodId) => {
    const p = parseFloat(editPrice);
    if (!editName.trim()) { addToast("Name cannot be empty", "error"); return; }
    if (isNaN(p) || p <= 0) { addToast("Enter a valid price", "error"); return; }
    setSaving(true);
    try {
      // PATCH /food/{id} — only sends changed fields
      await updateFood(foodId, editName.trim(), editDesc.trim(), p);
      addToast("Item updated successfully!");
      // Optimistic local update
      setFoods((prev) => prev.map((f) =>
        f.id === foodId ? { ...f, name: editName.trim(), description: editDesc.trim(), price: p } : f
      ));
      cancelEdit();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to update item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFood = async (f) => {
    setDeletingFoodId(f.id);
    try {
      // DELETE /food/{id}
      await deleteFood(f.id);
      setFoods((prev) => prev.filter((item) => item.id !== f.id));
      addToast(`"${f.name}" removed from menu`);
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to delete item", "error");
    } finally {
      setDeletingFoodId(null);
      setConfirmDeleteFood(null);
    }
  };

  return (
    <div className="admin-section">
      {/* Delete food confirm modal */}
      {confirmDeleteFood && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Remove from Menu?</h3>
            <p className="confirm-msg">
              Remove <strong>{confirmDeleteFood.name}</strong> from the menu?
              Existing orders are not affected.
            </p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setConfirmDeleteFood(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDeleteFood(confirmDeleteFood)}
                disabled={deletingFoodId === confirmDeleteFood.id}>
                {deletingFoodId === confirmDeleteFood.id
                  ? <><span className="spinner" /> Removing…</>
                  : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add food form */}
      <div className="admin-card">
        <h3 className="admin-card-title">Add New Item</h3>
        <form onSubmit={handleAdd} className="add-food-form">
          <div className="field-group">
            <label className="field-label">Item Name</label>
            <input className="field-input" placeholder="e.g. Chicken Biryani"
              value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">Description</label>
            <input className="field-input" placeholder="Short, appetizing description"
              value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">Price (₹)</label>
            <input type="number" step="0.01" min="0.01" className="field-input"
              placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={adding}>
            {adding ? <><span className="spinner" /> Adding…</> : "+ Add to Menu"}
          </button>
        </form>
      </div>

      {/* Current menu with edit/delete */}
      <div className="admin-card">
        <div className="admin-card-title-row">
          <h3 className="admin-card-title">Current Menu</h3>
          <span className="count-badge">{foods.length}</span>
        </div>
        <div className="search-wrap sm" style={{ marginBottom: "1rem" }}>
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input className="search-input" placeholder="Search menu items…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="page-loader"><div className="loader-ring" /></div>
        ) : filtered.length === 0 ? (
          <p className="muted">No items yet.</p>
        ) : (
          <div className="food-admin-list">
            {filtered.map((f) => (
              <div key={f.id} className="food-admin-row">
                {editId === f.id ? (
                  /* ── Inline edit form ── */
                  <div className="food-edit-form">
                    <div className="food-edit-fields">
                      <input className="field-input sm" placeholder="Name"
                        value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <input className="field-input sm" placeholder="Description"
                        value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                      <input type="number" step="0.01" min="0.01" className="field-input sm"
                        placeholder="Price" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                    </div>
                    <div className="food-edit-actions">
                      <button className="btn-primary sm" onClick={() => handleSave(f.id)} disabled={saving}>
                        {saving ? <span className="spinner spinner--sm" /> : "Save"}
                      </button>
                      <button className="btn-ghost" style={{ padding: "7px 14px", fontSize: "0.82rem" }}
                        onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <>
                    <div className="food-admin-emoji">{getFoodEmoji(f.name)}</div>
                    <div className="food-admin-info">
                      <span className="food-admin-name">{f.name}</span>
                      <span className="food-admin-desc">{f.description}</span>
                    </div>
                    <span className="food-admin-price">₹{f.price.toFixed(2)}</span>
                    <div className="food-admin-actions">
                      {/* Edit button */}
                      <button className="btn-food-edit" onClick={() => startEdit(f)} title="Edit item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {/* Delete button */}
                      <button className="btn-food-delete" onClick={() => setConfirmDeleteFood(f)}
                        disabled={deletingFoodId === f.id} title="Remove from menu">
                        {deletingFoodId === f.id
                          ? <span className="spinner spinner--sm" />
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getFoodEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("pasta") || n.includes("noodle")) return "🍝";
  if (n.includes("biryani") || n.includes("rice")) return "🍚";
  if (n.includes("salad")) return "🥗";
  if (n.includes("cake") || n.includes("dessert")) return "🍰";
  if (n.includes("coffee") || n.includes("drink")) return "☕";
  if (n.includes("chicken")) return "🍗";
  return "🍽️";
}

function formatDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
