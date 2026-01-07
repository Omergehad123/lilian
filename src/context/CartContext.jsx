import React, { createContext, useState, useEffect } from "react";

const CartContext = createContext();

const CART_STORAGE_KEY = "cart";

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage, or empty array
  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  });

  // Sync cart with localStorage every time it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const addToCart = (item) => {
    const itemId = item._id || item.id;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => (cartItem._id || cartItem.id) === itemId
      );

      if (existingItem) {
        return prevCart.map((cartItem) =>
          (cartItem._id || cartItem.id) === itemId
            ? {
                ...cartItem,
                quantity: cartItem.quantity + (item.quantity || 1),
              }
            : cartItem
        );
      } else {
        return [
          ...prevCart,
          {
            ...item,
            _id: itemId,
            quantity: item.quantity || 1,
          },
        ];
      }
    });
  };

  // Ensure removal from cart updates state AND triggers useEffect/localStorage update immediately
  const removeFromCart = (itemId) => {
    setCart((prevCart) => {
      // Remove by _id or id for consistency
      const updatedCart = prevCart.filter(
        (item) => (item._id || item.id) !== itemId
      );
      return updatedCart;
    });
  };

  const decreaseItemQty = (itemId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          (item._id || item.id) === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const increaseItemQty = (itemId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        (item._id || item.id) === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const cartTotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Add cartLength to provider for convenience/accuracy in popup
  const cartLength = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        decreaseItemQty,
        increaseItemQty,
        cartTotal,
        cartLength,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
