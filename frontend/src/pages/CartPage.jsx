import { useState, useEffect } from "react";
import { getCart, createOrder, deleteCartItem } from "../api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { refreshCount } = useCart();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState("cart"); // "cart" | "checkout"
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    getCart()
      .then((r) => setCart(r.data))
      .catch(() => addToast("Failed to load cart", "error"))
      .finally(() => setLoading(false));
  }, []);

  const subtotal = cart.reduce((s, i) => s + (i.food?.price ?? 0) * i.quantity, 0);
  const deliveryFee = subtotal > 0 ? (subtotal > 199 ? 0 : 40) : 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) { addToast("Please enter a delivery address", "error"); return; }
    setPlacing(true);
    try {
      // POST /orders/ — body: { address }
      // Server fetches cart, calculates price, creates order, clears cart
      await createOrder(address);
      await refreshCount();
      addToast("Order placed successfully! 🎉");
      navigate("/orders", { state: { success: true } });
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to place order", "error");
      setPlacing(false);
    }
  };

  const handleRemove = async (cartId) => {
    setRemovingId(cartId);
    try {
      await deleteCartItem(cartId);
      setCart((prev) => prev.filter((i) => i.id !== cartId));
      await refreshCount();
      addToast("Item removed from cart");
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to remove item", "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <PageLoader />;

  if (cart.length === 0) {
    return (
      <div className="page">
        <div className="empty-page">
          <div className="empty-page-icon">🛒</div>
          <h2 className="empty-page-title">Your cart is empty</h2>
          <p className="empty-page-sub">Looks like you haven't added anything yet.</p>
          <button className="btn-primary" onClick={() => navigate("/menu")}>
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Your Cart</h1>
        <p className="page-sub">{cart.length} item{cart.length !== 1 ? "s" : ""} · ₹{subtotal.toFixed(2)}</p>
      </div>

      {/* Progress steps */}
      <div className="order-steps">
        <div className={`order-step${step === "cart" ? " active" : " done"}`}>
          <div className="step-circle">{step === "checkout" ? "✓" : "1"}</div>
          <span>Review Cart</span>
        </div>
        <div className="step-line" />
        <div className={`order-step${step === "checkout" ? " active" : ""}`}>
          <div className="step-circle">2</div>
          <span>Delivery & Pay</span>
        </div>
      </div>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items-panel">
          {step === "cart" && (
            <>
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-emoji">{getFoodEmoji(item.food?.name)}</div>
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.food?.name ?? `Item #${item.food_id}`}</span>
                      <span className="cart-item-desc">{item.food?.description}</span>
                      <span className="cart-item-unit">₹{(item.food?.price ?? 0).toFixed(2)} each</span>
                    </div>
                    <div className="cart-item-right">
                      <div className="qty-badge">× {item.quantity}</div>
                      <div className="cart-item-subtotal">
                        ₹{((item.food?.price ?? 0) * item.quantity).toFixed(2)}
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        title="Remove item"
                      >
                        {removingId === item.id
                          ? <span className="spinner spinner--sm" />
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="cart-server-note">
                💡 Prices are verified server-side at checkout. No surprises.
              </p>

              <button className="btn-primary full" onClick={() => setStep("checkout")}>
                Proceed to Checkout →
              </button>
            </>
          )}

          {step === "checkout" && (
            <form onSubmit={handlePlaceOrder} className="checkout-form">
              <button type="button" className="btn-back" onClick={() => setStep("cart")}>
                ← Back to cart
              </button>
              <h3 className="checkout-section-title">Delivery Address</h3>
              <textarea
                className="field-input textarea"
                placeholder="Enter your full delivery address including flat/house number, street, city, pincode…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                required
              />
              <div className="checkout-summary-mini">
                {cart.map((item) => (
                  <div key={item.id} className="mini-row">
                    <span>{item.food?.name} × {item.quantity}</span>
                    <span>₹{((item.food?.price ?? 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-primary full btn-order" disabled={placing}>
                {placing
                  ? <><span className="spinner" /> Placing order…</>
                  : `Place Order · ₹${total.toFixed(2)}`
                }
              </button>
            </form>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className={deliveryFee === 0 ? "text-green" : ""}>
              {deliveryFee === 0 ? (subtotal > 0 ? "Free 🎉" : "—") : `₹${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          {deliveryFee > 0 && (
            <p className="free-delivery-hint">Add ₹{(199 - subtotal).toFixed(0)} more for free delivery</p>
          )}
          <div className="summary-divider" />
          <div className="summary-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          <div className="summary-badges">
            <span className="trust-badge">🔒 Secure</span>
            <span className="trust-badge">⚡ Fast</span>
            <span className="trust-badge">✓ Reliable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFoodEmoji(name = "") {
  const n = name?.toLowerCase() ?? "";
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

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-ring" />
    </div>
  );
}
