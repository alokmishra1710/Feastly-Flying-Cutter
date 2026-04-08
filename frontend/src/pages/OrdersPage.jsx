import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getOrders, cancelOrder } from "../api";
import { useToast } from "../context/ToastContext";

const STATUS_CONFIG = {
  pending:          { label: "Order Received",    step: 0, color: "var(--amber)" },
  preparing:        { label: "Preparing",          step: 1, color: "var(--amber)" },
  out_for_delivery: { label: "Out for Delivery",   step: 2, color: "var(--blue)"  },
  delivered:        { label: "Delivered",          step: 3, color: "var(--green)" },
  cancelled:        { label: "Cancelled",          step: -1, color: "var(--error, #e55)" },
};

const STATUS_STEPS = ["Order Received", "Preparing", "Out for Delivery", "Delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");          // ← NEW
  const [cancellingId, setCancellingId] = useState(null); // ← NEW
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (location.state?.success) addToast("Order placed successfully! 🎉");
    getOrders()
      .then((r) => {
        const sorted = [...r.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(sorted);
        if (sorted.length > 0) setExpanded(sorted[0].id);
      })
      .catch(() => addToast("Failed to load orders", "error"))
      .finally(() => setLoading(false));
  }, []);

  // ← NEW: search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) =>
      String(o.id).includes(q) ||
      o.address.toLowerCase().includes(q) ||
      o.items.some((i) => (i.food_name ?? "").toLowerCase().includes(q))
    );
  }, [orders, search]);

  // ← NEW: cancel handler
  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o)
      );
      addToast("Order cancelled successfully");
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to cancel order", "error");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;

  if (orders.length === 0) {
    return (
      <div className="page">
        <div className="empty-page">
          <div className="empty-page-icon">📦</div>
          <h2 className="empty-page-title">No orders yet</h2>
          <p className="empty-page-sub">Your order history will appear here.</p>
          <button className="btn-primary" onClick={() => navigate("/menu")}>Start Ordering</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
      </div>

      {/* ← NEW search bar */}
      <div className="search-wrap" style={{ marginBottom: "1.5rem" }}>
        <span className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </span>
        <input
          className="search-input"
          placeholder="Search by order ID, address or food name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No orders found</h3>
          <button className="btn-ghost" onClick={() => setSearch("")}>Clear search</button>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => {
            const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const isOpen = expanded === order.id;
            const isCancelled = order.status === "cancelled";

            return (
              <div key={order.id} className={`order-card${isOpen ? " order-card--open" : ""}${isCancelled ? " order-card--cancelled" : ""}`}>
                <button
                  className="order-card-header"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div className="order-left">
                    <div className="order-id-badge">#{order.id}</div>
                    <div className="order-meta">
                      <span className="order-date">{formatDate(order.created_at)}</span>
                      <span className="order-items-count">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="order-right">
                    <span className="order-status-pill" style={{ "--status-color": status.color }}>
                      {status.label}
                    </span>
                    <span className="order-total-amount">₹{order.total_price.toFixed(2)}</span>
                    <span className={`order-chevron${isOpen ? " order-chevron--open" : ""}`}>▾</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="order-details">
                    {/* Status timeline — hide for cancelled */}
                    {!isCancelled && (
                      <div className="status-timeline">
                        {STATUS_STEPS.map((s, i) => (
                          <div key={s} className={`timeline-step${i <= status.step ? " done" : ""}`}>
                            <div className="timeline-dot" />
                            {i < STATUS_STEPS.length - 1 && <div className="timeline-line" />}
                            <span className="timeline-label">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="order-address-row">
                      <span className="order-address-icon">📍</span>
                      <span className="order-address-text">{order.address}</span>
                    </div>

                    <div className="order-items-table">
                      <div className="order-items-head">
                        <span>Item</span><span>Qty</span><span>Price (at order)</span><span>Subtotal</span>
                      </div>
                      {order.items.map((item) => (
                        <div key={item.id} className="order-items-row">
                          {/* ← NOW shows food name */}
                          <span>{item.food_name ?? `Item #${item.food_id}`}</span>
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

                    {/* ← NEW cancel button — only for pending orders */}
                    {order.status === "pending" && (
                      <button
                        className="btn-danger-outline"
                        style={{ marginTop: "1rem" }}
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                      >
                        {cancellingId === order.id
                          ? <><span className="spinner spinner--sm" /> Cancelling…</>
                          : "Cancel Order"
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}