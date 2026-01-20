import { useEffect, useState, useRef, useCallback } from "react";
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
  FaDownload,
  FaShare,
} from "react-icons/fa";
import axios from "axios";
import emailjs from "@emailjs/browser";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(false);
  const hasSentEmail = useRef(false);
  const pdfContentRef = useRef(null);

  const dir = language === "ar" ? "rtl" : "ltr";
  emailjs.init("JaNW9V45GnMviSTP1");

  const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (amount) => {
    return toNumber(amount).toFixed(3) + " KWD";
  };

  // 🔥 PDF GENERATION FUNCTION
  const generatePDF = useCallback(async () => {
    if (!order || !pdfContentRef.current) return;

    setPdfGenerating(true);
    try {
      const element = pdfContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 10;

      // Title page
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("ORDER RECEIPT", 105, 25, { align: "center" });
      pdf.setFontSize(14);
      pdf.text(`Order #${order._id.slice(-6).toUpperCase()}`, 105, 40, { align: "center" });
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 105, 50, { align: "center" });

      // Add main content
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`order-${order._id.slice(-6).toUpperCase()}-receipt.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  }, [order]);

  // Fix duplicate // in URL
  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('/payment-success?')) {
      const cleanUrl = currentUrl.replace(/\/{2,}/g, '/');
      window.history.replaceState({}, document.title, cleanUrl);
    }

  }, []);

  // localStorage fallback
  useEffect(() => {
    if (orderId) localStorage.setItem("paymentOrderId", orderId);
    if (paymentId) localStorage.setItem("paymentOrderId", paymentId);
  }, [orderId, paymentId]);


  // cleanup
  useEffect(() => {
    const isFreshCashOrder = location.state?.justCreated && orderId;

    if (isFreshCashOrder && !cleanupDone) {
      const cleanupTimer = setTimeout(() => {
        clearCart();
        clearOrder();
        localStorage.removeItem("checkoutData");
        localStorage.removeItem("cart");
        setCleanupDone(true);
      }, 1500);

      return () => clearTimeout(cleanupTimer);
    }
  }, [location.state, orderId, clearCart, clearOrder, cleanupDone]);

  // 🔥 Correct Polling
  useEffect(() => {
    const idToUse = orderId || paymentId || localStorage.getItem("paymentOrderId");
    if (!idToUse) {
      setError("Missing orderId or paymentId");
      setLoading(false);
      return;
    }

    localStorage.setItem("paymentOrderId", idToUse);

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        let res;

        // if it looks like a Mongo ObjectId
        if (idToUse.length === 24) {
          res = await axios.get(
            `https://lilian-backend.onrender.com/api/orders/${idToUse}`,
            { withCredentials: true }
          );
        } else {
          res = await axios
            .get(`https://lilian-backend.onrender.com/api/orders/by-payment/${idToUse}`, {
              withCredentials: true,
            })
            .catch(async () => {
              return await axios.get(
                `https://lilian-backend.onrender.com/api/orders/by-invoice/${idToUse}`,
                { withCredentials: true }
              );
            });
        }

        const orderData = res.data.data || res.data;

        if (orderData.isPaid) {
          setOrder(orderData);
          localStorage.removeItem("paymentOrderId");
        }
      } catch (err) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);

    return () => clearInterval(interval);
  }, [orderId, paymentId]);


  // Email notification
  useEffect(() => {
    if (order?._id && !loading && !error && !hasSentEmail.current) {
      hasSentEmail.current = true;

      const sendOwnerEmail = async () => {
        try {
          const safeSubtotal = order.products?.reduce(
            (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
            0
          ) || 0;

          const safeDiscountAmount = toNumber(order.promoDiscount) > 0
            ? safeSubtotal * (toNumber(order.promoDiscount) / 100)
            : 0;

          const itemsList = order.products
            ?.map((item) => {
              const name = item.product?.name || item.name;
              const displayName = typeof name === "string"
                ? name
                : name?.[language] || name?.en || name?.ar || "Product";
              return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
                <span>${displayName} (x${toNumber(item.quantity)})</span>
                <strong>${(toNumber(item.price) * toNumber(item.quantity)).toFixed(3)} KWD</strong>
              </div>`;
            })
            .join("") || "";

          const emailData = {
            order_id: order._id,
            order_number: order._id.slice(-6).toUpperCase(),
            total: formatCurrency(order.totalAmount),
            subtotal: formatCurrency(safeSubtotal),
            shipping: formatCurrency(order.shippingCost),
            discount: safeDiscountAmount > 0 ? `-${formatCurrency(safeDiscountAmount)} (${toNumber(order.promoDiscount)}%)` : "0 KWD",
            promo_code: order.promoCode || "None",
            customer_name: order.userInfo?.name || "Unknown Customer",
            customer_phone: order.userInfo?.phone || "No phone",
            items_count: order.products?.length || 0,
            order_type: order.orderType === "pickup" ? "Pickup" : "Delivery",
            address: `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.area || ""}`,
            schedule: order.scheduleTime
              ? `${new Date(order.scheduleTime.date).toLocaleDateString()} - ${order.scheduleTime.timeSlot}`
              : "ASAP",
            items_list: itemsList,
            special_instructions: order.specialInstructions || "None",
          };

          await emailjs.send("service_1ti4s08", "template_489g9rh", emailData);
          setEmailSent(true);
        } catch (err) {
          setEmailSent(true);
        }
      };

      sendOwnerEmail();
    }
  }, [order, loading, error, language]);

  const displayName = (name) => {
    if (!name) return language === "ar" ? "منتج" : "Product";
    if (typeof name === "string") return name;
    return name[language] || name.en || name.ar || (language === "ar" ? "منتج" : "Product");
  };

  const safeSubtotal = order?.products?.reduce(
    (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
    0
  ) || 0;

  const safeDiscountAmount = toNumber(order?.promoDiscount) > 0
    ? safeSubtotal * (toNumber(order.promoDiscount) / 100)
    : 0;

  const safeShippingCost = toNumber(order?.shippingCost);
  const safeGrandTotal = toNumber(order?.totalAmount) || safeSubtotal - safeDiscountAmount + safeShippingCost;

  const getFullAddress = () => {
    if (!order?.shippingAddress || order.orderType === "pickup")
      return language === "ar" ? "استلام من المتجر" : "Store Pickup";

    const addr = order.shippingAddress;
    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.area && addr.area !== "pickup") parts.push(addr.area);
    if (addr.street) parts.push(`St ${addr.street}`);
    if (addr.block) parts.push(`Blck ${addr.block}`);
    if (addr.house) parts.push(`Hse ${addr.house}`);
    return parts.length > 0 ? parts.join(", ") : language === "ar" ? "غير محدد" : "Not specified";
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

  const handleBackToHome = () => {
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]" dir={dir}>
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">
            {language === "ar" ? "جاري تحميل بيانات الطلب..." : "Loading order data..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]" dir={dir}>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-4" dir={dir}>
      {/* Header */}
      <div className="bg-white w-full flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2] rounded-t-xl mb-4 sticky top-0 z-10">
        <button onClick={handleBackToHome} className="cursor-pointer p-1 rounded-full hover:bg-gray-100">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="font-bold text-lg">{language === "ar" ? "دفع ناجح" : "Payment Success"}</h1>
        <div className="w-10" />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl flex flex-col" ref={pdfContentRef}>
        {/* Success Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white">
              <FaCheckCircle className="text-3xl text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2 pt-8">
            {language === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
          </h1>
          <p className="text-gray-600 text-lg">
            {language === "ar"
              ? "شكراً لك! تمت معالجة طلبك رقم"
              : "Thank you! Your order"}
            <span className="font-bold text-green-600">
              {" "}#{order._id.slice(-6).toUpperCase()}
            </span>
            {language === "ar"
              ? "تمت معالجته بنجاح."
              : "has been processed successfully."}
          </p>
          {emailSent && (
            <p className="text-sm text-green-600 mt-2 bg-green-50 p-2 rounded-lg">
              ✅ {language === "ar" ? "تم إرسال إشعار للمتجر" : "Notification sent to store!"}
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
              <div key={item._id || idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">
                    {displayName(item.product?.name || item.name || `Product ${idx + 1}`)}
                  </span>
                  {item.message && (
                    <p className="text-sm text-gray-500 mt-1">{item.message}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(toNumber(item.price) * toNumber(item.quantity))}
                  </p>
                  <p className="text-xs text-gray-500">{toNumber(item.quantity)}x</p>
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
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-lg mt-1">🕒</span>
              {getScheduleDisplay().date ? (
                <div className="font-medium flex flex-col">
                  <span>{getScheduleDisplay().date}</span>
                  <span>{getScheduleDisplay().time}</span>
                </div>
              ) : (
                <span>{language === "ar" ? "في أقرب وقت ممكن" : "As Soon As Possible"}</span>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
              <FaMapMarkerAlt className="text-lg mt-1 text-indigo-600" />
              <span className="capitalize font-medium">{getFullAddress()}</span>
            </div>

            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
              <FaPhone className="text-lg mt-1 text-emerald-600" />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 capitalize">
                  {order.userInfo?.name || (language === "ar" ? "غير محدد" : "Not specified")}
                </span>
                <span className="text-sm text-emerald-700">{order.userInfo?.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FaTruck className="text-lg text-blue-600" />
              <span className="font-semibold capitalize">
                {order.orderType === "pickup"
                  ? language === "ar" ? "استلام ذاتي" : "Self Pickup"
                  : language === "ar" ? "توصيل للمنزل" : "Home Delivery"}
              </span>
            </div>

            {order?.specialInstructions && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <span className="text-lg mt-1">📝</span>
                <div className="flex-1">
                  <span className="font-semibold text-yellow-900">
                    {language === "ar" ? "ملاحظات خاصة" : "Special Instructions"}:
                  </span>
                  <br />
                  <span className="text-yellow-800">{order.specialInstructions}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="pt-6 border-t border-gray-200 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between text-lg text-gray-700 font-semibold">
              <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{formatCurrency(safeSubtotal)}</span>
            </div>

            {safeDiscountAmount > 0 && (
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
                <span className="font-black">-{formatCurrency(safeDiscountAmount)}</span>
              </div>
            )}

            {order.orderType === "delivery" && safeShippingCost > 0 && (
              <div className="flex justify-between text-lg text-gray-700 font-semibold">
                <span>
                  <FaTruck className="inline mr-1 text-green-600" />
                  {language === "ar" ? "تكلفة التوصيل" : "Shipping Cost"}
                </span>
                <span className="text-green-600 font-semibold">{formatCurrency(safeShippingCost)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 bg-green-50 p-4 rounded-xl">
              <span className="text-2xl font-black text-gray-900">
                {language === "ar" ? "الإجمالي النهائي" : "Grand Total"}
              </span>
              <span className="text-3xl font-black text-green-600">
                {formatCurrency(safeGrandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* 🔥 NEW ACTION BUTTONS WITH PDF DOWNLOAD */}
        <div className="grid grid-cols-1 gap-3">
          {/* PDF Download Button */}
          <button
            onClick={generatePDF}
            disabled={pdfGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {pdfGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FaDownload className="text-lg" />
                {language === "ar" ? "تحميل إيصال PDF" : "Download PDF Receipt"}
              </>
            )}
          </button>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleViewOrder}
              className="bg-green-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="text-lg" />
              {language === "ar" ? "عرض الطلب" : "View Order"}
            </button>
            <button
              onClick={handleBackToHome}
              className="bg-black text-white py-4 px-6 rounded-xl font-bold hover:bg-gray-800 transition-all duration-200"
            >
              {language === "ar" ? "الرئيسية" : "Home"}
            </button>
          </div>

          {/* WhatsApp Share */}
          <a
            href={`https://wa.me/965?text=${encodeURIComponent(
              `I just ordered from Lilian & La Rose! 🛍️\nOrder #${order._id.slice(-6).toUpperCase()}\nTotal: ${formatCurrency(safeGrandTotal)}\n${window.location.origin}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-2"
          >
            <FaShare className="text-lg" />
            {language === "ar" ? "مشاركة عالواتساب" : "Share on WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
