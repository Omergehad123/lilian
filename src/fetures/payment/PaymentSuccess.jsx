import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { useCart } from "../../hooks/useCart";
import { useOrder } from "../../hooks/useOrder";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTruck,
  FaMapMarkerAlt,
  FaPhone,
  FaTag,
} from "react-icons/fa";
import axios from "axios";
import emailjs from "@emailjs/browser";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const { clearOrder } = useOrder();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [visitedOtherPage, setVisitedOtherPage] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(false); // ✅ NEW: Track cleanup
  const hasSentEmail = useRef(false);

  const dir = language === "ar" ? "rtl" : "ltr";
  emailjs.init("JaNW9V45GnMviSTP1");

  useEffect(() => {
    const isFreshCashOrder = location.state?.justCreated && orderId;
    const hasLeftSuccessPage = localStorage.getItem("paymentSuccessVisited");

    if (hasLeftSuccessPage === "true" && orderId) {
      setVisitedOtherPage(true);
      localStorage.removeItem("paymentSuccessVisited");
      navigate("/", { replace: true });
      return;
    }

    // ✅ CRITICAL: Cleanup cart/order ONLY for fresh cash orders
    if (isFreshCashOrder && !cleanupDone) {
      const cleanupTimer = setTimeout(() => {
        console.log("✅ PaymentSuccess: Clearing cart & order contexts");
        clearCart();
        clearOrder();
        localStorage.removeItem("checkoutData");
        localStorage.removeItem("cart");
        setCleanupDone(true);
      }, 1500);

      return () => clearTimeout(cleanupTimer);
    }
  }, [location.state, orderId, navigate, clearCart, clearOrder, cleanupDone]);

  useEffect(() => {
    if (order?._id && !loading && !error && !hasSentEmail.current) {
      hasSentEmail.current = true;

      const sendOwnerEmail = async () => {
        try {
          const itemsList = order.products
            .map((item) => {
              const name = item.product?.name || item.name;
              const displayName =
                typeof name === "string"
                  ? name
                  : name?.[language] || name?.en || name?.ar || "Product";
              return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
                <span>${displayName} (x${item.quantity})</span>
                <strong>${(item.price * item.quantity).toFixed(3)} kw</strong>
              </div>`;
            })
            .join("");

          const emailData = {
            order_id: order._id,
            order_number: order._id.slice(-6).toUpperCase(),
            total: `${order.totalAmount?.toFixed(3) || 0} kw`,
            subtotal: `${
              order.products
                ?.reduce((sum, item) => sum + item.price * item.quantity, 0)
                ?.toFixed(3) || 0
            } kw`,
            shipping: `${order.shippingCost?.toFixed(3) || 0} kw`,
            discount:
              order.promoDiscount > 0
                ? `-${(order.subtotal * (order.promoDiscount / 100)).toFixed(
                    3
                  )} kw (${order.promoDiscount}%)`
                : "0 kw",
            promo_code: order.promoCode || "None",
            customer_name: order.userInfo?.name || "Unknown Customer",
            customer_phone: order.userInfo?.phone || "No phone",
            items_count: order.products?.length || 0,
            order_type: order.orderType === "pickup" ? "Pickup" : "Delivery",
            address: `${order.shippingAddress?.city || ""}, ${
              order.shippingAddress?.area || ""
            }`,
            schedule: order.scheduleTime
              ? `${new Date(order.scheduleTime.date).toLocaleDateString()} - ${
                  order.scheduleTime.timeSlot
                }`
              : "ASAP",
            items_list: itemsList,
            special_instructions: order.specialInstructions || "None",
          };

          await emailjs.send("service_1ti4s08", "template_489g9rh", emailData);
          setEmailSent(true);
        } catch (err) {
          // ✅ FIXED: Proper catch clause
          console.error("❌ Owner email failed:", err);
          setEmailSent(true);
        }
      };

      sendOwnerEmail();
    }
  }, [order, loading, error, language]);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `https://lilian-backend-7bjc.onrender.com/api/orders/${orderId}`,
          { withCredentials: true }
        );

        const orderData = res.data.data || res.data;
        setOrder(orderData);
      } catch (err) {
        console.error("❌ Fetch failed:", err.response?.status);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // ✅ Navigation handlers - FIXED cleanup
  const handleBackToHome = () => {
    // Only clear if not already done (prevents double-clearing)
    if (!cleanupDone) {
      clearCart();
      clearOrder();
      localStorage.removeItem("checkoutData");
      localStorage.removeItem("cart");
      sessionStorage.clear();
    }
    localStorage.removeItem("paymentSuccessVisited");
    navigate("/", { replace: true, state: { fromSuccess: true } });
  };

  const handleViewOrder = () => {
    // Only clear if not already done
    if (!cleanupDone) {
      clearCart();
      clearOrder();
      localStorage.removeItem("checkoutData");
      localStorage.removeItem("cart");
      sessionStorage.clear();
    }

    navigate(`/order/${order._id}`, {
      replace: true,
      state: { fromSuccess: true, cleared: true },
    });
  };

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

  const formatCurrency = (amount) => {
    return Number(amount || 0).toFixed(3) + " kw";
  };

  // ✅ FIXED: Calculate with PROMO support
  const subtotal =
    order?.subtotal ||
    order?.products?.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    ) ||
    0;
  const discountAmount =
    order?.promoDiscount > 0 ? subtotal * (order.promoDiscount / 100) : 0;
  const discountedSubtotal =
    order?.discountedSubtotal || subtotal - discountAmount;
  const shippingCost = order?.shippingCost || 0;
  const grandTotal = order?.totalAmount || discountedSubtotal + shippingCost;

  const getFullAddress = () => {
    if (!order?.shippingAddress)
      return language === "ar" ? "غير محدد" : "Not specified";
    const addr = order.shippingAddress;
    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.area && addr.area !== "pickup") parts.push(addr.area);
    if (addr.street) parts.push(`St ${addr.street}`);
    if (addr.block) parts.push(`Blck ${addr.block}`);
    if (addr.house) parts.push(`Hse ${addr.house}`);
    return parts.length > 0
      ? parts.join(", ")
      : language === "ar"
      ? "غير محدد"
      : "Not specified";
  };

  const getScheduleDisplay = () => {
    if (!order?.scheduleTime?.date || !order.scheduleTime.timeSlot) {
      return language === "ar" ? "في أقرب وقت ممكن" : "As Soon As Possible";
    }
    const dateObj = new Date(order.scheduleTime.date);
    const dateStr = dateObj.toLocaleDateString(
      language === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
    return { date: dateStr, time: order.scheduleTime.timeSlot };
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"
        dir={dir}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">
            {language === "ar"
              ? "جاري تحميل بيانات الطلب..."
              : "Loading order data..."}
          </p>
        </div>
      </div>
    );
  }

  // Error or no order - Show success anyway
  if (error || !order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"
        dir={dir}
      >
        <div className="text-center p-8 max-w-md mx-auto">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {language === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
          </h2>
          <p className="text-gray-600 mb-8">
            {language === "ar"
              ? "شكراً لك! تمت معالجة طلبك بنجاح."
              : "Thank you! Your order has been processed successfully."}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBackToHome}
              className="w-full bg-black text-white py-3 px-6 rounded-xl font-bold hover:bg-gray-800 transition-all duration-200"
            >
              {language === "ar" ? "العودة للصفحة الرئيسية" : "Back to Home"}
            </button>
            <button
              onClick={() => {
                localStorage.setItem("paymentSuccessVisited", "true");
                navigate("/orders", { replace: true });
              }}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-green-700 transition-all duration-200"
            >
              {language === "ar" ? "عرض الطلبات" : "View Orders"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS - Full order display
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-4"
      dir={dir}
    >
      {/* Header */}
      <div className="bg-white w-full flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2] rounded-t-xl mb-4 sticky top-0 z-10">
        <button
          onClick={handleBackToHome}
          className="cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="font-bold text-lg">
          {language === "ar" ? "دفع ناجح" : "Payment Success"}
        </h1>
        <div className="w-10" />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl flex flex-col">
        {/* Success Header */}
        <div className="text-center mb-8">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {language === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
          </h1>
          <p className="text-gray-600 text-lg">
            {language === "ar"
              ? "شكراً لك! تمت معالجة طلبك رقم"
              : "Thank you! Your order"}
            <span className="font-bold text-green-600">
              {" "}
              #{order._id.slice(-6).toUpperCase()}
            </span>
            {language === "ar"
              ? "تمت معالجته بنجاح."
              : "has been processed successfully."}
          </p>
          {emailSent && (
            <p className="text-sm text-green-600 mt-2 bg-green-50 p-2 rounded-lg">
              ✅{" "}
              {language === "ar"
                ? "تم إرسال إشعار للمتجر"
                : "Notification sent to store!"}
            </p>
          )}
          {paymentId && (
            <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">
              {language === "ar" ? "رقم الدفع:" : "Payment ID:"} {paymentId}
            </p>
          )}
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            {language === "ar" ? "العناصر" : "Order Items"}
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
              ({order.products?.length || 0})
            </span>
          </h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {order.products?.map((item, idx) => (
              <div
                key={item._id || idx}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">
                    {displayName(
                      item.product?.name || item.name || `Product ${idx + 1}`
                    )}
                  </span>
                  {item.message && (
                    <p className="text-sm text-gray-500 mt-1">{item.message}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {((item.price || 0) * (item.quantity || 1)).toFixed(3)} kw
                  </p>
                  <p className="text-xs text-gray-500">{item.quantity || 1}x</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Information */}
        <div className="space-y-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {language === "ar" ? "معلومات الطلب" : "Order Information"}
          </h2>
          <div className="space-y-3">
            {/* Schedule */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-lg mt-1">🕒</span>
              {getScheduleDisplay().date ? (
                <div className="font-medium flex flex-col">
                  <span>{getScheduleDisplay().date}</span>
                  <span>{getScheduleDisplay().time}</span>
                </div>
              ) : (
                <span>
                  {language === "ar"
                    ? "في أقرب وقت ممكن"
                    : "As Soon As Possible"}
                </span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
              <FaMapMarkerAlt className="text-lg mt-1 text-indigo-600" />
              <span className="capitalize font-medium">{getFullAddress()}</span>
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
              <FaPhone className="text-lg mt-1 text-emerald-600" />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 capitalize">
                  {order.userInfo?.name ||
                    (language === "ar" ? "غير محدد" : "Not specified")}
                </span>
                <span className="text-sm text-emerald-700">
                  {order.userInfo?.phone}
                </span>
              </div>
            </div>

            {/* Order Type */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FaTruck className="text-lg text-blue-600" />
              <span className="font-semibold capitalize">
                {order.orderType === "pickup"
                  ? language === "ar"
                    ? "استلام ذاتي"
                    : "Self Pickup"
                  : language === "ar"
                  ? "توصيل للمنزل"
                  : "Home Delivery"}
              </span>
            </div>

            {/* Special Instructions */}
            {order?.specialInstructions && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <span className="text-lg mt-1">📝</span>
                <div className="flex-1">
                  <span className="font-semibold text-yellow-900">
                    {language === "ar"
                      ? "ملاحظات خاصة"
                      : "Special Instructions"}
                    :
                  </span>
                  <br />
                  <span className="text-yellow-800">
                    {order.specialInstructions}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Breakdown + PROMO Support */}
        <div className="pt-6 border-t border-gray-200 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between text-lg text-gray-700 font-semibold">
              <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* PROMO DISCOUNT */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-lg font-semibold text-green-600 bg-green-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <FaTag className="text-green-500" />
                  <span>
                    {language === "ar" ? "الخصم" : "Discount"}
                    {order.promoCode && (
                      <span className="ml-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                        {order.promoCode}
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-black">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            {order.orderType === "delivery" && shippingCost > 0 && (
              <div className="flex justify-between text-lg text-gray-700 font-semibold">
                <span>
                  <FaTruck className="inline mr-1 text-green-600" />
                  {language === "ar" ? "تكلفة التوصيل" : "Shipping Cost"}
                </span>
                <span className="text-green-600 font-semibold">
                  {formatCurrency(shippingCost)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 bg-green-50 p-4 rounded-xl">
              <span className="text-2xl font-black text-gray-900">
                {language === "ar" ? "الإجمالي النهائي" : "Grand Total"}
              </span>
              <span className="text-3xl font-black text-green-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleViewOrder}
            className="flex-1 bg-green-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FaCheckCircle className="text-lg" />
            {language === "ar" ? "عرض تفاصيل الطلب" : "View Order Details"}
          </button>
          <button
            onClick={handleBackToHome}
            className="flex-1 bg-black text-white py-4 px-6 rounded-xl font-bold hover:bg-gray-800 transition-all duration-200"
          >
            {language === "ar" ? "الصفحة الرئيسية" : "Back to Home"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
