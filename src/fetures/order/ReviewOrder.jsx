import React, { useMemo, useState, useEffect } from "react";
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
  const { user } = useAuth();
  const {
    order,
    setShippingAddress,
    setCustomerName,
    setCustomerPhone,
    setPaymentMethod: setOrderPaymentMethod,
  } = useOrder();
  const { cart, clearCart } = useCart();

  const [loading, setLoading] = useState(false);

  // Promo state
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Special instructions state
  const [specialInstructions, setSpecialInstructions] = useState(
    order?.specialInstructions || ""
  );

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const savedPromoData = localStorage.getItem("checkoutData");
    if (savedPromoData) {
      try {
        const checkoutData = JSON.parse(savedPromoData);
        if (checkoutData.promoCode && checkoutData.promoDiscount) {
          setPromoCode(checkoutData.promoCode);
          setPromoValid(true);
          setPromoDiscount(checkoutData.promoDiscount);
        } else {
          setPromoCode("");
          setPromoValid(false);
          setPromoDiscount(0);
        }
      } catch (error) {
        setPromoCode("");
        setPromoValid(false);
        setPromoDiscount(0);
        console.error("Error loading promo data:", error);
      }
    } else {
      setPromoCode("");
      setPromoValid(false);
      setPromoDiscount(0);
    }
  }, [cart]);

  useEffect(() => {
    const savedPromoData = localStorage.getItem("checkoutData");
    if (savedPromoData) {
      try {
        const checkoutData = JSON.parse(savedPromoData);
        if (checkoutData.promoCode && checkoutData.promoDiscount) {
          setPromoCode(checkoutData.promoCode);
          setPromoValid(true);
          setPromoDiscount(checkoutData.promoDiscount);
        }
      } catch (error) {
        // no-op
      }
    }
  }, []);

  const orderItems = useMemo(() => (Array.isArray(cart) ? cart : []), [cart]);
  const cartSubtotal = useMemo(
    () =>
      orderItems.reduce(
        (total, item) =>
          total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      ),
    [orderItems]
  );

  const discountAmount = cartSubtotal * (promoDiscount / 100);
  const finalSubtotal = cartSubtotal - discountAmount;
  const orderType = order?.orderType || "pickup";
  const shippingCost = orderType === "delivery" ? 2.0 : 0;
  const grandTotal = finalSubtotal + shippingCost;

  // ✅ FIXED: Default to MyFatoorah only
  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");
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

  // Form values
  const street = order?.shippingAddress?.street || "";
  const block = order?.shippingAddress?.block || "";
  const house = order?.shippingAddress?.house || "";
  const name = order?.customerName || "";
  const phone = order?.customerPhone || "";
  const city = order?.shippingAddress?.city || "";
  const area = order?.shippingAddress?.area || "";
  const email = user?.email || "customer@lilian.com";

  // Promo validation
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoValid(false);
      setPromoDiscount(0);
      localStorage.removeItem("checkoutData");
      return;
    }
    try {
      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/promos/validate",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
        }
      );
      const data = await response.json();

      if (response.ok && data.success && data.promo) {
        setPromoValid(true);
        setPromoDiscount(data.promo.discountPercent);
        setPromoCode(promoCode.toUpperCase());

        localStorage.setItem(
          "checkoutData",
          JSON.stringify({
            promoCode: promoCode.toUpperCase(),
            promoDiscount: data.promo.discountPercent,
          })
        );
      } else {
        setPromoValid(false);
        setPromoDiscount(0);
        localStorage.removeItem("checkoutData");
      }
    } catch (error) {
      console.error("Promo error:", error);
      setPromoValid(false);
      setPromoDiscount(0);
      localStorage.removeItem("checkoutData");
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoValid(false);
    setPromoDiscount(0);
    localStorage.removeItem("checkoutData");
  };

  // Validation
  const isValidOrder = () => {
    const pickupValid = name && phone && city;
    const deliveryValid =
      street && block && house && name && phone && city && area;
    const hasAddress = orderType === "pickup" ? pickupValid : deliveryValid;
    return (
      hasAddress &&
      order?.scheduledSlot?.date &&
      orderItems.length > 0 &&
      (user?._id || user?.id)
    );
  };

  // Build order data
  const buildOrderData = () => ({
    user: user._id || user.id || null,
    products: orderItems.map((item) => ({
      product: item._id,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      message: item.message || "",
    })),
    totalAmount: grandTotal,
    orderType,
    promoCode: promoValid ? promoCode.toUpperCase() : null,
    promoDiscount: promoValid ? promoDiscount : 0,
    subtotal: cartSubtotal,
    discountedSubtotal: finalSubtotal,
    shippingCost,
    scheduleTime: {
      date: order.scheduledSlot?.date,
      timeSlot: order.scheduledSlot?.timeSlot,
    },
    shippingAddress: {
      city,
      area: orderType === "pickup" ? "pickup" : area,
      ...(orderType === "delivery" && {
        street,
        block: Number(block),
        house: Number(house),
      }),
    },
    userInfo: { name, phone },
    paymentMethod: "fatora", // ✅ Always MyFatoorah
    specialInstructions: specialInstructions?.trim() ?? "",
  });

  // ✅ MyFatoorah Payment ONLY
  const handleMyFatoorahPayment = async () => {
    if (!isValidOrder()) {
      alert(
        language === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields"
      );
      return;
    }

    setLoading(true);
    try {
      // ✅ Save order data to context (same as cash flow)
      setCustomerName(name);
      setCustomerPhone(phone);

      if (orderType === "delivery") {
        setShippingAddress({
          street,
          block: Number(block),
          house: Number(house),
        });
      }

      const paymentData = {
        amount: parseFloat(grandTotal),
        customerName: name,
        customerEmail: email,
        phone: phone,
        userId: user?._id?.toString(),
        orderData: buildOrderData(),
      };

      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/payment/myfatoorah",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(paymentData),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.isSuccess || !data.paymentUrl) {
        throw new Error(data.message || "Payment failed");
      }

      // ✅ Redirect to MyFatoorah (orderData preserved in UserDefinedField)
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error("Payment error:", err);
      alert(language === "ar" ? "فشل في الدفع" : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const getFullAddress = () => {
    const addr = order?.shippingAddress;
    if (!addr) return language === "ar" ? "غير محدد" : "Not specified";
    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.area && addr.area !== "pickup") parts.push(addr.area);
    if (addr.street) parts.push(`St ${addr.street}`);
    if (addr.block) parts.push(`Blck ${addr.block}`);
    if (addr.house) parts.push(`Hse ${addr.house}`);
    return (
      parts.filter(Boolean).join(", ") ||
      (language === "ar" ? "غير محدد" : "Not specified")
    );
  };

  const getScheduleDisplay = () => {
    const slot = order?.scheduledSlot;
    if (!slot?.date || !slot?.timeSlot) {
      return language === "ar" ? "في أقرب وقت ممكن" : "As Soon As Possible";
    }
    return slot.date.split("-").reverse().join("/") + ` | ${slot.timeSlot}`;
  };

  // Labels
  const labels = {
    items: language === "ar" ? "العناصر" : "Order Items",
    shipping: language === "ar" ? "تكلفة التوصيل" : "Shipping Cost",
    subtotal: language === "ar" ? "المجموع الفرعي" : "Subtotal",
    discount: language === "ar" ? "الخصم" : "Discount",
    total: language === "ar" ? "الإجمالي النهائي" : "Grand Total",
    specialInstructions:
      language === "ar"
        ? "ملاحظات أو تعليمات خاصة (اختياري)"
        : "Special Instructions (optional)",
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2]">
        <button
          onClick={handleBack}
          className="cursor-pointer p-2 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">
          {language === "ar" ? "قم بمراجعة الطلب" : "Review Order"}
        </h1>
        <button onClick={toggleLanguage} className="flex items-center pb-2">
          <span className="text-lg text-black font-bold">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm px-4 py-5 flex flex-col h-full">
          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              {labels.items}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ({orderItems.length})
              </span>
            </h2>
            {orderItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {language === "ar"
                  ? "لا توجد عناصر في الطلب"
                  : "No items in the order"}
              </p>
            ) : (
              orderItems.map((item, index) => (
                <div
                  key={item._id || item.id || `item-${index}`}
                  className="flex justify-between items-center text-sm text-gray-800 mb-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">
                    {Number(item.quantity) || 1}x {displayName(item.name)}
                  </span>
                  <span className="font-bold text-green-600">
                    {(
                      (Number(item.price) || 0) * (Number(item.quantity) || 1)
                    ).toFixed(3)}{" "}
                    kw
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Order Info */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between p-3 flex-wrap bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3 ">
                  <span className="text-xl">🕒</span>
                  <span className="font-medium text-gray-900">
                    {getScheduleDisplay()}
                  </span>
                </div>
                <button
                  type="button"
                  className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                  onClick={() =>
                    navigate("/time", {
                      state: { from: "/reviewOrder" },
                    })
                  }
                >
                  {language === "ar" ? "تعديل" : "Edit"}
                </button>
              </div>
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                <span className="text-xl mt-1">🏠</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-1">
                    {getFullAddress()}
                  </span>
                  <div className="flex items-center justify-between flex-wrap ">
                    <span className="text-xs bg-white px-2 py-1 rounded-full text-blue-600">
                      {orderType === "pickup"
                        ? language === "ar"
                          ? "استلام"
                          : "Pickup"
                        : language === "ar"
                        ? "توصيل"
                        : "Delivery"}
                    </span>
                    <button
                      type="button"
                      className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
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
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <span className="text-xl mt-1">👤</span>
                <div>
                  <span className="font-semibold text-gray-900">
                    {order?.customerName || "غير محدد"}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-600">📞</span>
                    <span className="text-sm">
                      {order?.customerPhone || "غير محدد"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-4">
            <label
              htmlFor="specialInstructions"
              className="block mb-1 text-sm font-semibold text-gray-700"
            >
              {labels.specialInstructions}
            </label>
            <textarea
              id="specialInstructions"
              rows={2}
              maxLength={350}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder={
                language === "ar"
                  ? "أي ملاحظات أو تعليمات إضافية للطلب (اختياري)"
                  : "Any notes or special requests for this order (optional)"
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all resize-none"
            />
          </div>

          {/* Promo Section */}
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FaTag className="text-purple-600 text-xl" />
                <h3 className="font-semibold text-gray-800">
                  {language === "ar" ? "كود الخصم" : "Promo Code"}
                </h3>
              </div>
            </div>

            {promoValid && promoCode ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {promoCode}
                  </span>
                  <span className="text-green-700 font-medium">
                    {promoDiscount}% خصم
                  </span>
                  <span className="text-sm text-green-600 font-bold">
                    -{discountAmount.toFixed(3)} kw
                  </span>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                  title={language === "ar" ? "إزالة" : "Remove"}
                  type="button"
                >
                  <CiCircleRemove className="text-xl" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={
                    language === "ar" ? "أدخل كود الخصم" : "Enter promo code"
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === "Enter" && handleApplyPromo()}
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all"
                  type="button"
                >
                  {language === "ar" ? "تطبيق" : "Apply"}
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>{labels.subtotal}</span>
                <span>{cartSubtotal.toFixed(3)} kw</span>
              </div>

              {promoValid && promoCode && (
                <div className="flex justify-between text-gray-700 font-medium text-green-600">
                  <span>{labels.discount}</span>
                  <span>-{discountAmount.toFixed(3)} kw</span>
                </div>
              )}

              {orderType === "delivery" && shippingCost > 0 && (
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>{labels.shipping}</span>
                  <span className="text-green-600 font-bold">
                    {shippingCost.toFixed(3)} kw
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-xl font-black text-gray-900">
                  {labels.total}
                </span>
                <span className="text-2xl font-black text-green-600">
                  {grandTotal.toFixed(3)} kw
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MyFatoorah ONLY - Full Width Button */}
      <div className="border-t border-gray-200 bg-white px-4 py-6">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-4">
          <div className="flex items-center gap-3 text-blue-700">
            <FaCreditCard className="text-2xl" />
            <div>
              <p className="font-semibold text-lg">
                {language === "ar"
                  ? "الدفع عبر MyFatoorah"
                  : "Pay with MyFatoorah"}
              </p>
              <p className="text-sm opacity-75">
                {language === "ar"
                  ? "الدفع الآمن بالبطاقة الائتمانية"
                  : "Secure card payment"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleMyFatoorahPayment}
          disabled={!isValidOrder() || loading || orderItems.length === 0}
          className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
            isValidOrder() && orderItems.length > 0 && !loading
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] shadow-blue-500/25"
              : "bg-gray-400 text-gray-500 cursor-not-allowed"
          }`}
          type="button"
        >
          {loading ? (
            <>
              <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>
                {language === "ar" ? "جاري المعالجة..." : "Processing..."}
              </span>
            </>
          ) : (
            <>
              <FaCreditCard className="text-2xl" />
              <span>
                {language === "ar"
                  ? `الدفع بـ MyFatoorah (${grandTotal.toFixed(3)} د.ك)`
                  : `Pay with MyFatoorah (${grandTotal.toFixed(3)} kw)`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ReviewOrder;
