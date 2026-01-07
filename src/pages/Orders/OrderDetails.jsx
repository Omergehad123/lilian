import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";
import { useOrder } from "../../hooks/useOrder";
import { useAuth } from "../../hooks/useAuth";

function OrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { language, changeLanguage } = useLanguage();
  const { order } = useOrder();
  const { user } = useAuth();

  const t = translations[language] || {};
  const dir = language === "ar" ? "rtl" : "ltr";

  // Mock Data - سيتم استبداله بـ API call
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Mock loading order by ID
    const mockOrders = {
      1: {
        id: "1",
        trackingNumber: "#ORD-001",
        status: "delivered",
        date: "2026-01-07",
        time: "08:00 AM - 01:00 PM",
        total: 25.5,
        subtotal: 28.333,
        discount: 2.833,
        items: [
          {
            id: "1",
            name: { ar: "فستان أحمر", en: "Red Dress" },
            price: 12.5,
            quantity: 1,
          },
          {
            id: "2",
            name: { ar: "حذاء أسود", en: "Black Shoes" },
            price: 8.333,
            quantity: 1,
          },
          {
            id: "3",
            name: { ar: "حقيبة جلدية", en: "Leather Bag" },
            price: 7.5,
            quantity: 1,
          },
        ],
        orderType: "delivery",
        location: "الفنطاس - أبو حلفة",
        customerName: "أحمد محمد",
        customerEmail: "ahmed@example.com",
        customerPhone: "+965 1234 5678",
      },
      2: {
        id: "2",
        trackingNumber: "#ORD-002",
        status: "pending",
        date: "2026-01-06",
        time: "01:00 PM - 06:00 PM",
        total: 18.25,
        subtotal: 20.278,
        discount: 2.028,
        items: [
          {
            id: "4",
            name: { ar: "قميص أبيض", en: "White Shirt" },
            price: 10.139,
            quantity: 2,
          },
        ],
        orderType: "pickup",
        location: "الأحمدي - الرقة",
        customerName: "فاطمة علي",
        customerEmail: "fatima@example.com",
        customerPhone: "+965 9876 5432",
      },
    };

    // Simulate API call
    setTimeout(() => {
      setOrderDetails(mockOrders[orderId] || null);
    }, 500);
  }, [orderId]);

  const handleBack = () => navigate(-1);
  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!orderDetails) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"
        dir={dir}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">
            {language === "ar"
              ? "جاري تحميل التفاصيل..."
              : "Loading details..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300 sticky top-0 z-50">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-semibold text-lg">
          {language === "ar" ? "تفاصيل الطلب" : "Order Details"}
        </p>
        <button
          className="flex items-center justify-center cursor-pointer pb-1"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      {/* Content card */}
      <div className="px-3 py-4 flex-1">
        <div className="bg-white rounded-xl shadow-sm px-4 py-5 flex flex-col h-full">
          {/* Order Header */}
          <div className="mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <span className="font-bold text-xl text-gray-900">
                {orderDetails.trackingNumber}
              </span>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                  orderDetails.status
                )}`}
              >
                {orderDetails.status === "delivered" && (
                  <FaCheckCircle className="text-xs" />
                )}
                {orderDetails.status === "pending" && (
                  <FaClock className="text-xs" />
                )}
                {orderDetails.status === "cancelled" && (
                  <FaTimes className="text-xs" />
                )}
                <span className="capitalize">
                  {language === "ar"
                    ? orderDetails.status === "delivered"
                      ? "تم التوصيل"
                      : orderDetails.status === "pending"
                      ? "قيد الانتظار"
                      : "ملغي"
                    : orderDetails.status.charAt(0).toUpperCase() +
                      orderDetails.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaClock className="text-gray-500" />
              <span>
                {formatDate(orderDetails.date)} | {orderDetails.time}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              {language === "ar" ? "العناصر" : "Order Items"} (
              {orderDetails.items.length})
            </h2>
            {orderDetails.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm text-gray-800 py-2 border-b border-gray-100 last:border-b-0"
              >
                <span>
                  {item.quantity}x {displayName(item.name)}
                </span>
                <span className="font-medium">
                  {(item.price * item.quantity).toFixed(3)} KWD
                </span>
              </div>
            ))}
          </div>

          {/* Order Information */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              {language === "ar" ? "معلومات الطلب" : "Order Information"}
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-lg text-gray-500 min-w-[20px]" />
                <span className="font-medium">
                  {orderDetails.orderType === "delivery"
                    ? language === "ar"
                      ? "التوصيل إلى"
                      : "Delivery to"
                    : language === "ar"
                    ? "الاستلام من"
                    : "Pickup from"}
                  <span className="block text-gray-900">
                    {orderDetails.location}
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-lg text-gray-500 mt-1 min-w-[20px]" />
                <div>
                  <span className="font-medium text-gray-900 block">
                    {orderDetails.customerName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {orderDetails.customerEmail}
                  </span>
                  <span className="text-xs text-gray-500">
                    📞 {orderDetails.customerPhone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {language === "ar" ? "المجموع الفرعي" : "Subtotal"}
                </span>
                <span>{orderDetails.subtotal.toFixed(3)} KWD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {language === "ar" ? "الخصم (10%)" : "Discount (10%)"}
                </span>
                <span>-{orderDetails.discount.toFixed(3)} KWD</span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-lg border-t border-gray-200 pt-3">
                <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="text-xl">
                  {orderDetails.total.toFixed(3)} KWD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
