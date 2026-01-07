import React, { useMemo, useState } from "react";
import { FaArrowLeft, FaCheckCircle, FaMoneyBillWave, FaReceipt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";
import { useOrder } from "../../hooks/useOrder";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";

function Checkout() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" or "fatora"

  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const { order } = useOrder();
  const { cart } = useCart();
  const { user } = useAuth();

  const handleBack = () => navigate(-1);
  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  // Items summary
  const orderItems = useMemo(() => {
    if (order && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    return cart || [];
  }, [order, cart]);

  const subtotal = orderItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  const discountRate = 0.1;
  const discount = subtotal * discountRate;
  const total = subtotal - discount;

  const displayName = (name) => {
    if (!name)
      return t.productFallback || (language === "ar" ? "منتج" : "Product");
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
  const discountLabel = language === "ar" ? "الخصم (10٪)" : "Discount (10%)";
  const totalLabel = language === "ar" ? "الإجمالي" : "Total";

  // User data
  const hasName = user?.firstName || user?.lastName;
  const fullName = hasName
    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : language === "ar"
    ? "العميل"
    : "Customer";
  const email = user?.email || "";

  const orderType = order?.orderType || "pickup";
  const locationLabel =
    order?.shippingAddress?.location ||
    order?.shippingAddress?.areaName ||
    (language === "ar" ? "غير محدد" : "not selected");

  // Payment handlers
  const handleCashPayment = () => {
    console.log("Pay with Cash");
    // TODO: Complete cash order
    alert(
      language === "ar"
        ? "سيتم الدفع عند الاستلام!"
        : "Cash on delivery confirmed!"
    );
  };

  const handleFatoraPayment = () => {
    console.log("Pay with Fatora");
    // TODO: Redirect to Fatora payment gateway
    alert(
      language === "ar"
        ? "جاري الانتقال للدفع بفاتورة..."
        : "Redirecting to Fatora..."
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300 sticky top-0 z-50">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-semibold text-lg">
          {language === "ar" ? "طريقة الدفع" : "Payment Method"}
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
          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              {itemsLabel}
            </h2>
            {orderItems.length === 0 ? (
              <p className="text-sm text-gray-400">
                {language === "ar"
                  ? "لا توجد عناصر في الطلب."
                  : "No items in the order."}
              </p>
            ) : (
              orderItems.map((item) => (
                <div
                  key={item._id || item.id}
                  className="flex justify-between items-center text-sm text-gray-800 mb-1"
                >
                  <span>
                    {item.quantity || 1}x {displayName(item.name)}
                  </span>
                  <span>{(item.price || 0) * (item.quantity || 1)} KWD</span>
                </div>
              ))
            )}
          </div>

          {/* Pickup / Delivery information */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              {pickupInfoLabel}
            </h2>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              {/* Time */}
              {order?.pickupDate && order?.pickupStartTime ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕒</span>
                  <span className="font-medium">
                    {order.pickupDate.split("-").reverse().join("/")}
                    {order.pickupStartTime}-{order.pickupEndTime}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕒</span>
                  <span>
                    {language === "ar"
                      ? "في أقرب وقت ممكن"
                      : "As Soon As Possible"}
                  </span>
                </div>
              )}

              {/* Location */}
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <span className="capitalize">{locationLabel}</span>
              </div>

              {/* Customer */}
              <div className="flex items-start gap-2">
                <span className="text-lg">👤</span>
                <div className="flex flex-col">
                  <span className="capitalize">{fullName}</span>
                  {email && (
                    <span className="text-xs text-gray-500 break-all">
                      {email}
                    </span>
                  )}
                </div>
              </div>

              {/* Mode */}
              <div className="flex items-center gap-2">
                <span className="text-lg">🚚</span>
                <span className="capitalize">
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
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              {language === "ar" ? "اختر طريقة الدفع" : "Choose Payment Method"}
            </h2>

            {/* Cash Option */}
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`w-full p-4 border-2 rounded-xl mb-3 flex items-center gap-4 transition-all duration-200 ${
                paymentMethod === "cash"
                  ? "border-black bg-black text-white shadow-lg"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <FaMoneyBillWave className="text-2xl" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">
                  {language === "ar" ? "الدفع عند الاستلام" : "Pay with Cash"}
                </h3>
                <p className="text-sm opacity-75">
                  {language === "ar"
                    ? "ادفع الكاش عند استلام الطلب"
                    : "Pay cash when you receive your order"}
                </p>
              </div>
              {paymentMethod === "cash" && (
                <FaCheckCircle className="text-green-500 text-xl" />
              )}
            </button>

            {/* Fatora Option */}
            <button
              onClick={() => setPaymentMethod("fatora")}
              className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all duration-200 ${
                paymentMethod === "fatora"
                  ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <FaReceipt className="text-2xl" />
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">
                  {language === "ar" ? "الدفع بفاتورة" : "Pay with Fatora"}
                </h3>
                <p className="text-sm opacity-75">
                  {language === "ar"
                    ? "ادفع ببطاقة الائتمان أو البطاقة البنكية"
                    : "Pay with credit/debit card"}
                </p>
              </div>
              {paymentMethod === "fatora" && (
                <FaCheckCircle className="text-green-500 text-xl" />
              )}
            </button>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">{subtotalLabel}</span>
                <span>{subtotal.toFixed(3)} KWD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{discountLabel}</span>
                <span>{discount.toFixed(3)} KWD</span>
              </div>
              <div className="flex justify-between pt-2 font-semibold text-lg border-t border-gray-200 pt-3">
                <span>{totalLabel}</span>
                <span className="text-xl font-bold">
                  {total.toFixed(3)} KWD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Now button */}
      <div className="border-t border-gray-200 bg-white px-3 py-3">
        <button
          onClick={
            paymentMethod === "cash" ? handleCashPayment : handleFatoraPayment
          }
          className={`
            w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-200 flex items-center justify-center gap-2
            ${
              orderItems.length > 0
                ? "bg-black text-white hover:bg-gray-800 hover:shadow-2xl active:scale-[0.98]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {paymentMethod === "cash" ? (
            <>
              {language === "ar"
                ? "تأكيد الطلب - الدفع كاش"
                : "Confirm Order - Cash"}
            </>
          ) : (
            <>
              {language === "ar" ? "ادفع بفاتورة الآن" : "Pay with Fatora Now"}
              <FaReceipt className="text-sm" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
