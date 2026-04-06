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
    if (err.response?.status === 401) {
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

export const resetUserPassword = (user_id, new_password) =>
  api.patch(`/users/${user_id}/reset-password`, { new_password });
