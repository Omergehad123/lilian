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
import axios from "axios";
import emailjs from "@emailjs/browser";

function Orders() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || {};
  const dir = language === "ar" ? "rtl" : "ltr";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState({});

  emailjs.init("JaNW9V45GnMviSTP1");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          "https://lilian-backend.onrender.com/api/orders",
          { withCredentials: true }
        );
        setOrders(res.data.data || []);
      } catch (err) {
        console.error(
          "❌ Orders fetch error:",
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          setError("Please log in to view your orders");
        } else {
          setError(err.response?.data?.message || "Failed to load orders");
        }
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCancelOrder = async (order) => {
    if (
      !window.confirm(
        language === "ar"
          ? "هل أنت متأكد من إلغاء هذا الطلب؟"
          : "Are you sure you want to cancel this order?"
      )
    )
      return;

    try {
      setCancelLoading((prev) => ({ ...prev, [order._id]: true }));

      // ✅ STEP 0: EXTRACT PROMO CODE from cancelled order
      const promoCode = order.promoCode;
      console.log("🎫 Promo code to restore:", promoCode);

      // ✅ STEP 1: DELETE ORDER FROM DATABASE
      console.log("🗑️ Deleting order from database...");
      await axios.delete(
        `https://lilian-backend.onrender.com/api/orders/${order._id}`,
        { withCredentials: true }
      );
      console.log("✅ Order deleted from database");

      // ✅ STEP 2: RESTORE PROMO CODE TO DATABASE (if exists)
      if (promoCode) {
        console.log("🔓 Restoring promo code:", promoCode);
        try {
          await axios.post(
            `https://lilian-backend.onrender.com/api/promos/${promoCode}/restore`,
            { orderId: order._id },
            { withCredentials: true }
          );
          console.log("✅ Promo code restored successfully");
        } catch (promoErr) {
          console.warn(
            "⚠️ Promo restore failed (but order deleted):",
            promoErr.response?.data
          );
          // Continue anyway - order deletion is priority
        }
      }

      // ✅ STEP 3: SEND CANCELLATION EMAIL
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
        cancellation_reason: "Customer deleted order via mobile app",
        promo_code: promoCode || "None", // ✅ Include promo info in email
        status: "DELETED BY CUSTOMER",
      };

      console.log("📧 Sending cancellation email...");
      await emailjs.send("service_1ti4s08", "template_489g9rh", emailData);
      console.log("✅ Cancellation email sent to owner");

      // ✅ STEP 4: Remove from frontend
      setOrders((prev) => prev.filter((item) => item._id !== order._id));

      alert(
        language === "ar"
          ? `✅ تم حذف الطلب نهائياً${
              promoCode ? ` واستعادة كود ${promoCode}` : ""
            }!`
          : `✅ Order deleted &${
              promoCode ? ` promo ${promoCode} restored` : " store notified"
            }!`
      );
    } catch (err) {
      console.error("❌ Delete failed:", err.response?.data || err.message);
      alert(
        language === "ar"
          ? `❌ خطأ: ${err.response?.data?.message || "فشل في الحذف"}`
          : `❌ Error: ${err.response?.data?.message || "Failed to delete"}`
      );
    } finally {
      setCancelLoading((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const handleBack = () => navigate(-1);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
      case "confirmed":
        return <FaEye className="text-blue-600" />;
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
    products.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const canCancelOrder = (status) => status === "pending";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>
            {language === "ar" ? "جاري تحميل الطلبات..." : "Loading orders..."}
          </p>
        </div>
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
        <button className="flex items-center justify-center cursor-pointer pb-2">
          <span className="text-lg text-black">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 text-sm">{error}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-1 border border-red-500 text-red-500 text-sm rounded-lg hover:bg-red-50"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      {/* No orders message */}
      {orders.length === 0 && !loading && !error && (
        <div className="text-center mt-20">
          <FaClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">
            {language === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
          </p>
          <p className="text-gray-400 text-sm">
            {language === "ar"
              ? "سوف تظهر طلباتك هنا"
              : "Your orders will appear here"}
          </p>
        </div>
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
                      : order.status === "cancelled"
                      ? "ملغي"
                      : "مؤكد"
                    : order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <FaClock className="text-gray-500" />
                <span>
                  {formatDate(order.scheduleTime?.date)} |{" "}
                  {formatTimeSlot(order.scheduleTime?.timeSlot)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 text-sm">
                <span className="font-bold text-lg text-black">
                  {order.totalAmount?.toFixed(3)} kw
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500 block mb-1">
                  {language === "ar" ? "عدد المنتجات" : "Items"}
                </span>
                <span className="font-medium">
                  {getTotalItems(order.products || [])}
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

            {/* ✅ CANCEL BUTTON - PENDING ONLY */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {canCancelOrder(order.status) ? (
                <button
                  onClick={() => handleCancelOrder(order)} // ✅ Pass full order object
                  disabled={cancelLoading[order._id]}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading[order._id] ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaTrash className="text-sm" />
                  )}
                  {language === "ar" ? "إلغاء الطلب" : "Cancel Order"}
                </button>
              ) : (
                <div className="flex-1 py-2 px-4 bg-gray-100 rounded-xl text-sm font-medium text-gray-500 flex items-center justify-center">
                  {language === "ar" ? "لا يمكن الإلغاء" : "Cannot Cancel"}
                </div>
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
