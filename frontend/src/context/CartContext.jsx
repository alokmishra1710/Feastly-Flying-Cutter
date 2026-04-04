import { createContext, useContext, useState, useCallback } from "react";
import { getCart } from "../api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const res = await getCart();
      setCartCount(res.data.length);
    } catch {
      setCartCount(0);
    }
  }, []);

  const increment = useCallback(() => setCartCount((c) => c + 1), []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCount, increment }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
