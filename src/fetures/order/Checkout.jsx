import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaTag } from "react-icons/fa";
import { useOrder } from "../../hooks/useOrder";
import { useCart } from "../../hooks/useCart";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import { FaMotorcycle } from "react-icons/fa";

const Checkout = () => {
  const {
    order,
    setCustomerName,
    setCustomerPhone,
    setShippingAddress,
    subtotal,
    discountedSubtotal,
    shippingCost,
    promoDiscount,
  } = useOrder();

  const { cart } = useCart();
  const { language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const inputBase =
    "lg:w-[180px] w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400";
  const buttonBase =
    "w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center text-lg";

  const orderType = order?.orderType || "delivery";

  // CART PROMO DATA - READ FROM localStorage
  const [cartPromoData, setCartPromoData] = useState({
    promoCode: null,
    promoDiscount: 0,
  });

  // Load promo data from Cart's localStorage on mount
  useEffect(() => {
    try {
      const checkoutData = localStorage.getItem("checkoutData");
      if (checkoutData) {
        const data = JSON.parse(checkoutData);
        setCartPromoData({
          promoCode: data.promoCode || null,
          promoDiscount: data.promoDiscount || 0,
        });
      }
    } catch (error) {
      console.error("Error reading checkoutData:", error);
    }
  }, []);

  // Shipping & customer info
  const [street, setStreet] = useState(order.shippingAddress?.street || "");
  const [block, setBlock] = useState(order.shippingAddress?.block || "");
  const [house, setHouse] = useState(order.shippingAddress?.house || "");
  const [name, setName] = useState(order.customerName || "");

  // PHONE STATE
  const [phoneCountryCode, setPhoneCountryCode] = useState("+965");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savedPhoneData, setSavedPhoneData] = useState(null);

  // COUNTRIES SHOWING GLOBAL CODES ONLY
  const countryCodes = [
    { code: "+965", digits: 8 },
    { code: "+20", digits: 11 },
    { code: "+971", digits: 10 },
    { code: "+966", digits: 10 },
    { code: "+962", digits: 10 },
    { code: "+968", digits: 8 },
    { code: "+974", digits: 8 },
  ];

  const dir = language === "ar" ? "rtl" : "ltr";

  const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // LOAD SAVED PHONE DATA ON MOUNT
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem("checkoutPhoneData");
      if (savedPhone) {
        const phoneData = JSON.parse(savedPhone);
        setPhoneCountryCode(phoneData.countryCode || "+965");
        setPhoneNumber(phoneData.number || "");
        setSavedPhoneData(phoneData);
        return;
      }
    } catch (error) {
      console.error("Error loading saved phone data:", error);
    }

    if (order.customerPhone && !savedPhoneData) {
      const fullPhone = order.customerPhone.replace(/[^\d+]/g, "");
      const matchedCountry = countryCodes.find((country) =>
        fullPhone.startsWith(country.code.replace("+", ""))
      );

      if (matchedCountry) {
        const countryDigits = matchedCountry.code.replace("+", "").length;
        const remainingNumber = fullPhone.slice(countryDigits);

        setPhoneCountryCode(matchedCountry.code);
        setPhoneNumber(remainingNumber);
        setSavedPhoneData({
          countryCode: matchedCountry.code,
          number: remainingNumber,
        });
      }
    }
  }, []); // only once

  // SAVE PHONE DATA TO LOCALSTORAGE
  useEffect(() => {
    if (phoneNumber || phoneCountryCode !== "+965") {
      const phoneData = {
        countryCode: phoneCountryCode,
        number: phoneNumber,
        timestamp: Date.now(),
      };
      localStorage.setItem("checkoutPhoneData", JSON.stringify(phoneData));
      setSavedPhoneData(phoneData);
    }
  }, [phoneCountryCode, phoneNumber]);

  // CALCULATIONS
  const cartSubtotal =
    toNumber(subtotal) ||
    cart.reduce(
      (total, item) => total + toNumber(item.price) * toNumber(item.quantity),
      0
    );

  const activePromoDiscount =
    cartPromoData.promoDiscount > 0
      ? cartPromoData.promoDiscount
      : toNumber(promoDiscount);

  const discountAmount = cartSubtotal * (activePromoDiscount / 100);
  const finalSubtotal = cartSubtotal - discountAmount;
  const safeShippingCost = toNumber(shippingCost);
  const totalWithShipping =
    finalSubtotal + (orderType === "delivery" ? safeShippingCost : 0);

  // Phone validation
  const selectedCountry = countryCodes.find((c) => c.code === phoneCountryCode);
  const isPhoneValid = phoneNumber.length >= (selectedCountry?.digits - 3 || 7);

  const isFormValid =
    (orderType === "pickup" ||
      (street.trim() && block.toString().trim() && house.toString().trim())) &&
    name.trim() &&
    isPhoneValid;

  const getLocationDisplay = () => {
    if (!order.shippingAddress || orderType === "pickup") {
      return language === "ar" ? "استلام من المتجر" : "Store Pickup";
    }
    const { city, area, street, block, house } = order.shippingAddress;
    let parts = [];
    if (city) parts.push(city);
    if (area) parts.push(area);
    if (street) parts.push("St " + street);
    if (block) parts.push("Blck " + block);
    if (house) parts.push("Hse " + house);
    return parts.join(", ") || (language === "ar" ? "غير محدد" : "Not set");
  };

  const getScheduleDisplay = () => {
    const slot = order?.scheduledSlot;
    if (!slot?.date || !slot.timeSlot) {
      return language === "ar" ? "في أقرب وقت ممكن" : "ASAP";
    }
    return slot.date.split("-").reverse().join("/") + ` | ${slot.timeSlot}`;
  };

  // 🚀 NEW: navigate only after state updates
  const [readyToReview, setReadyToReview] = useState(false);

  useEffect(() => {
    if (readyToReview) {
      navigate("/reviewOrder");
      setReadyToReview(false);
    }
  }, [readyToReview, navigate]);

  const handleSaveAndNavigateToReview = useCallback(() => {
    if (orderType === "pickup") {
      setShippingAddress({});
    } else {
      setShippingAddress({
        street,
        block: block === "" ? "" : Number(block),
        house: house === "" ? "" : Number(house),
      });
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
    const fullPhoneNumber = phoneCountryCode + cleanPhoneNumber;

    setCustomerName(name);
    setCustomerPhone(fullPhoneNumber);

    // IMPORTANT
    setReadyToReview(true);
  }, [
    orderType,
    street,
    block,
    house,
    name,
    phoneCountryCode,
    phoneNumber,
    setShippingAddress,
    setCustomerName,
    setCustomerPhone,
  ]);

  const handleBlockChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setBlock(value);
  };

  const handleHouseChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setHouse(value);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setPhoneNumber(value);
  };

  const handleSelectType = () => navigate("/orderMode");
  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");
  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2] sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="font-bold text-xl">
          {language === "ar" ? "إتمام الطلب" : "Checkout"}
        </h1>
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <span className="text-lg text-black font-bold">
            {language === "en" ? "عربي" : "English"}
          </span>
        </button>
      </div>

      <div className="p-6 lg:w-[60%] w-[95%] mx-auto mt-6 rounded-2xl bg-white shadow-xl">
        {/* Order Type */}
        <div className="flex items-center justify-center gap-8 my-6 pb-6 border-b">
          <button
            onClick={handleSelectType}
            className={`px-8 py-3 text-sm font-medium transition-all duration-200 rounded-xl ${orderType === "delivery"
              ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
          >
            <FaMotorcycle className="inline mr-2" />
            {language === "ar" ? "توصيل" : "Delivery"}
          </button>
          <button
            onClick={handleSelectType}
            className={`px-8 py-3 text-sm font-medium transition-all duration-200 rounded-xl ${orderType === "pickup"
              ? "bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
          >
            🏪 {language === "ar" ? "استلام" : "Pickup"}
          </button>
        </div>

        {/* Order Info */}
        <div className="flex flex-col gap-6 px-4 py-6 mb-8 border-b">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-sm text-gray-500 mb-1">
                {language === "ar" ? "العنوان" : "Deliver to"}
              </span>
              <div className="flex items-center gap-3">
                <FaMotorcycle className="text-gray-500 text-xl" />
                <span className="font-semibold text-gray-900 text-lg">
                  {getLocationDisplay()}
                </span>
              </div>
            </div>
            <button
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold px-4 py-2 bg-blue-50 rounded-xl transition-colors"
              onClick={() =>
                navigate("/orderMode", { state: { from: "/checkout" } })
              }
            >
              {language === "ar" ? "تعديل" : "Edit"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-sm text-gray-500 mb-1">
                {language === "ar" ? "أقرب موعد" : "Earliest arrival"}
              </span>
              <div className="flex items-center gap-3">
                <FiClock className="text-gray-500 text-xl" />
                <span className="font-semibold text-gray-900 text-lg">
                  {getScheduleDisplay()}
                </span>
              </div>
            </div>
            <button
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold px-4 py-2 bg-blue-50 rounded-xl transition-colors"
              onClick={() =>
                navigate("/time", { state: { from: "/checkout" } })
              }
            >
              {language === "ar" ? "تعديل" : "Edit"}
            </button>
          </div>
        </div>

        {/* Customer Form */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "ar" ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                className={inputBase}
                placeholder={language === "ar" ? "أدخل اسمك" : "Enter your name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className="w-28 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-sm font-medium"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.code}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputBase} flex-1`}
                  type="tel"
                  placeholder={language === "ar" ? "رقم الهاتف" : "Phone number"}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={selectedCountry?.digits || 11}
                />
              </div>
              {!isPhoneValid && phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {language === "ar"
                    ? `يجب أن يكون ${selectedCountry?.digits || 11
                    } رقم على الأقل`
                    : `Phone must be ${selectedCountry?.digits || 11
                    } digits minimum`}
                </p>
              )}
            </div>
          </div>

          {orderType === "delivery" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "ar" ? "الشارع" : "Street"}
                </label>
                <input
                  className={inputBase}
                  placeholder={language === "ar" ? "اسم الشارع" : "Street name"}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "ar" ? "البلوك" : "Block"}
                </label>
                <input
                  className={inputBase}
                  placeholder={language === "ar" ? "رقم البلوك" : "Block #"}
                  value={block}
                  onChange={handleBlockChange}
                  type="text"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "ar" ? "رقم المنزل" : "House"}
                </label>
                <input
                  className={inputBase}
                  placeholder={language === "ar" ? "رقم المنزل" : "House #"}
                  value={house}
                  onChange={handleHouseChange}
                  type="text"
                  inputMode="numeric"
                />
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-4 mb-8 p-6 bg-gray-50 rounded-2xl">
          <div className="flex justify-between text-lg font-semibold text-gray-700">
            <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
            <span>{cartSubtotal.toFixed(3)} KWD</span>
          </div>

          {discountAmount > 0.001 && (
            <div className="flex justify-between text-lg font-semibold text-green-600">
              <span>
                {language === "ar" ? "الخصم" : "Discount"}
                {cartPromoData.promoCode && (
                  <span className="text-sm font-normal text-green-800 ml-1">
                    ({cartPromoData.promoCode})
                  </span>
                )}
              </span>
              <span>-{discountAmount.toFixed(3)} KWD</span>
            </div>
          )}

          {orderType === "delivery" && safeShippingCost > 0 && (
            <div className="flex justify-between text-lg font-semibold text-blue-600">
              <span>{language === "ar" ? "التوصيل" : "Shipping"}</span>
              <span>{safeShippingCost.toFixed(3)} KWD</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-2xl font-black">
              <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-green-600">
                {totalWithShipping.toFixed(3)} KWD
              </span>
            </div>
          </div>
        </div>

        <button
          className={`${buttonBase} ${isFormValid
            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          onClick={handleSaveAndNavigateToReview}
          disabled={!isFormValid}
        >
          {language === "ar" ? "مراجعة الطلب" : "Review Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
