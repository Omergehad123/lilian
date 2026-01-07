import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaEye,
  FaTrash,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../hooks/useOrder";

function Orders() {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const { order } = useOrder();
  const t = translations[language] || {};

  const dir = language === "ar" ? "rtl" : "ltr";

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  const handleBack = () => {
    navigate(-1);
  };

  // ✅ Mock Data - سيتم حذفه لاحقاً
  const [orders, setOrders] = useState([
    {
      id: "1",
      status: "delivered",
      date: "2026-01-07",
      time: "08:00 AM - 01:00 PM",
      total: "25.500",
      itemsCount: 3,
      orderType: "delivery",
      location: "الفنطاس - أبو حلفة",
      trackingNumber: "#ORD-001",
    },
    {
      id: "2",
      status: "pending",
      date: "2026-01-06",
      time: "01:00 PM - 06:00 PM",
      total: "18.250",
      itemsCount: 2,
      orderType: "pickup",
      location: "الأحمدي - الرقة",
      trackingNumber: "#ORD-002",
    },
    {
      id: "3",
      status: "cancelled",
      date: "2026-01-05",
      time: "06:00 PM - 11:00 PM",
      total: "12.750",
      itemsCount: 1,
      orderType: "delivery",
      location: "الفروانية - الخيطان",
      trackingNumber: "#ORD-003",
    },
    {
      id: "4",
      status: "delivered",
      date: "2026-01-04",
      time: "08:00 AM - 01:00 PM",
      total: "35.000",
      itemsCount: 5,
      orderType: "pickup",
      location: "حولي - سلوى",
      trackingNumber: "#ORD-004",
    },
  ]);

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
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

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2] sticky top-0 z-50">
        <button onClick={handleBack} className="cursor-pointer" type="button">
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

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaClock className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {language === "ar" ? "لا توجد طلبات" : "No Orders Yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === "ar"
                ? "اطلب منتجاتك الأولى الآن"
                : "Order your first products now"}
            </p>
          </div>
        ) : (
          /* Orders Cards */
          orders.map((orderItem) => (
            <div
              key={orderItem.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-black rounded-full" />
                  <span className="font-bold text-lg text-gray-900">
                    {orderItem.trackingNumber}
                  </span>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    orderItem.status
                  )}`}
                >
                  {getStatusIcon(orderItem.status)}
                  <span className="ml-1 capitalize">
                    {language === "ar"
                      ? orderItem.status === "delivered"
                        ? "تم التوصيل"
                        : orderItem.status === "pending"
                        ? "قيد الانتظار"
                        : "ملغي"
                      : orderItem.status.charAt(0).toUpperCase() +
                        orderItem.status.slice(1)}
                  </span>
                </div>
              </div>
              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="text-gray-500" />
                  <span>
                    {formatDate(orderItem.date)} | {orderItem.time}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-sm">
                  <span className="font-bold text-lg text-black">
                    {orderItem.total} KWD
                  </span>
                </div>
              </div>
              {/* Items & Location */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500 block mb-1">
                    {language === "ar" ? "عدد المنتجات" : "Items"}
                  </span>
                  <span className="font-medium">{orderItem.itemsCount}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">
                    {orderItem.orderType === "delivery"
                      ? language === "ar"
                        ? "التوصيل إلى"
                        : "Delivery to"
                      : language === "ar"
                      ? "الاستلام من"
                      : "Pickup from"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {orderItem.location}
                  </span>
                </div>
              </div>
              {/* Action Buttons */}
              1. أولاً: حدث Orders.jsx - زر View Details ديناميكي jsx // في
              Orders.jsx - استبدل Action Buttons section:
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <FaTrash className="text-sm" />
                  {language === "ar" ? "حذف" : "Delete"}
                </button>
                <button
                  onClick={() => navigate(`/order/${orderItem.id}`)}
                  className="flex-1 py-2 px-4 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <FaEye className="text-sm" />
                  {language === "ar" ? "عرض التفاصيل" : "View Details"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Orders;
