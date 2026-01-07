import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaEye,
  FaTrash,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import translations from "../../utils/translations";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Orders() {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const { token } = useAuth(); // ✅ Add auth
  const t = translations[language] || {};
  const dir = language === "ar" ? "rtl" : "ltr";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` }, // ✅ Use correct endpoint + token
        });
        setOrders(res.data.data || []); // ✅ Match your controller response
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");
  const handleBack = () => navigate(-1);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="text-green-600" />;
      case "pending":
        return <FaClock className="text-yellow-600" />;
      case "cancelled":
        return <FaTrash className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeSlot = (timeSlot) => {
    if (language === "ar") {
      if (timeSlot === "08:00 AM - 01:00 PM") return "8ص - 1م";
      if (timeSlot === "01:00 PM - 06:00 PM") return "1م - 6م";
      if (timeSlot === "06:00 PM - 11:00 PM") return "6م - 11م";
    }
    return timeSlot;
  };

  const getTotalItems = (products) =>
    products.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <p>
          {language === "ar" ? "جاري تحميل الطلبات..." : "Loading orders..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2] sticky top-0 z-50">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">
          {t.orders || "Orders"}
        </h1>
        <button
          className="flex items-center justify-center cursor-pointer pb-2"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      {/* Small notice if no orders */}
      {orders.length === 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {language === "ar" ? "لا توجد طلبات بعد." : "No orders yet."}
        </p>
      )}

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-black rounded-full" />
                <span className="font-bold text-lg text-gray-900">
                  #{order._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">
                  {language === "ar"
                    ? order.status === "completed"
                      ? "مكتمل"
                      : order.status === "pending"
                      ? "قيد الانتظار"
                      : "ملغي"
                    : order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <FaClock className="text-gray-500" />
                <span>
                  {formatDate(order.scheduleTime.date)} |{" "}
                  {formatTimeSlot(order.scheduleTime.timeSlot)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 text-sm">
                <span className="font-bold text-lg text-black">
                  {order.totalAmount} KWD
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500 block mb-1">
                  {language === "ar" ? "عدد المنتجات" : "Items"}
                </span>
                <span className="font-medium">
                  {getTotalItems(order.products)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">
                  {order.orderType === "delivery"
                    ? language === "ar"
                      ? "التوصيل إلى"
                      : "Delivery to"
                    : language === "ar"
                    ? "الاستلام من"
                    : "Pickup from"}
                </span>
                <span className="font-medium text-gray-900">
                  {order.shippingAddress?.city}, {order.shippingAddress?.area}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {/* Hide cancel (delete) button if status is 'confirmed' */}
              {order.status !== "confirmed" && (
                <button className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <FaTrash className="text-sm" />
                  {language === "ar" ? "حذف" : "Delete"}
                </button>
              )}
              <button
                onClick={() => navigate(`/order/${order._id}`)}
                className="flex-1 py-2 px-4 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <FaEye className="text-sm" />
                {language === "ar" ? "عرض التفاصيل" : "View Details"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
