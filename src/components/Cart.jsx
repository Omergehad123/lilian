import React, { useEffect, useState, useCallback } from "react";
import { FaArrowLeft, FaTag } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { BsCartXFill } from "react-icons/bs";
import { CiCircleRemove } from "react-icons/ci";

import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import translations from "../utils/translations";

function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { language, changeLanguage } = useLanguage();
  const [t, setT] = useState({});

  // Safe translation system
  const getTranslation = useCallback(
    (key, fallback = key) => {
      return t[key] || translations[language]?.[key] || fallback;
    },
    [language, t]
  );

  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  });

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  const handleCheckout = () => {
    if (!user) {
      navigate("/register");
      return;
    }
    navigate("/checkout");
  };

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "cart") {
        try {
          setCart(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setCart([]);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const cartTotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter((item) => (item._id || item.id) !== itemId);
    updateCart(newCart);
  };

  const decreaseItemQty = (itemId) => {
    const newCart = cart
      .map((item) =>
        (item._id || item.id) === itemId
          ? { ...item, quantity: (item.quantity || 1) - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);
    updateCart(newCart);
  };

  const increaseItemQty = (itemId) => {
    const newCart = cart.map((item) =>
      (item._id || item.id) === itemId
        ? { ...item, quantity: (item.quantity || 1) + 1 }
        : item
    );
    updateCart(newCart);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const displayName = (name) => {
    if (!name) return getTranslation("productFallback", "Product");
    if (typeof name === "string") return name;
    return (
      name[language] ||
      name.en ||
      name.ar ||
      getTranslation("productFallback", "Product")
    );
  };

  return (
    <div className="bg-[#eee] relative" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2]">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">
          {getTranslation("shoppingCart", "Shopping Cart")}
        </h1>
        <button
          className="flex items-center justify-center cursor-pointer pb-2"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      <div>
        {/* Promotions */}
        <div className="flex flex-col gap-1 pb-5 pt-10">
          <h1 className="text-gray-600 capitalize px-3 font-semibold">
            {getTranslation("promotions", "Promotions")}
          </h1>
          <div className="bg-white py-7 pl-3 pr-20 flex items-center gap-5">
            <FaTag className="text-gray-500" />
            <input
              type="text"
              placeholder={
                language === "ar" ? "أدخل كود الخصم" : "Enter promotion code"
              }
              className="text-gray-500 border-b border-b-gray-300 pb-1 w-full focus:outline-none"
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-1 py-5 min-h-[70vh]">
          <h1 className="text-gray-600 capitalize px-3 font-semibold">
            {getTranslation("cartItems", "Items")}
          </h1>

          <div className="bg-white py-7 pl-3 relative">
            {cart.length === 0 ? (
              <div className="flex items-center gap-4 w-full">
                <BsCartXFill className="text-5xl text-gray-400" />
                <div>
                  <h1 className="font-bold text-gray-500 text-lg">
                    {language === "ar"
                      ? "سلة التسوق فارغة"
                      : getTranslation("cartEmptyTitle", "Your cart is empty")}
                  </h1>
                  <p className="text-gray-500">
                    {language === "ar"
                      ? "أضف بعض المنتجات إلى سلتك."
                      : getTranslation(
                          "cartEmptyText",
                          "Add some items to your cart."
                        )}
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 mt-4 border border-[#eee] px-10 py-1 rounded-md text-gray-300 text-xs font-medium hover:bg-[#f7f7f7] hover:text-gray-500 transition"
                  >
                    <FaArrowLeft />
                    {language === "ar"
                      ? "ابدأ التسوق"
                      : getTranslation("startShopping", "Start Shopping")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="w-[95%] min-h-[70vh] mx-auto">
                {cart.map((item) => {
                  const id = item._id || item.id;
                  return (
                    <div
                      key={id}
                      className="flex justify-between items-start px-4 py-4 border-b border-gray-100 gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <img
                          src={item.image || "./products/product1.jpg"}
                          alt="cart item"
                          className="w-16 h-16 object-cover rounded flex-shrink-0 mt-1"
                        />
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <span className="font-bold text-black truncate text-sm">
                            {displayName(item.name)}
                          </span>
                          <span className="text-gray-500 text-xs uppercase font-semibold">
                            {item.price},000 kwd
                          </span>
                          {item.message && item.message.trim() && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-500 italic bg-gray-50 px-2 py-1 rounded-sm block">
                                "{item.message}"
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => decreaseItemQty(id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 hover:bg-gray-100 text-lg font-bold flex-shrink-0"
                            >
                              -
                            </button>
                            <span className="mx-2 text-gray-700 font-medium min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseItemQty(id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 hover:bg-gray-100 text-lg font-bold flex-shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(id)}
                        className="text-xl text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                      >
                        <CiCircleRemove />
                      </button>
                    </div>
                  );
                })}

                {/* checkout bar */}
                <div className="rounded-md flex items-center justify-between px-5 py-2 bg-[#d3e2e7] shadow-lg">
                  <span className="rounded-md w-10 h-10 bg-gray-400 flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                  <button
                    onClick={handleCheckout}
                    className="capitalize text-gray-700 font-semibold cursor-pointer hover:text-black transition-colors"
                  >
                    {getTranslation("checkoutBtn", "Go to checkout")}
                  </button>
                  <span className="text-gray-700 font-bold">
                    {cartTotal},000 kwd
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
