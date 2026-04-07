import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getOrders } from "../api";
import { useToast } from "../context/ToastContext";

// Real status from DB — no more time-based fake logic
const STATUS_CONFIG = {
  pending:           { label: "Order Received",     step: 0, color: "var(--amber)" },
  preparing:         { label: "Preparing",           step: 1, color: "var(--amber)" },
  out_for_delivery:  { label: "Out for Delivery",    step: 2, color: "var(--blue)"  },
  delivered:         { label: "Delivered",           step: 3, color: "var(--green)" },
};

const STATUS_STEPS = ["Order Received", "Preparing", "Out for Delivery", "Delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
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

      <div className="orders-list">
        {orders.map((order) => {
          const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const isOpen = expanded === order.id;
          return (
            <div key={order.id} className={`order-card${isOpen ? " order-card--open" : ""}`}>
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
                  <div className="status-timeline">
                    {STATUS_STEPS.map((s, i) => (
                      <div key={s} className={`timeline-step${i <= status.step ? " done" : ""}`}>
                        <div className="timeline-dot" />
                        {i < STATUS_STEPS.length - 1 && <div className="timeline-line" />}
                        <span className="timeline-label">{s}</span>
                      </div>
                    ))}
                  </div>

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
                        <span>Item #{item.food_id}</span>
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
    </div>
  );
}

function formatDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}