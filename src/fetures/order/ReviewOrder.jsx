// ✅ ReviewOrder.jsx - FIXED Promo Code Application + Local State Sync
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCreditCard, FaTag } from "react-icons/fa";
import { CiCircleRemove } from "react-icons/ci";
import { useAuth } from "../../hooks/useAuth";
import { useOrder } from "../../hooks/useOrder";
import { useCart } from "../../hooks/useCart";

function ReviewOrder() {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const { user, token } = useAuth();
  const {
    order,
    setSpecialInstructions,
    setPromoCode,
    setPromoDiscount,
    subtotal,
    shippingCost,
    totalAmount: grandTotal,
    promoCode: orderPromoCode,
    promoDiscount: orderPromoDiscount,
    validatePromoCode,
    setPaymentMethod,
    getOrderPayload,
    loadingCities,
  } = useOrder();

  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // 🔥 FIXED: Local promo state that syncs with order context
  const [localPromoCode, setLocalPromoCode] = useState(orderPromoCode || "");
  const [localPromoDiscount, setLocalPromoDiscount] = useState(
    orderPromoDiscount || 0
  );
  const [specialInstructions, setSpecialInstructionsLocal] = useState("");

  const dir = language === "ar" ? "rtl" : "ltr";

  // 🔥 SYNC LOCAL PROMO WITH ORDER CONTEXT
  useEffect(() => {
    setLocalPromoCode(orderPromoCode || "");
    setLocalPromoDiscount(orderPromoDiscount || 0);
  }, [orderPromoCode, orderPromoDiscount]);

  // 🔥 Load cart promo data from localStorage (fallback)
  useEffect(() => {
    try {
      const checkoutData = localStorage.getItem("checkoutData");
      if (checkoutData) {
        const data = JSON.parse(checkoutData);
        if (data.promoCode && data.promoDiscount > 0) {
          setLocalPromoCode(data.promoCode);
          setLocalPromoDiscount(data.promoDiscount);
        }
      }
    } catch (error) {
      console.error("Error reading checkoutData:", error);
    }
  }, []);

  // Helper: Compute subtotal from items
  const computeTotalsFromItems = useCallback((items) => {
    let computedSubtotal = 0;
    if (!Array.isArray(items) || items.length === 0)
      return { computedSubtotal: 0 };
    for (const item of items) {
      const price = isNaN(Number(item.price)) ? 0 : Number(item.price);
      const qty = isNaN(Number(item.quantity)) ? 1 : Number(item.quantity);
      computedSubtotal += price * qty;
    }
    return { computedSubtotal };
  }, []);

  // Order items - prioritize non-empty arrays
  const orderItems = useMemo(() => {
    if (order?.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    if (cart && Array.isArray(cart) && cart.length > 0) {
      return cart;
    }
    return [];
  }, [order?.items, cart]);

  const { computedSubtotal: manualSubtotal } = useMemo(
    () => computeTotalsFromItems(orderItems),
    [orderItems, computeTotalsFromItems]
  );

  // 🔥 FIXED NUMBER HANDLING
  const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const safeSubtotal = useMemo(() => {
    const subtotalNum = toNumber(subtotal);
    return subtotalNum > 0 ? subtotalNum : manualSubtotal;
  }, [subtotal, manualSubtotal]);

  // 🔥 USE LOCAL PROMO DISCOUNT (PRIORITY: local > order context)
  const activePromoDiscount =
    localPromoDiscount > 0 ? localPromoDiscount : toNumber(orderPromoDiscount);
  const discountAmount = safeSubtotal * (activePromoDiscount / 100);
  const safeDiscountedSubtotal = safeSubtotal - discountAmount;
  const safeShippingCost = toNumber(shippingCost);
  const safeGrandTotal = safeDiscountedSubtotal + safeShippingCost;

  const orderType = order?.orderType || "pickup";
  const isValidOrder =
    orderItems.length > 0 && safeGrandTotal > 0 && !loadingCities;

  const formatCurrency = useCallback((value) => {
    const num = toNumber(value);
    return num.toFixed(3);
  }, []);

  const toggleLanguage = useCallback(
    () => changeLanguage?.(language === "en" ? "ar" : "en"),
    [language, changeLanguage]
  );

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const displayName = useCallback(
    (name) => {
      if (!name) return language === "ar" ? "منتج" : "Product";
      if (typeof name === "string") return name;
      return (
        name[language] ||
        name.en ||
        name.ar ||
        (language === "ar" ? "منتج" : "Product")
      );
    },
    [language]
  );

  const getFullAddress = useCallback(() => {
    if (orderType === "pickup") {
      return language === "ar" ? "استلام من المتجر" : "Store Pickup";
    }
    const addr = order?.shippingAddress;
    const parts = [
      addr?.city || "Kuwait City",
      addr?.area || "Downtown",
      addr?.street || "Main St",
      `Block ${addr?.block || 1}`,
      `House ${addr?.house || 1}`,
    ].filter(Boolean);
    return (
      parts.join(", ") || (language === "ar" ? "غير محدد" : "Not specified")
    );
  }, [order?.shippingAddress, orderType, language]);

  const getScheduleDisplay = useCallback(() => {
    const slot = order?.scheduledSlot;
    if (!slot?.date) return language === "ar" ? "في أقرب وقت ممكن" : "ASAP";
    return `${slot.date.split("-").reverse().join("/")} | ${slot.timeSlot || "ASAP"
      }`;
  }, [order?.scheduledSlot, language]);

  // 🔥 FIXED: CLEAR PROMO - Updates both local and order context
  const clearPromo = useCallback(() => {
    setLocalPromoCode("");
    setLocalPromoDiscount(0);
    setPromoCode("");
    setPromoDiscount(0);
    localStorage.removeItem("checkoutData");
  }, [setPromoCode, setPromoDiscount]);

  // 🔥 FIXED: APPLY PROMO - Updates ALL states properly
  const handleApplyPromo = useCallback(async () => {
    if (!localPromoCode.trim()) return;

    setLoading(true);
    try {
      const result = await validatePromoCode(localPromoCode);

      if (result.valid) {
        // ✅ SUCCESS: Update ALL promo states
        setLocalPromoDiscount(result.discount || 0);
        setPromoCode(localPromoCode);
        setPromoDiscount(result.discount || 0);

        // Save to localStorage for cart sync
        const checkoutData = {
          promoCode: localPromoCode,
          promoDiscount: result.discount || 0,
        };
        localStorage.setItem("checkoutData", JSON.stringify(checkoutData));

        alert(
          language === "ar"
            ? `تم تطبيق الخصم ${result.discount}% بنجاح!`
            : `Promo applied successfully! ${result.discount}% off`
        );
      } else {
        alert(
          result.message ||
          (language === "ar" ? "كود الخصم غير صحيح" : "Invalid promo code")
        );
        // Reset on failure
        setLocalPromoCode("");
      }
    } catch (error) {
      console.error("Promo validation error:", error);
      alert(
        language === "ar" ? "خطأ في التحقق من الكود" : "Promo validation error"
      );
      setLocalPromoCode("");
    } finally {
      setLoading(false);
    }
  }, [
    localPromoCode,
    validatePromoCode,
    language,
    setPromoCode,
    setPromoDiscount,
  ]);

  // 🔥 IMPORTANT FIX: SAVE ORDER BEFORE PAYMENT
  const handlePaymentMethodSelect = useCallback(async (method) => {
    if (loading || safeGrandTotal === 0 || !isValidOrder) return;

    setLoading(true);
    let savedOrderId = null;

    try {
      // 🔥 STEP 1: SAVE ORDER TO DATABASE FIRST
      const cleanPhone = (order.customerPhone || "")
        .replace(/\D/g, "")
        .slice(0, 10);

      const orderPayload = {
        ...getOrderPayload(),
        customerEmail: order.customerEmail || "customer@lilian.com",
        customerPhone: cleanPhone,
        paymentMethod: method,
        promoCode: localPromoCode,
        promoDiscount: activePromoDiscount,
      };

      const saveOrderResponse = await fetch(
        "https://lilian-backend.onrender.com/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user?._id && !user?.isGuest && token && {
              Authorization: `Bearer ${token}`
            })
          },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!saveOrderResponse.ok) {
        const errorText = await saveOrderResponse.text();
        throw new Error(errorText || "Failed to save order");
      }

      const saveOrderData = await saveOrderResponse.json();
      savedOrderId = saveOrderData.orderId || saveOrderData._id || saveOrderData.data?.orderId;

      // 🔥 STEP 2: CREATE PAYMENT WITH ORDER ID
      const paymentData = {
        amount: safeGrandTotal.toFixed(3),
        customerName: (order.customerName || "Guest Customer").trim(),
        customerEmail: order.customerEmail || "customer@lilian.com",
        phone: cleanPhone,
        paymentMethod: method,
        userId: user?._id || "guest",
        promoCode: localPromoCode,
        promoDiscount: activePromoDiscount,
        orderId: savedOrderId,
        orderData: getOrderPayload(),
      };

      const response = await fetch(
        "https://lilian-backend.onrender.com/api/payment/myfatoorah",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        }
      );

      const rawResponse = await response.text();

      if (!response.ok) {
        const errorData = JSON.parse(rawResponse);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = JSON.parse(rawResponse);

      if (data.isSuccess) {
        // ✅ PAYMENT SUCCESS - Save for success page
        localStorage.setItem("paymentOrderId", savedOrderId);
        localStorage.setItem("paymentUrl", data.paymentUrl);
        localStorage.setItem("paymentMethod", method);

        // Redirect to MyFatoorah
        window.location.href = data.paymentUrl;
        return;
      } else {
        throw new Error(data.message || "Payment initiation failed");
      }

    } catch (error) {
      console.error("❌ Payment flow error:", error);

      // 🔥 CLEANUP: Delete failed order
      if (savedOrderId) {
        await fetch(`https://lilian-backend.onrender.com/api/orders/${savedOrderId}`, {
          method: "DELETE",
          headers: {
            ...(token && user?._id && !user.isGuest && { Authorization: `Bearer ${token}` })
          }
        });
      }

      alert(language === "ar" ? "فشل الدفع. حاول مرة أخرى." : "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    loading, safeGrandTotal, isValidOrder, token, user, getOrderPayload, order,
    localPromoCode, activePromoDiscount
  ]);

  useEffect(() => {
    if (order?.message) {
      setSpecialInstructionsLocal(order.message);
    }
  }, [order?.message]);

  const labels = useMemo(
    () => ({
      items: language === "ar" ? "العناصر" : "Order Items",
      shipping: language === "ar" ? "تكلفة التوصيل" : "Shipping Cost",
      subtotal: language === "ar" ? "المجموع الفرعي" : "Subtotal",
      discount: language === "ar" ? "الخصم" : "Discount",
      total: language === "ar" ? "الإجمالي النهائي" : "Grand Total",
      specialInstructions:
        language === "ar"
          ? "ملاحظات أو تعليمات خاصة (اختياري)"
          : "Special Instructions (optional)",
    }),
    [language]
  );

  if (loadingCities) {
    return (
      <div
        dir={dir}
        className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"
      >
        <div className="text-xl font-semibold text-gray-600">
          Loading locations...
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2]">
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="font-semibold text-lg capitalize">
          {language === "ar" ? "مراجعة الطلب" : "Review Order"}
        </h1>
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Toggle Language"
        >
          <span className="text-lg font-bold text-black">
            {language === "en" ? "عربي" : "English"}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full space-y-6">
          {/* Order Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {labels.items}
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                {orderItems.length} {language === "ar" ? "عنصر" : "items"}
              </span>
            </h2>

            {orderItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">
                  {language === "ar"
                    ? "سلة التسوق فارغة"
                    : "Your cart is empty"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {orderItems.map((item, index) => (
                  <div
                    key={item._id || item.id || index}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl flex items-center justify-center overflow-hidden">
                        <img
                          src={item.image || "./products/product1.jpg"}
                          alt="product image"
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {displayName(item.name)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {toNumber(item.quantity)}x{" "}
                          {formatCurrency(item.price)} KWD
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-lg text-green-600">
                      {formatCurrency(
                        toNumber(item.price) * toNumber(item.quantity)
                      )}{" "}
                      KWD
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🕒</span>
                    <span className="font-medium">{getScheduleDisplay()}</span>
                  </div>
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() =>
                      navigate("/time", { state: { from: "/reviewOrder" } })
                    }
                  >
                    {language === "ar" ? "تعديل" : "Edit"}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {getFullAddress()}
                    </div>
                    <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {orderType === "pickup"
                        ? language === "ar"
                          ? "استلام"
                          : "Pickup"
                        : language === "ar"
                          ? "توصيل"
                          : "Delivery"}
                    </span>
                  </div>
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() =>
                      navigate("/orderMode", {
                        state: { from: "/reviewOrder" },
                      })
                    }
                  >
                    {language === "ar" ? "تعديل" : "Edit"}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl md:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="font-semibold text-lg">
                      {order?.customerName ||
                        (language === "ar" ? "غير محدد" : "Not specified")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="text-xl">📞</span>
                    <span className="font-semibold">
                      {order?.customerPhone ||
                        (language === "ar" ? "غير محدد" : "Not specified")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-gray-700">
              {labels.specialInstructions}
            </label>
            <textarea
              rows={3}
              value={specialInstructions}
              onChange={(e) => {
                setSpecialInstructionsLocal(e.target.value);
                setSpecialInstructions(e.target.value);
              }}
              maxLength={350}
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-vertical"
              placeholder={
                language === "ar"
                  ? "أي ملاحظات خاصة (اختياري)"
                  : "Any special instructions (optional)"
              }
            />
          </div>

          {/* 🔥 FIXED PROMO CODE SECTION */}
          <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <FaTag className="text-2xl text-purple-600" />
              <h3 className="font-semibold text-lg text-gray-800">
                {language === "ar" ? "كود الخصم" : "Promo Code"}
              </h3>
            </div>

            {/* Show Active Promo OR Input */}
            {activePromoDiscount > 0 ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-lg">
                    {localPromoCode || orderPromoCode}
                  </span>
                  <div>
                    <div className="text-lg font-semibold text-green-800">
                      {activePromoDiscount}% خصم
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      -{formatCurrency(discountAmount)} KWD
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearPromo}
                  className="p-3 bg-white rounded-xl border-2 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all"
                >
                  <CiCircleRemove className="text-2xl" />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={localPromoCode}
                  onChange={(e) =>
                    setLocalPromoCode(e.target.value.toUpperCase())
                  }
                  placeholder={
                    language === "ar" ? "أدخل كود الخصم" : "Enter promo code"
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  onKeyPress={(e) => e.key === "Enter" && handleApplyPromo()}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!localPromoCode.trim() || loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? "..." : language === "ar" ? "تطبيق" : "Apply"}
                </button>
              </div>
            )}
          </div>

          {/* 🔥 FIXED ORDER TOTALS */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span>{labels.subtotal}</span>
              <span className="font-semibold">
                {formatCurrency(safeSubtotal)} KWD
              </span>
            </div>

            {discountAmount > 0.001 && (
              <div className="flex justify-between text-lg text-green-600">
                <span>{labels.discount}</span>
                <span className="font-bold">
                  -{formatCurrency(discountAmount)} KWD
                </span>
              </div>
            )}

            {safeShippingCost > 0 && (
              <div className="flex justify-between text-lg">
                <span>{labels.shipping}</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(safeShippingCost)} KWD
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-gray-900">
                  {labels.total}
                </span>
                <span className="text-3xl font-black text-green-600">
                  {formatCurrency(safeGrandTotal)} KWD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT SECTION */}
      <div className="bg-white border-t border-gray-200 p-6">
        {showPaymentOptions ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <FaCreditCard className="text-4xl text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">
                {language === "ar"
                  ? "اختر طريقة الدفع"
                  : "Choose Payment Method"}
              </h2>
              <p className="text-xl text-gray-700 font-semibold">
                {language === "ar"
                  ? `المبلغ الإجمالي: ${formatCurrency(safeGrandTotal)} د.ك`
                  : `Total Amount: ${formatCurrency(safeGrandTotal)} KWD`}
              </p>
            </div>

            <button
              onClick={() => handlePaymentMethodSelect("card")}
              disabled={loading || safeGrandTotal === 0 || !isValidOrder}
              className={`w-full p-6 rounded-3xl flex items-center gap-4 transition-all duration-300 shadow-xl ${loading || safeGrandTotal === 0 || !isValidOrder
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700 text-white active:scale-[0.98] shadow-blue-400/50 hover:shadow-blue-500/60"
                }`}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-3xl">💳</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-xl font-black">
                  {language === "ar" ? "بطاقة ائتمان/خصم" : "Credit/Debit Card"}
                </div>
                <div className="text-lg opacity-90 flex items-center gap-2">
                  <span>Visa</span>
                  <span>•</span>
                  <span>Mastercard</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl font-bold">→</span>
                )}
              </div>
            </button>

            <button
              onClick={() => handlePaymentMethodSelect("knet")}
              disabled={loading || safeGrandTotal === 0 || !isValidOrder}
              className={`w-full p-6 rounded-3xl flex items-center gap-4 transition-all duration-300 shadow-xl ${loading || safeGrandTotal === 0 || !isValidOrder
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-700 text-white active:scale-[0.98] shadow-emerald-400/50 hover:shadow-emerald-500/60"
                }`}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🏦</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-xl font-black">KNET</div>
                <div className="text-lg opacity-90">
                  {language === "ar"
                    ? "دفع آمن عبر KNET"
                    : "Secure KNET Payment"}
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl font-bold">→</span>
                )}
              </div>
            </button>

            <button
              onClick={() => setShowPaymentOptions(false)}
              disabled={loading}
              className="w-full py-4 text-lg font-semibold text-gray-600 hover:text-gray-900 transition-colors border-t"
            >
              {language === "ar"
                ? "← العودة لمراجعة الطلب"
                : "← Back to Order Review"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FaCreditCard className="text-3xl text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-blue-800">
                    {language === "ar"
                      ? "الدفع عبر MyFatoorah"
                      : "Pay with MyFatoorah"}
                  </h3>
                  <p className="text-blue-700 opacity-90">
                    {language === "ar"
                      ? "دفع آمن بالبطاقة الائتمانية"
                      : "Secure card payment"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentOptions(true)}
              disabled={!isValidOrder || loading || orderItems.length === 0}
              className={`w-full py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-4 ${isValidOrder && orderItems.length > 0 && !loading
                ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white active:scale-[0.98] shadow-purple-500/50 hover:shadow-purple-600/70"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              <FaCreditCard className="text-3xl" />
              <span>
                {language === "ar"
                  ? `ادفع الآن • ${formatCurrency(safeGrandTotal)} د.ك`
                  : `Pay Now • ${formatCurrency(safeGrandTotal)} KWD`}
              </span>
              {loading && (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewOrder;
