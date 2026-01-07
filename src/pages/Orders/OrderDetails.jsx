import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaExclamationTriangle,
} from "react-icons/fa";
import axios from "axios";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const { token } = useAuth();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dir = language === "ar" ? "rtl" : "ltr";

  // ✅ نفس displayName function من OrderDetails
  const displayName = (nameData) => {
    if (!nameData) {
      return language === "ar" ? "منتج غير محدد" : "Product not specified";
    }
    if (typeof nameData === "string") {
      return nameData;
    }
    if (nameData?.name) {
      return displayName(nameData.name);
    }
    if (typeof nameData === "object") {
      return (
        nameData[language] ||
        nameData.ar ||
        nameData.en ||
        nameData.title ||
        nameData.productName ||
        Object.values(nameData)[0] ||
        (language === "ar" ? "منتج" : "Product")
      );
    }
    return language === "ar" ? "منتج" : "Product";
  };

  // ✅ نفس OrderDetails functions
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
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <FaCheckCircle className="text-xs text-emerald-600" />;
      case "confirmed":
        return <FaCheckCircle className="text-xs text-blue-600" />;
      default:
        return <FaCheckCircle className="text-xs text-green-600" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      ar: {
        paid: "مدفوع",
        confirmed: "مؤكد",
      },
      en: {
        paid: "Paid",
        confirmed: "Confirmed",
      },
    };
    return statusMap[language]?.[status] || status;
  };

  // Fetch order details by orderId
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !token) {
        setLoading(false);
        if (!orderId) {
          setError("Order ID is missing");
        } else if (!token) {
          setError("Authentication required");
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const API_BASE_URL = "http://localhost:5000";
        const res = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const orderData = res.data.data || res.data;
        console.log("📦 Order Details Data:", orderData);
        console.log("📍 Shipping Address:", orderData?.shippingAddress);
        setOrderDetails(orderData);
      } catch (err) {
        console.error("❌ Error fetching order details:", err);
        setError(
          err.response?.data?.message ||
            (language === "ar" ? "فشل في تحميل الطلب" : "Failed to load order")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token, language]);

  const handleBack = () => navigate(-1);
  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");

  // ✅ نفس Loading state من OrderDetails
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

  // ✅ نفس Error state من OrderDetails
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
          <p className="text-gray-500 mb-6">
            {error ||
              (language === "ar" ? "الطلب غير موجود" : "Order not found")}
          </p>
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" dir={dir}>
      {/* Header - نفس OrderDetails */}
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
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 cursor-pointer"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg font-bold text-gray-800">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      {/* Content card - نفس OrderDetails */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-6 flex flex-col h-full">
          {/* Order Header - نفس OrderDetails */}
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

          {/* Order Items - نفس OrderDetails */}
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
                  item.images?.[0] ||
                  item.image ||
                  "/api/placeholder/80/80";
                const productName = displayName(
                  item.product?.name ||
                    item.product?.title ||
                    item.name ||
                    item.productName ||
                    `Product ${index + 1}`
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
                        <span className="font-bold text-lg text-green-600 shrink-0">
                          {(item.price * (item.quantity || 1)).toFixed(3)} KWD
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="bg-white px-3 py-1 rounded-full text-xs font-medium border">
                          {item.quantity || 1}x
                        </span>
                        <span className="text-gray-900">
                          {item.price?.toFixed(3)} KWD /{" "}
                          {language === "ar" ? "قطعة" : "unit"}
                        </span>
                      </div>
                      {item.message && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                          <span className="text-sm text-yellow-800 font-medium">
                            📝 {item.message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Information - نفس OrderDetails */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border">
                <div className="flex flex-col gap-3">
                  <div className="text-2xl font-semibold">
                    {orderDetails.orderType === "delivery"
                      ? language === "ar"
                        ? "معلومات التوصيل"
                        : "Delivery Info"
                      : language === "ar"
                      ? "معلومات الاستلام"
                      : "Pickup Info"}
                  </div>
                  <div className="flex flex-col">
                    {(() => {
                      const addr = orderDetails.shippingAddress;
                      if (!addr) {
                        return (
                          <p className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                            {language === "ar" ? "العنوان:" : "Address:"}
                            <span className="text-gray-500 text-sm">
                              {language === "ar" ? "غير محدد" : "Not specified"}
                            </span>
                          </p>
                        );
                      }

                      const parts = [];
                      // Filter out "Default City" and "Default Area"
                      if (
                        addr.city &&
                        addr.city.trim().toLowerCase() !== "default city"
                      ) {
                        parts.push(addr.city);
                      }
                      if (
                        addr.area &&
                        addr.area.trim().toLowerCase() !== "default area"
                      ) {
                        parts.push(addr.area);
                      }
                      // Add street, block, house with translated labels
                      if (addr.street) {
                        parts.push(
                          language === "ar"
                            ? `شارع ${addr.street}`
                            : `St ${addr.street}`
                        );
                      }
                      if (addr.block) {
                        parts.push(
                          language === "ar"
                            ? `بلوك ${addr.block}`
                            : `Blck ${addr.block}`
                        );
                      }
                      if (addr.house) {
                        parts.push(
                          language === "ar"
                            ? `منزل ${addr.house}`
                            : `Hse ${addr.house}`
                        );
                      }

                      const displayAddress =
                        parts.length > 0
                          ? parts.join(", ")
                          : language === "ar"
                          ? "غير محدد"
                          : "Not specified";

                      return (
                        <p className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                          {language === "ar" ? "العنوان:" : "Address:"}
                          <span className="text-gray-500 text-sm capitalize">
                            {displayAddress}
                          </span>
                        </p>
                      );
                    })()}
                    {orderDetails.shippingAddress?.street && (
                      <p className="font-bold text-blue-600 flex items-center gap-3 text-lg">
                        {language === "ar" ? "الشارع:" : "Street:"}
                        <span className="text-gray-500 text-sm">
                          {orderDetails.shippingAddress.street}
                        </span>
                      </p>
                    )}
                    {orderDetails.shippingAddress?.block && (
                      <p className="font-bold text-blue-600 flex items-center gap-3 text-lg">
                        {language === "ar" ? "البلوك:" : "Block:"}
                        <span className="text-gray-500 text-sm">
                          {orderDetails.shippingAddress.block}
                        </span>
                      </p>
                    )}
                    {orderDetails.shippingAddress?.house && (
                      <p className="font-bold text-blue-600 flex items-center gap-3 text-lg">
                        {language === "ar" ? "المنزل:" : "House:"}
                        <span className="text-gray-500 text-sm">
                          {orderDetails.shippingAddress.house}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border">
                <div className="flex flex-col gap-3">
                  <div className="text-2xl font-semibold">
                    {language === "ar" ? "معلومات العميل" : "User Info"}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                      {language === "ar" ? "الاسم:" : "Name:"}
                      <span className="text-gray-500 text-sm">
                        {orderDetails.userInfo?.name ||
                          (language === "ar" ? "غير محدد" : "Not specified")}
                      </span>
                    </p>
                    <p className="font-bold text-emerald-600 flex items-center gap-3 text-lg">
                      {language === "ar" ? "الهاتف:" : "Phone:"}
                      <span className="text-gray-500 text-sm">
                        {orderDetails.userInfo?.phone ||
                          (language === "ar" ? "غير محدد" : "Not specified")}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total - نفس OrderDetails */}
          <div className="border-t border-gray-100 pt-8">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-black text-gray-900">
                  {language === "ar" ? "الإجمالي" : "Total"}
                </span>
                <span className="text-3xl font-black text-green-600">
                  {orderDetails.totalAmount?.toFixed(3) || "0.000"} KWD
                </span>
              </div>
              {orderDetails.paymentMethod && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-l-4 border-emerald-500">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FaCheckCircle className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {language === "ar" ? "طريقة الدفع:" : "Payment Method:"}{" "}
                      {orderDetails.paymentMethod === "fatora"
                        ? language === "ar"
                          ? "مدفوعة بـ MyFatoorah"
                          : "Paid via MyFatoorah"
                        : language === "ar"
                        ? "الدفع عند الاستلام"
                        : "Cash on Delivery"}
                    </p>
                    {orderDetails.paymentId && (
                      <p className="text-sm text-emerald-600">
                        Payment ID: {orderDetails.paymentId}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
