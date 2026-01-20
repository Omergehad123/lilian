import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaTag } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { BsCartXFill } from "react-icons/bs";
import { CiCircleRemove } from "react-icons/ci";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useCart } from "../hooks/useCart";

function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { cart, removeFromCart, increaseItemQty, decreaseItemQty, cartTotal } =
    useCart();

  // ✅ Promo Code State - FULLY FUNCTIONAL
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const dir = language === "ar" ? "rtl" : "ltr";

  // ✅ FIXED Promo Validation Logic
  const validatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoValid(false);
      setPromoDiscount(0);
      setPromoError("");
      return;
    }

    setPromoLoading(true);
    setPromoError("");

    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/promos/validate",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.promo) {
        setPromoValid(true);
        setPromoDiscount(data.promo.discountPercent);
        setPromoError("");
      } else {
        setPromoValid(false);
        setPromoDiscount(0);
        setPromoError(
          data.message ||
            (language === "ar" ? "كود الخصم غير صحيح" : "Invalid promo code")
        );
      }
    } catch (error) {
      console.error("Promo validation error:", error);
      setPromoError(language === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setPromoLoading(false);
    }
  };

  // ✅ Persist promo code
  useEffect(() => {
    const savedPromo = localStorage.getItem("promoCode");
    if (savedPromo) {
      setPromoCode(savedPromo);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("promoCode", promoCode);
  }, [promoCode]);

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  const handleCheckout = () => {
    if (!user) {
      // ✅ Store cart URL before redirect
      sessionStorage.setItem("authReturnUrl", window.location.pathname);
      return navigate("/register"); // or "/login"
    }

    const checkoutData = {
      promoCode: promoValid ? promoCode : null,
      promoDiscount: promoValid ? promoDiscount : 0,
    };
    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    navigate("/checkout");
  };

  const handleBack = () => navigate(-1);

  const displayName = (name) => {
    if (!name) return language === "ar" ? "منتج" : "Product";
    if (typeof name === "string") return name;
    return (
      name[language] ||
      name.en ||
      name.ar ||
      (language === "ar" ? "منتج" : "Product")
    );
  };

  // ✅ Discount calculations
  const discountedTotal = cartTotal * (1 - promoDiscount / 100);
  const discountAmount = cartTotal * (promoDiscount / 100);

  const getPromoButtonText = () => {
    if (promoLoading) return language === "ar" ? "جارٍ..." : "Loading...";
    return language === "ar" ? "تطبيق" : "Apply";
  };

  return (
    <div className="bg-[#eee] relative" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2]">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">
          {language === "ar" ? "سلة التسوق" : "Shopping Cart"}
        </h1>
        <button
          className="flex items-center justify-center cursor-pointer pb-2"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "EN" : "ع"}
          </span>
        </button>
      </div>

      <div>
        {/* ✅ Promotions - YOUR ORIGINAL DESIGN + FULL FUNCTIONALITY */}
        <div className="flex flex-col gap-1 pb-5 pt-10">
          <h1 className="text-gray-600 capitalize px-3 font-semibold">
            {language === "ar" ? "العروض" : "Promotions"}
          </h1>
          <div className="bg-white py-7 pl-3 pr-20 flex flex-col gap-2">
            <div className="flex items-center gap-5">
              <FaTag className="text-gray-500 flex-shrink-0" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={
                  language === "ar" ? "أدخل كود الخصم" : "Enter promotion code"
                }
                className="text-gray-500 border-b border-b-gray-300 pb-1 w-full focus:outline-none"
                onKeyPress={(e) => e.key === "Enter" && validatePromo()}
              />
              <button
                onClick={validatePromo}
                disabled={promoLoading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-all ${
                  promoLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {getPromoButtonText()}
              </button>
            </div>

            {/* ✅ Error Message */}
            {promoError && (
              <p className="text-red-500 text-sm px-1">{promoError}</p>
            )}

            {/* ✅ Success Message */}
            {promoValid && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                <span className="text-green-700 font-medium">
                  ✅ {promoCode} - {promoDiscount}% خصم
                </span>
                <button
                  onClick={() => {
                    setPromoCode("");
                    setPromoValid(false);
                    setPromoDiscount(0);
                    setPromoError("");
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Cart Items - YOUR ORIGINAL DESIGN */}
        <div className="flex flex-col gap-1 py-5 min-h-[70vh]">
          <h1 className="text-gray-600 capitalize px-3 font-semibold">
            {language === "ar" ? "المنتجات" : "Items"}
          </h1>

          <div className="bg-white py-7 pl-3 relative">
            {cart.length === 0 ? (
              <div className="flex items-center gap-4 w-full">
                <BsCartXFill className="text-5xl text-gray-400" />
                <div>
                  <h1 className="font-bold text-gray-500 text-lg">
                    {language === "ar"
                      ? "سلة التسوق فارغة"
                      : "Your cart is empty"}
                  </h1>
                  <p className="text-gray-500">
                    {language === "ar"
                      ? "أضف بعض المنتجات إلى سلتك."
                      : "Add some items to your cart."}
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 mt-4 border border-[#eee] px-10 py-1 rounded-md text-gray-300 text-xs font-medium hover:bg-[#f7f7f7] hover:text-gray-500 transition"
                  >
                    <FaArrowLeft />
                    {language === "ar" ? "ابدأ التسوق" : "Start Shopping"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="w-[95%] min-h-[70vh] mx-auto">
                {cart.map((item) => {
                  const id = item._id;
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
                            {item.price.toFixed(3)} kw
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

                {/* ✅ Checkout Bar - YOUR ORIGINAL DESIGN + DISCOUNT SUPPORT */}
                <div className="rounded-md flex flex-col gap-2 px-5 py-4 bg-[#d3e2e7] shadow-lg mt-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md w-10 h-10 bg-gray-400 flex items-center justify-center font-bold">
                      {cart.length}
                    </span>
                    <span className="text-gray-700 font-bold">
                      {cartTotal.toFixed(3)} kw
                    </span>
                  </div>

                  {/* ✅ Discount Display */}
                  {promoValid && (
                    <div className="flex justify-between items-center bg-green-50 p-2 rounded-md border border-green-200">
                      <span className="text-sm text-green-700 font-medium">
                        خصم {promoCode}: -{discountAmount.toFixed(3)} kw
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {discountedTotal.toFixed(3)} kw
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="capitalize w-full text-white font-semibold py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-md transition-all text-center disabled:bg-gray-400"
                  >
                    {language === "ar" ? "الدفع" : "Go to checkout"}
                  </button>
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
