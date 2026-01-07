import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import axios from "axios";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const { language } = useLanguage();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dir = language === "ar" ? "rtl" : "ltr";

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

  // Fetch order data by orderId
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/orders/${orderId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrder(res.data.data || res.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleViewOrder = () => {
    if (order?._id) {
      navigate(`/order/${order._id}`);
    } else {
      navigate("/orders");
    }
  };

  // Helper function to get full address
  const getFullAddress = () => {
    if (!order?.shippingAddress) {
      return language === "ar" ? "غير محدد" : "Not specified";
    }
    const addr = order.shippingAddress;
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

  // Get schedule display
  const getScheduleDisplay = () => {
    if (
      !order?.scheduleTime ||
      !order.scheduleTime.date ||
      !order.scheduleTime.timeSlot
    ) {
      return language === "ar" ? "في أقرب وقت ممكن" : "As Soon As Possible";
    }
    const dateObj = new Date(order.scheduleTime.date);
    const dateStr = dateObj.toLocaleDateString(
      language === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
    return {
      date: dateStr,
      time: order.scheduleTime.timeSlot,
    };
  };

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
            {error ||
              (language === "ar"
                ? "شكراً لك! تمت معالجة طلبك بنجاح."
                : "Thank you! Your order has been processed successfully.")}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBackToHome}
              className="w-full bg-black text-white py-3 px-6 rounded-xl font-bold hover:bg-gray-800 transition-all duration-200"
            >
              {language === "ar" ? "العودة للصفحة الرئيسية" : "Back to Home"}
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-green-700 transition-all duration-200"
            >
              {language === "ar" ? "عرض الطلبات" : "View Orders"}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              #{order._id?.slice(-6).toUpperCase()}{" "}
            </span>
            {language === "ar"
              ? "تمت معالجته بنجاح."
              : "has been processed successfully."}
          </p>
          {paymentId && (
            <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">
              {language === "ar" ? "رقم الدفع:" : "Payment ID:"} {paymentId}
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Items */}
          <div>
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
                      <p className="text-sm text-gray-500 mt-1">
                        {item.message}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {((item.price || 0) * (item.quantity || 1)).toFixed(3)}{" "}
                      KWD
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity || 1}x
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Information */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h2>
            <div className="space-y-3">
              {/* Schedule */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">🕒</span>
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

              {/* Full Address */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">🏠</span>
                <div className="flex flex-col">
                  <span className="capitalize">{getFullAddress()}</span>
                </div>
              </div>

              {/* Customer Name */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">👤</span>
                <div className="flex flex-col">
                  <span className="capitalize">
                    {order.userInfo?.name ||
                      (language === "ar" ? "غير محدد" : "Not specified")}
                  </span>
                </div>
              </div>

              {/* Customer Phone */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📞</span>
                <div className="flex flex-col">
                  <span>
                    {order.userInfo?.phone ||
                      (language === "ar" ? "غير محدد" : "Not specified")}
                  </span>
                </div>
              </div>

              {/* Order Type */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">🚚</span>
                <span className="capitalize">
                  {order.orderType === "pickup"
                    ? language === "ar"
                      ? "استلام"
                      : "Pickup"
                    : language === "ar"
                    ? "توصيل"
                    : "Delivery"}
                </span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-2xl font-black">
              <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-green-600">
                {order.totalAmount?.toFixed(3)} KWD
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
