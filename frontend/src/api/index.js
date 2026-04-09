import axios from "axios";

const BASE_URL = "https://feastly-backend-z8bu.onrender.com";
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Only auto-redirect on 401 if the user was already logged in (token expired).
    // Do NOT redirect during login/signup — those 401s are just wrong credentials
    // and should be handled by the page itself (show an error message).
    const isAuthRoute =
      err.config?.url?.includes("/auth/login") ||
      err.config?.url?.includes("/auth/signup");

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const signup = (email, password, recaptcha_token = "dev-bypass") =>
  api.post("/auth/signup", { email, password, recaptcha_token });

export const login = (email, password, recaptcha_token = "dev-bypass") => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  form.append("recaptcha_token", recaptcha_token);
  return api.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// ── Food ──────────────────────────────────────────────────────
export const getFoods = () => api.get("/food/");
export const createFood = (name, description, price) =>
  api.post("/food/", { name, description, price });
export const updateFood = (food_id, name, description, price) =>
  api.patch(`/food/${food_id}`, { name, description, price });
export const deleteFood = (food_id) => api.delete(`/food/${food_id}`);

// ── Cart ──────────────────────────────────────────────────────
export const getCart = () => api.get("/cart/");
export const addToCart = (food_id, quantity = 1) =>
  api.post("/cart/", { food_id, quantity });
export const deleteCartItem = (cart_id) => api.delete(`/cart/${cart_id}`);

// ── Orders ────────────────────────────────────────────────────
export const createOrder = (address) => api.post("/orders/", { address });
export const getOrders = () => api.get("/orders/");
export const getAllOrders = () => api.get("/orders/all");

// ── Users (Admin) ─────────────────────────────────────────────
export const getAllUsers = () => api.get("/users/");
export const adminCreateUser = (email, password) =>
  api.post("/users/", { email, password, recaptcha_token: "dev-bypass" });
export const toggleAdmin = (user_id) =>
  api.patch(`/users/${user_id}/toggle-admin`);
export const deleteAccount = (user_id) => api.delete(`/users/${user_id}`);

export const updateOrderStatus = (order_id, status) =>
  api.patch(`/orders/${order_id}/status`, { status });


// ── Cart update quantity ──────────────────────────────────────
export const updateCartQuantity = (cart_id, quantity) =>
  api.patch(`/cart/${cart_id}`, { quantity });

// ── Order cancel ──────────────────────────────────────────────
export const cancelOrder = (order_id) =>
  api.patch(`/orders/${order_id}/cancel`);

// ── Food availability toggle ──────────────────────────────────
export const toggleFoodAvailability = (food_id, is_available) =>
  api.patch(`/food/${food_id}`, { is_available });

// ── User change password ──────────────────────────────────────
export const changePassword = (current_password, new_password) =>
  api.patch(`/users/me/change-password`, { current_password, new_password });

// ------user forgot password-------
export const forgotPassword = (email, new_password, recaptcha_token) =>
  api.post("/auth/forgot-password", { email, new_password, recaptcha_token });