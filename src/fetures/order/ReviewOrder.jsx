import React, { useMemo, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCreditCard } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useOrder } from "../../hooks/useOrder";
import { useCart } from "../../hooks/useCart";
import axios from "axios";

function ReviewOrder() {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const { user, token } = useAuth();
  const {
    order,
    setShippingAddress,
    setCustomerName,
    setCustomerPhone,
    clearOrder,
    getShippingCost,
  } = useOrder();
  const { cart, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const dir = language === "ar" ? "rtl" : "ltr";

  // ✅ FIXED: Perfect cart totals
  const orderItems = useMemo(() => (Array.isArray(cart) ? cart : []), [cart]);

  const subtotal = useMemo(() => {
    return orderItems.reduce((total, item) => {
      return total + (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }, 0);
  }, [orderItems]);

  // 🔥 PERFECT SHIPPING - Gets EXACT 20.000 KWD from your function
  const shippingCost = useMemo(() => {
    if (order?.orderType === "pickup") return 0;

    // ✅ TRUST your getShippingCost() function 100% - NO FALLBACKS
    return Number(getShippingCost || 0);
  }, [getShippingCost, order?.orderType]);

  const grandTotal = subtotal + shippingCost;

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

  const orderType = order?.orderType || "pickup";
  const customerName =
    order?.customerName || (language === "ar" ? "غير محدد" : "Not specified");
  const customerPhone =
    order?.customerPhone || (language === "ar" ? "غير محدد" : "Not specified");

  const getFullAddress = () => {
    const addr = order?.shippingAddress;
    if (!addr) return language === "ar" ? "غير محدد" : "Not specified";

    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.area) parts.push(addr.area);
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

  // Form values
  const street = order?.shippingAddress?.street || "";
  const block = order?.shippingAddress?.block || "";
  const house = order?.shippingAddress?.house || "";
  const name = order?.customerName || "";
  const phone = order?.customerPhone || "";
  const city = order?.shippingAddress?.city || "";
  const area = order?.shippingAddress?.area || "";
  const areaId = order?.shippingAddress?.areaId || "";
  const email = user?.email || "customer@lilian.com";

  const isValidOrder = () => {
    const hasAddress =
      orderType === "pickup"
        ? name && phone && city && areaId
        : street && block && house && name && phone && city && areaId;
    return (
      hasAddress &&
      order?.scheduledSlot?.date &&
      orderItems.length > 0 &&
      (user?._id || user?.id)
    );
  };

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
    scheduleTime: {
      date: order.scheduledSlot?.date,
      timeSlot: order.scheduledSlot?.timeSlot,
    },
    shippingAddress: {
      city,
      area,
      areaId,
      ...(orderType !== "pickup" && {
        street,
        block: Number(block),
        house: Number(house),
      }),
    },
    userInfo: { name, phone },
    paymentMethod: "cash",
    shippingCost,
  });
  
  const handleCashPayment = async () => {
    if (!isValidOrder()) {
      alert(
        language === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields"
      );
      return;
    }

    setLoading(true);
    try {
      // Update order state
      if (orderType !== "pickup") {
        setShippingAddress({
          street,
          block: Number(block),
          house: Number(house),
        });
      }
      setCustomerName(name);
      setCustomerPhone(phone);

      const orderData = buildOrderData();

      // ✅ FIXED: Use fetch with credentials (matches your AuthContext)
      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // ✅ Cookies sent automatically - no token needed!
          },
          credentials: "include", // 🔥 This sends auth cookies
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order failed");
      }

      const orderId = data.data?._id || data._id;
      clearCart();
      clearOrder();
      navigate(`/payment-success?orderId=${orderId}`);
    } catch (err) {
      console.error("❌ Order error:", err);
      alert(language === "ar" ? "فشل في الطلب" : "Order failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFatoorahPayment = async () => {
    if (!isValidOrder()) {
      alert(
        language === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields"
      );
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        amount: grandTotal.toFixed(3),
        customerName: name,
        customerEmail: email,
        userId: user?._id?.toString() || null,
        orderData: buildOrderData(),
      };

      // ✅ FIXED: Use fetch with credentials
      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/payment/myfatoorah",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // 🔥 Cookies for auth
          body: JSON.stringify(paymentData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.isSuccess || !data.paymentUrl) {
        throw new Error(data.message || "Payment failed");
      }

      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error("❌ Payment error:", err);
      alert(language === "ar" ? "فشل في الدفع" : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // Labels
  const itemsLabel = language === "ar" ? "العناصر" : "Order Items";
  const shippingLabel = language === "ar" ? "تكلفة التوصيل" : "Shipping Cost";
  const subtotalLabel = language === "ar" ? "المجموع الفرعي" : "Subtotal";
  const totalLabel = language === "ar" ? "الإجمالي النهائي" : "Grand Total";

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

      {/* Content Card */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm px-4 py-5 flex flex-col h-full">
          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              {itemsLabel}
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
                    KWD
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Order Information */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <span className="text-xl">🕒</span>
                <span className="font-medium text-gray-900">
                  {getScheduleDisplay()}
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                <span className="text-xl mt-1">🏠</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-1">
                    {getFullAddress()}
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-blue-600">
                    {orderType === "pickup"
                      ? language === "ar"
                        ? "استلام"
                        : "Pickup"
                      : language === "ar"
                      ? "توصيل"
                      : "Delivery"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <span className="text-xl mt-1">👤</span>
                <div>
                  <span className="font-semibold text-gray-900">
                    {customerName}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-600">📞</span>
                    <span className="text-sm">{customerPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ PERFECT TOTALS - Shows 20.000 KWD Shipping! */}
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>{subtotalLabel}</span>
                <span>{subtotal.toFixed(3)} KWD</span>
              </div>

              {orderType === "delivery" && shippingCost > 0 && (
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>{shippingLabel}</span>
                  <span className="text-green-600 font-bold">
                    {shippingCost.toFixed(3)} KWD
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-xl font-black text-gray-900">
                  {totalLabel}
                </span>
                <span className="text-2xl font-black text-green-600">
                  {grandTotal.toFixed(3)} KWD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="border-t border-gray-200 bg-white px-4 py-6 space-y-4">
        <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
          <button
            onClick={() => setPaymentMethod("cash")}
            disabled={loading}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base shadow-md transition-all duration-300 flex-1 ${
              paymentMethod === "cash"
                ? "bg-green-600 text-white shadow-green-400/50"
                : "bg-white border-2 border-green-200 hover:bg-green-50 hover:border-green-400 hover:shadow-lg"
            }`}
          >
            <span className="text-2xl">💵</span>
            <span>
              {language === "ar" ? "الدفع نقداً" : "Cash on Delivery"}
            </span>
          </button>

          <button
            onClick={() => setPaymentMethod("fatora")}
            disabled={loading}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-base shadow-md transition-all duration-300 flex-1 ${
              paymentMethod === "fatora"
                ? "bg-blue-600 text-white shadow-blue-400/50"
                : "bg-white border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-lg"
            }`}
          >
            <FaCreditCard className="text-xl" />
            <span>
              {language === "ar" ? "MyFatoorah (بطاقة)" : "MyFatoorah (Card)"}
            </span>
          </button>
        </div>

        <button
          onClick={
            paymentMethod === "cash" ? handleCashPayment : handleFatoorahPayment
          }
          disabled={!isValidOrder() || loading || orderItems.length === 0}
          className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
            isValidOrder() && orderItems.length > 0 && !loading
              ? paymentMethod === "cash"
                ? "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-green-500/25"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] shadow-blue-500/25"
              : "bg-gray-400 text-gray-500 cursor-not-allowed"
          }`}
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
              {paymentMethod === "cash" ? (
                <>
                  <span className="text-2xl">💰</span>
                  <span>
                    {language === "ar"
                      ? `تأكيد الطلب نقداً (${grandTotal.toFixed(3)} د.ك)`
                      : `Confirm Cash Order (${grandTotal.toFixed(3)} KWD)`}
                  </span>
                </>
              ) : (
                <>
                  <FaCreditCard className="text-2xl" />
                  <span>
                    {language === "ar"
                      ? `الدفع بـ MyFatoorah (${grandTotal.toFixed(3)} د.ك)`
                      : `Pay with MyFatoorah (${grandTotal.toFixed(3)} KWD)`}
                  </span>
                </>
              )}
            </>
          )}
        </button>

        <div className="text-center py-2">
          <span className="text-sm font-bold text-gray-800">
            {language === "ar"
              ? `الإجمالي النهائي: ${grandTotal.toFixed(3)} د.ك`
              : `Grand Total: ${grandTotal.toFixed(3)} KWD`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ReviewOrder;
