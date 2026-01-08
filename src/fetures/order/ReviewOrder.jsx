import React, { useMemo, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaReceipt, FaCreditCard } from "react-icons/fa";
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
  } = useOrder();
  const { cart, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const dir = language === "ar" ? "rtl" : "ltr";

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
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

  const itemsLabel = language === "ar" ? "العناصر" : "Order Items";
  const pickupInfoLabel =
    language === "ar" ? "معلومات الاستلام" : "Pickup Information";
  const subtotalLabel = language === "ar" ? "المجموع" : "Subtotal";
  const totalLabel = language === "ar" ? "الإجمالي" : "Total";

  const orderType = order?.orderType || "pickup";

  // Get full address from order data
  const getFullAddress = () => {
    const addr = order?.shippingAddress;
    if (!addr) return language === "ar" ? "غير محدد" : "Not specified";

    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.area) parts.push(addr.area);
    if (addr.street) parts.push(`St ${addr.street}`);
    if (addr.block) parts.push(`Blck ${addr.block}`);
    if (addr.house) parts.push(`Hse ${addr.house}`);

    return parts.length > 0
      ? parts.join(", ")
      : language === "ar"
      ? "غير محدد"
      : "Not specified";
  };

  // Get customer info from order data
  const customerName =
    order?.customerName || (language === "ar" ? "غير محدد" : "Not specified");
  const customerPhone =
    order?.customerPhone || (language === "ar" ? "غير محدد" : "Not specified");
  const fullAddress = getFullAddress();

  // ✅ SAFE orderItems
  const orderItems = useMemo(() => {
    if (order && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    return Array.isArray(cart) ? cart : [];
  }, [order, cart]);

  // No discount applied
  const subtotal = orderItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );
  const totalAmount = subtotal;

  // ✅ SAFE schedule display helper
  const getScheduleDisplay = () => {
    if (
      !order?.scheduledSlot ||
      !order.scheduledSlot.date ||
      !order.scheduledSlot.startTime
    ) {
      return language === "ar" ? "في أقرب وقت ممكن" : "As Soon As Possible";
    }

    return {
      date: order.scheduledSlot.date.split("-").reverse().join("/"),
      time: `${order.scheduledSlot.startTime}-${order.scheduledSlot.endTime}`,
    };
  };

  // Get values from order context or use empty strings as fallback
  const street = order.shippingAddress?.street || "";
  const block = order.shippingAddress?.block || "";
  const house = order.shippingAddress?.house || "";
  const name = order.customerName || "";
  const phone = order.customerPhone || "";
  const city = order.shippingAddress?.city || "";
  const area = order.shippingAddress?.area || "";
  const email = user?.email || "customer@lilian.com"; // ✅ Default email لـ MyFatoorah

  // ✅ Validation helper
  const isValidOrder = () => {
    return (
      (orderType === "pickup"
        ? name && phone && city && area
        : street && block && house && name && phone) &&
      order?.scheduledSlot?.date &&
      order?.scheduledSlot?.startTime &&
      order?.scheduledSlot?.endTime &&
      cart.length > 0 &&
      user?._id
    );
  };

  // Helper to build shippingAddress and userInfo based on orderType
  const buildShippingAndUserInfo = () => {
    if (orderType === "pickup") {
      // For pickup, only need city, area, name, phone
      return {
        shippingAddress: {
          city,
          area,
        },
        userInfo: {
          name,
          phone,
        },
      };
    } else {
      // For delivery, send all address info
      return {
        shippingAddress: {
          city: city || "الكويت",
          area: area || "منطقة افتراضية",
          street,
          block: Number(block),
          house: Number(house),
        },
        userInfo: {
          name,
          phone,
        },
      };
    }
  };

  // ✅ CASH PAYMENT - محسن ومعدل حسب المطلوب
  const handleCashPayment = async () => {
    if (!isValidOrder()) {
      alert(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill all required fields"
      );
      return;
    }

    setLoading(true);
    try {
      // Ensure shipping & customer info is saved for delivery only
      if (orderType !== "pickup") {
        setShippingAddress({ street, block, house });
      }
      setCustomerName(name);
      setCustomerPhone(phone);

      const { shippingAddress, userInfo } = buildShippingAndUserInfo();

      const orderData = {
        user: user._id,
        products: cart.map((item) => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
          message: item.message || "",
        })),
        totalAmount: totalAmount,
        orderType: order.orderType,
        scheduleTime: {
          date: order.scheduledSlot.date,
          timeSlot: `${order.scheduledSlot.startTime} - ${order.scheduledSlot.endTime}`,
        },
        shippingAddress,
        userInfo,
        paymentMethod: "cash",
      };

      const res = await axios.post(
        "https://lilian-backend.onrender.com/api/orders",
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const orderId = res.data.data?._id || res.data._id;
      clearCart();
      clearOrder();
      navigate(`/payment-success?orderId=${orderId}`);
    } catch (err) {
      console.error("Cash order error:", err);
      alert(
        err.response?.data?.message ||
          (language === "ar" ? "فشل في إنشاء الطلب" : "Failed to create order")
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ MYFATOORAH PAYMENT - محدث ومُصحح (no discount applied)
  const handleFatoorahPayment = async () => {
    if (!isValidOrder()) {
      alert(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill all required fields"
      );
      return;
    }

    setLoading(true);
    try {
      console.log("🚀 MyFatoorah Payment Request:", {
        name,
        email,
        totalAmount,
        userId: user._id,
      });

      // ✅ البيانات المطلوبة فقط للـ Backend
      const paymentData = {
        amount: totalAmount.toFixed(3),
        customerName: name,
        customerEmail: email,
        userId: user._id.toString(),
      };

      const res = await axios.post(
        "https://lilian-backend.onrender.com/api/payment/myfatoorah",
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ MyFatoorah Response:", res.data);

      if (res.data.isSuccess && res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        alert(
          language === "ar" ? "فشل في بدء الدفع" : "Failed to initiate payment"
        );
      }
    } catch (err) {
      console.error("❌ Fatoorah payment error:", err.response?.data || err);
      alert(
        err.response?.data?.message ||
          (language === "ar"
            ? "فشل في معالجة الدفع"
            : "Payment processing failed")
      );
    } finally {
      setLoading(false);
    }
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
        <button
          className="flex items-center justify-center cursor-pointer pb-2"
          type="button"
          onClick={toggleLanguage}
        >
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
                    {item.quantity || 1}x {displayName(item.name)}
                  </span>
                  <span className="font-bold text-green-600">
                    {((item.price || 0) * (item.quantity || 1)).toFixed(3)} KWD
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Order Information */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              {pickupInfoLabel}
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              {/* Schedule */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <span className="text-xl">🕒</span>
                <div>
                  <span className="font-medium text-gray-900 block">
                    {getScheduleDisplay().date ||
                      (language === "ar" ? "في أقرب وقت" : "ASAP")}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getScheduleDisplay().time || ""}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                <span className="text-xl mt-1">🏠</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-1">
                    {fullAddress}
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

              {/* Customer Info */}
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <span className="text-xl mt-1">👤</span>
                <div>
                  <span className="font-semibold text-gray-900">
                    {customerName}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-600 font-mono text-sm">
                      📞
                    </span>
                    <span className="text-sm">{customerPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>{subtotalLabel}</span>
                <span>{subtotal.toFixed(3)} KWD</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-xl font-black text-gray-900">
                  {totalLabel}
                </span>
                <span className="text-2xl font-black text-green-600">
                  {totalAmount.toFixed(3)} KWD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Payment Options - محدث ومحسن */}
      <div className="border-t border-gray-200 bg-white px-4 py-6 space-y-4">
        {/* Payment Method Selection */}
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

        {/* Confirm Payment Button */}
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
                      ? "تأكيد الطلب نقداً"
                      : "Confirm Cash Order"}
                  </span>
                </>
              ) : (
                <>
                  <FaCreditCard className="text-2xl" />
                  <span>
                    {language === "ar"
                      ? "الدفع بـ MyFatoorah"
                      : "Pay with MyFatoorah"}
                  </span>
                </>
              )}
            </>
          )}
        </button>

        {/* Total Preview */}
        <div className="text-center py-2">
          <span className="text-xs text-gray-500">
            {language === "ar"
              ? `الإجمالي: ${totalAmount.toFixed(3)} د.ك`
              : `Total: ${totalAmount.toFixed(3)} KWD`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ReviewOrder;
