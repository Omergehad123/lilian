// ✅ OrderDetails.jsx - FIXED NaN + Safe Number Handling (Style Preserved)
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaExclamationTriangle,
  FaTruck,
  FaMoneyBillWave,
} from "react-icons/fa";
import axios from "axios";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dir = language === "ar" ? "rtl" : "ltr";

  // 🔥 FIXED: Safe number helper
  const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // ✅ Helper functions (enhanced for shipping)
  const displayName = (nameData) => {
    if (!nameData)
      return language === "ar" ? "منتج غير محدد" : "Product not specified";
    if (typeof nameData === "string") return nameData;
    if (nameData?.name) return displayName(nameData.name);
    return (
      nameData[language] ||
      nameData.ar ||
      nameData.en ||
      nameData.title ||
      (language === "ar" ? "منتج" : "Product")
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return language === "ar" ? "غير محدد" : "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return language === "ar" ? "غير محدد" : "Not specified";
    if (language === "ar") {
      if (timeSlot === "08:00 AM - 01:00 PM") return "8ص - 1م";
      if (timeSlot === "01:00 PM - 06:00 PM") return "1م - 6م";
      if (timeSlot === "06:00 PM - 11:00 PM") return "6م - 11م";
    }
    return timeSlot;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="text-xs text-yellow-600" />;
      case "confirmed":
        return <FaCheckCircle className="text-xs text-blue-600" />;
      case "delivered":
        return <FaCheckCircle className="text-xs text-green-600" />;
      default:
        return <FaCheckCircle className="text-xs text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      ar: {
        pending: "معلق",
        confirmed: "مؤكد",
        delivered: "مُسلم",
        paid: "مدفوع",
      },
      en: {
        pending: "Pending",
        confirmed: "Confirmed",
        delivered: "Delivered",
        paid: "Paid",
      },
    };
    return statusMap[language]?.[status] || status;
  };

  // 🔥 FIXED: Safe currency formatter
  const formatCurrency = (amount) => {
    return toNumber(amount).toFixed(3) + " KWD";
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError(
          language === "ar" ? "Order ID is missing" : "Order ID is missing"
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `https://lilian-backend.onrender.com/api/orders/${orderId}`,
          { withCredentials: true }
        );

        const orderData = response.data.data || response.data;
        console.log("🔍 FULL ORDER DATA:", orderData);
        console.log("🔍 specialInstructions:", orderData.specialInstructions);

        setOrderDetails(orderData);
      } catch (err) {
        console.error("❌ Order fetch error:", err);
        setError(
          language === "ar" ? "فشل تحميل الطلب" : "Failed to load order"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, language]);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"
        dir={dir}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">
            {language === "ar"
              ? "جاري تحميل تفاصيل الطلب..."
              : "Loading order details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"
        dir={dir}
      >
        <div className="text-center p-8 max-w-md">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {language === "ar" ? "خطأ في تحميل الطلب" : "Failed to load order"}
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
          >
            {language === "ar" ? "العودة" : "Go Back"}
          </button>
        </div>
      </div>
    );
  }

  // 🔥 FIXED: Safe totals calculation
  const safeSubtotal =
    orderDetails.products?.reduce(
      (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity || 1),
      0
    ) || 0;

  const safeShippingCost = toNumber(orderDetails.shippingCost);
  const safeGrandTotal =
    toNumber(orderDetails.totalAmount) || safeSubtotal + safeShippingCost;

  const getFullAddress = () => {
    const addr = orderDetails.shippingAddress;
    if (!addr) return language === "ar" ? "غير محدد" : "Not specified";
    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.area) parts.push(addr.area);
    if (addr.street) parts.push(`St ${addr.street}`);
    if (addr.block) parts.push(`Blck ${addr.block}`);
    if (addr.house) parts.push(`Hse ${addr.house}`);
    return (
      parts.join(", ") || (language === "ar" ? "غير محدد" : "Not specified")
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" dir={dir}>
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300 sticky top-0 z-50 shadow-sm">
        <button
          onClick={handleBack}
          className="cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-bold text-lg text-gray-900">
          {language === "ar" ? "تفاصيل الطلب" : "Order Details"}
        </p>
        <div className="w-8 h-8" />
      </div>

      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-6 flex flex-col h-full">
          {/* Order Header */}
          <div className="mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <span className="font-black text-2xl text-gray-900 tracking-tight">
                #{orderDetails._id?.slice(-6).toUpperCase() || "N/A"}
              </span>
              <div
                className={`px-4 py-2 rounded-full text-sm font-bold border-2 flex items-center gap-2 ${getStatusColor(
                  orderDetails.status || "paid"
                )}`}
              >
                {getStatusIcon(orderDetails.status || "paid")}
                <span>{getStatusText(orderDetails.status || "paid")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
              <FaClock className="text-gray-500 shrink-0" />
              <span className="font-medium">
                {formatDate(orderDetails.scheduleTime?.date)} |{" "}
                {formatTimeSlot(orderDetails.scheduleTime?.timeSlot)}
              </span>
            </div>
          </div>

          {/* ✅ Order Information - Shipping + Customer */}
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h2>

            {/* Address */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500">
              <FaMapMarkerAlt className="text-xl mt-1 text-indigo-600 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-gray-900 block mb-1">
                  {getFullAddress()}
                </span>
                <span className="text-xs bg-white px-3 py-1 rounded-full text-indigo-700 font-medium">
                  {orderDetails.orderType === "pickup"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-500">
                <FaPhone className="text-xl mt-1 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 block mb-1">
                    {orderDetails.userInfo?.name ||
                      (language === "ar" ? "غير محدد" : "Not specified")}
                  </span>
                  <span className="text-sm text-emerald-700">
                    {orderDetails.userInfo?.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                <FaMoneyBillWave className="text-xl text-blue-600 shrink-0" />
                <span className="font-semibold text-gray-900">
                  {language === "ar" ? "طريقة الدفع:" : "Payment Method:"}
                  <span className="capitalize ml-1">
                    {orderDetails.paymentMethod || "cash"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {orderDetails.specialInstructions && (
            <div className="mb-8">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                <FaExclamationTriangle className="text-xl mt-1 text-yellow-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-gray-900 block mb-1">
                    {language === "ar"
                      ? "ملاحظات خاصة"
                      : "Special Instructions"}
                  </span>
                  <span className="text-sm text-yellow-800 break-words whitespace-pre-line">
                    {orderDetails.specialInstructions}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              {language === "ar" ? "العناصر" : "Order Items"}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                ({orderDetails.products?.length || 0})
              </span>
            </h2>
            <div className="space-y-3">
              {orderDetails.products?.map((item, index) => {
                const productImage =
                  item.product?.images?.[0] ||
                  item.product?.image ||
                  "/api/placeholder/80/80";
                const productName = displayName(
                  item.product?.name || item.name || `Product ${index + 1}`
                );
                return (
                  <div
                    key={item._id || index}
                    className="flex justify-between items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 mr-4">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/api/placeholder/80/80";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-gray-900 text-base flex-1 min-w-0 pr-2 line-clamp-2">
                          {productName}
                        </span>
                        {/* 🔥 FIXED: Safe product total */}
                        <span className="font-bold text-lg text-green-600 shrink-0">
                          {formatCurrency(
                            toNumber(item.price) * toNumber(item.quantity || 1)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="bg-white px-3 py-1 rounded-full text-xs font-medium border">
                          {toNumber(item.quantity || 1)}x
                        </span>
                        {/* 🔥 FIXED: Safe unit price */}
                        <span className="text-gray-900">
                          {formatCurrency(toNumber(item.price))} /{" "}
                          {language === "ar" ? "قطعة" : "unit"}
                        </span>
                      </div>
                      {item.message && (
                        <p className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                          {item.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔥 FIXED Revenue Breakdown - SAFE NUMBERS (Style Preserved) */}
          <div className="border-t border-gray-100 pt-8">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-lg text-gray-700 font-semibold">
                  <span>
                    {language === "ar" ? "المجموع الفرعي" : "Subtotal"}
                  </span>
                  <span>{formatCurrency(safeSubtotal)}</span>
                </div>

                {orderDetails.orderType === "delivery" &&
                  safeShippingCost > 0 && (
                    <div className="flex justify-between text-lg text-gray-700 font-semibold">
                      <span>
                        <FaTruck className="inline mr-1 text-green-600" />
                        {language === "ar" ? "تكلفة التوصيل" : "Shipping Cost"}
                      </span>
                      <span className="text-green-600">
                        {formatCurrency(safeShippingCost)}
                      </span>
                    </div>
                  )}

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="text-2xl font-black text-gray-900">
                    {language === "ar" ? "الإجمالي النهائي" : "Grand Total"}
                  </span>
                  <span className="text-3xl font-black text-green-600">
                    {formatCurrency(safeGrandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
