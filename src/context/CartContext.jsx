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

  // Add item to cart (or increase quantity if exists)
  const addToCart = (item) => {
    const itemId = item._id || item.id; // normalize ID

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === itemId);

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem._id === itemId
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
            _id: itemId, // ensure _id exists
            quantity: item.quantity || 1,
          },
        ];
      }
    });
  };

  // Remove item by _id
  const removeFromCart = (itemId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => (item._id === itemId ? false : true))
    );
  };

  // Increase quantity
  const increaseItemQty = (itemId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Decrease quantity, remove if 0
  const decreaseItemQty = (itemId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item._id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };
  const clearCart = () => {
    setCart([]); // Clear cart state
    localStorage.removeItem("cart"); // Clear localStorage if used
  };

  // Total cost, only valid items
  const cartTotal = cart.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return total + price * quantity;
  }, 0);

  const cartLength = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseItemQty,
        decreaseItemQty,
        cartTotal,
        cartLength,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
