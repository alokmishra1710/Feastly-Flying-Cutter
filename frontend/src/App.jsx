import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";

import ProfilePage from "./pages/ProfilePage";

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  const defaultPath = user ? (isAdmin ? "/admin" : "/menu") : "/login";

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"   element={user ? <Navigate to={defaultPath} /> : <LoginPage />} />
        <Route path="/signup"  element={user ? <Navigate to={defaultPath} /> : <SignupPage />} />
        <Route path="/menu"    element={<MenuPage />} />
        <Route path="/cart"    element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/orders"  element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin"   element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="*"        element={<Navigate to={defaultPath} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
