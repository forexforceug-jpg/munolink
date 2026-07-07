import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [selectedShopName, setSelectedShopName] = useState(null);

  const addToCart = useCallback((product, shopId, shopName) => {
    // If switching shops, clear cart
    if (selectedShopId && selectedShopId !== shopId) {
      setCartItems([]);
    }
    setSelectedShopId(shopId);
    setSelectedShopName(shopName);

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [selectedShopId]);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === productId ? { ...item, quantity } : item)
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedShopId(null);
    setSelectedShopName(null);
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.munolinkPrice * item.quantity), 0);
  const cartRegularTotal = cartItems.reduce((sum, item) => sum + (item.regularPrice * item.quantity), 0);
  const cartSavings = cartRegularTotal - cartTotal;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, selectedShopId, selectedShopName, cartTotal,
      cartRegularTotal, cartSavings, itemCount,
      addToCart, removeFromCart, updateQuantity, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);