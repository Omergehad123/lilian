// ✅ Checkout.jsx - SAME STYLE + Navigation State FIXED
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaTag } from "react-icons/fa";
import { useOrder } from "../../hooks/useOrder";
import { useCart } from "../../hooks/useCart";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import { FaMotorcycle } from "react-icons/fa";

const Checkout = () => {
  const { order, setCustomerName, setCustomerPhone, setShippingAddress } =
    useOrder();
  const { cart } = useCart();
  const { language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const inputBase =
    "lg:w-[400px] w-full p-1 border-b focus:outline-none text-gray-700";
  const buttonBase =
    "w-full px-4 py-2 rounded-xl font-semibold flex items-center justify-center";

  // orderType to determine if pickup or delivery
  const orderType = order?.orderType || "delivery";

  // Shipping & customer info
  const [street, setStreet] = useState(order.shippingAddress?.street || "");
  const [block, setBlock] = useState(order.shippingAddress?.block || "");
  const [house, setHouse] = useState(order.shippingAddress?.house || "");
  const [name, setName] = useState(order.customerName || "");
  const [phone, setPhone] = useState(order.customerPhone || "");

  // Promo Code State (only reading from localStorage, no actions)
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoValid, setPromoValid] = useState(false);

  const dir = language === "ar" ? "rtl" : "ltr";

  // Only load promo data from localStorage (no validation/no editing)
  useEffect(() => {
    const savedPromoData = localStorage.getItem("checkoutData");
    if (savedPromoData) {
      const checkoutData = JSON.parse(savedPromoData);
      if (checkoutData.promoCode && checkoutData.promoDiscount) {
        setPromoCode(checkoutData.promoCode);
        setPromoDiscount(checkoutData.promoDiscount);
        setPromoValid(true);
      }
    }
  }, []);

  // Cart subtotal
  const cartSubtotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Discount calculations
  const discountAmount = cartSubtotal * (promoDiscount / 100);
  const discountedTotal = cartSubtotal - discountAmount;

  // Helpers for displaying location and schedule info
  const getLocationDisplay = () => {
    if (!order.shippingAddress)
      return language === "ar" ? "غير محدد" : "Not set";
    const { city, area, street, block, house } = order.shippingAddress;
    let parts = [];
    if (city) parts.push(city);
    if (area) parts.push(area);
    if (street) parts.push("St " + street);
    if (block) parts.push("Blck " + block);
    if (house) parts.push("Hse " + house);
    if (!parts.length) return language === "ar" ? "غير محدد" : "Not set";
    return parts.join(", ");
  };

  const getScheduleDisplay = () => {
    const slot = order.scheduledSlot;
    if (!slot || !slot.date || !slot.timeSlot) {
      return language === "ar" ? "في أقرب وقت ممكن" : "Not set";
    }
    return slot.date.split("-").reverse().join("/") + ` | ${slot.timeSlot}`;
  };

  const handleSaveAndNavigateToReview = () => {
    // Only save street/block/house for delivery type
    if (orderType === "pickup") {
      setShippingAddress({});
    } else {
      setShippingAddress({
        street,
        block: block === "" ? "" : Number(block),
        house: house === "" ? "" : Number(house),
      });
    }
    setCustomerName(name);
    setCustomerPhone(phone);
    navigate("/reviewOrder");
  };

  // Form validation: require street/block/house for delivery, but not pickup
  const isFormValid =
    (orderType === "pickup" ||
      (street.trim() && block.toString().trim() && house.toString().trim())) &&
    name.trim() &&
    phone.trim();

  const handleSelectType = () => {
    navigate("/orderMode");
  };

  // Handlers for numeric only input for block and house
  const handleBlockChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setBlock(value);
  };

  const handleHouseChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setHouse(value);
  };

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2] sticky top-0 z-10">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="font-bold text-xl">
          {language === "ar" ? "إتمام الطلب" : "Checkout"}
        </h1>
        <button onClick={toggleLanguage} className="flex items-center pb-2">
          <span className="text-lg text-black font-bold">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      <div className="p-8 lg:w-[60%] w-[95%] mx-auto rounded-2xl bg-white shadow-xl">
        {/* Order Type Selection */}
        <div className="flex items-center justify-center gap-5 my-5">
          <button
            onClick={() => handleSelectType("delivery")}
            className={`capitalize px-6 py-3 text-sm transition-all duration-200 ${
              orderType === "delivery"
                ? "border-b-2 border-black text-black font-semibold"
                : "border-b-0 text-gray-500 font-normal hover:text-black"
            }`}
            style={orderType === "delivery" ? {} : { cursor: "pointer" }}
          >
            {language === "ar" ? "توصيل" : "Delivery"}
          </button>
          <button
            onClick={() => handleSelectType("pickup")}
            className={`capitalize px-6 py-3 text-sm transition-all duration-200 ${
              orderType === "pickup"
                ? "border-b-2 border-black text-black font-semibold"
                : "border-b-0 text-gray-500 font-normal hover:text-black"
            }`}
            style={orderType === "pickup" ? {} : { cursor: "pointer" }}
          >
            {language === "ar" ? "استلام" : "Pickup"}
          </button>
        </div>

        {/* Order Info */}
        <div className="flex flex-col gap-5 px-6 py-5 w-full mb-9">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="capitalize text-[#777] text-md">
                {language === "ar" ? "العنوان" : "Deliver to"}
              </span>
              <div className="flex items-center gap-3">
                <FaMotorcycle className="text-[#777] text-xl" />
                <span className="capitalize text-black font-semibold text-md">
                  {getLocationDisplay()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* ✅ FIXED: Pass checkout path for return navigation */}
              <button
                type="button"
                className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                onClick={() =>
                  navigate("/orderMode", {
                    state: { from: "/checkout" },
                  })
                }
              >
                {language === "ar" ? "تعديل" : "Edit"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="capitalize text-[#777] text-md">
                {language === "ar" ? "أقرب موعد" : "Earliest arrival"}
              </span>
              <div className="flex items-center gap-3">
                <FiClock className="text-[#777] text-xl" />
                <span className="capitalize text-black font-semibold text-md">
                  {getScheduleDisplay()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* ✅ FIXED: Pass checkout path for return navigation */}
              <button
                type="button"
                className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                onClick={() =>
                  navigate("/time", {
                    state: { from: "/checkout" },
                  })
                }
              >
                {language === "ar" ? "تعديل" : "Edit"}
              </button>
            </div>
          </div>
        </div>

        {/* Mini Promo Section (readonly, discount display only) */}
        {promoValid && (
          <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border mb-4 flex items-center gap-2">
            <FaTag className="text-purple-600 text-lg" />
            <span className="font-semibold text-green-700">
              {language === "ar"
                ? `كود الخصم (${promoCode}) - ${promoDiscount}% خصم`
                : `Promo: ${promoCode} - ${promoDiscount}% OFF`}
            </span>
            <span className="text-sm text-green-600">
              -{discountAmount.toFixed(3)} kw
            </span>
          </div>
        )}

        {/* Customer Form */}
        <form className="space-y-5 mb-8 flex items-center gap-5 justify-center flex-wrap">
          {orderType !== "pickup" ? (
            <>
              <div>
                <input
                  className={inputBase}
                  placeholder={language === "ar" ? "الشارع" : "street"}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder={language === "ar" ? "البلوك" : "block"}
                  value={block}
                  onChange={handleBlockChange}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder={language === "ar" ? "رقم المنزل" : "house"}
                  value={house}
                  onChange={handleHouseChange}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </>
          ) : null}
          <div>
            <input
              className={inputBase}
              placeholder={language === "ar" ? "الاسم" : "name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <input
              className={inputBase}
              placeholder={language === "ar" ? "الهاتف" : "phone"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </form>

        {/* Total with Discount */}
        <div className="space-y-3 mb-8 text-center">
          <div className="flex justify-between text-lg font-semibold text-gray-700 px-4">
            <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
            <span>{cartSubtotal.toFixed(3)} kw</span>
          </div>

          {promoValid && (
            <div className="flex justify-between text-lg font-semibold text-green-600 px-4">
              <span>{language === "ar" ? "الخصم" : "Discount"}</span>
              <span>-{discountAmount.toFixed(3)} kw</span>
            </div>
          )}

          <h3 className="text-2xl font-black text-green-600">
            {language === "ar" ? "الإجمالي" : "Total"}:{" "}
            {discountedTotal.toFixed(3)} kw
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          <button
            className={`${buttonBase} ${
              isFormValid
                ? "bg-black text-white hover:bg-gray-800 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleSaveAndNavigateToReview}
            type="button"
            disabled={!isFormValid}
          >
            {language === "ar" ? "مراجعة الطلب" : "Review Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
