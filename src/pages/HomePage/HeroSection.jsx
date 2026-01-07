import React from "react";
import Swipper from "./Swipper";
import { Link } from "react-router-dom";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaMotorcycle } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { useOrder } from "../../hooks/useOrder";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function HeroSection() {
  const { order, setOrderType } = useOrder();
  const { language } = useLanguage();
  const t = translations[language] || {};

  const dir = language === "ar" ? "rtl" : "ltr";

  const handleSelectType = (type) => {
    setOrderType(type);
  };

  const getLocationDisplay = () => {
    return (
      order?.shippingAddress?.locationKey ||
      order?.shippingAddress?.location ||
      t.chooseLocation ||
      (language === "ar" ? "اختر الموقع" : "Choose location")
    );
  };

  const getScheduleDisplay = () => {
    if (!order?.scheduledSlot) {
      return t.chooseTime || (language === "ar" ? "اختر الوقت" : "Choose time");
    }

    // ✅ تحقق من وجود date و startTime قبل الوصول ليهم
    if (!order.scheduledSlot.date || !order.scheduledSlot.startTime) {
      return t.chooseTime || (language === "ar" ? "اختر الوقت" : "Choose time");
    }

    return (
      <>
        {order.scheduledSlot.date.split("-").reverse().join("/")}
        <span className="ml-1">
          {order.scheduledSlot.startTime}-{order.scheduledSlot.endTime}
        </span>
      </>
    );
  };

  return (
    // wrapper with direction
    <div dir={dir} className={dir === "rtl" ? "rtl" : "ltr"}>
      <Swipper />

      {/* Mobile header */}
      <div className="flex lg:hidden items-center justify-between px-10 py-5 bg-white hover:bg-[#eee] border-b border-b-[#d2d2d2]">
        <div className="flex items-center gap-4">
          <img
            src="https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/lilyan-logo_n7koge.jpg"
            alt="Logo"
            className="w-[80px] object-contain"
          />
          <div className="text-start">
            <h1 className="font-bold capitalize text-xl">
              {t.heroTitle || "Lilian De Larose"}
            </h1>
            <p className="text-[#777] text-sm mt-1">
              {t.heroSubtitle || "Your slogan here"}
            </p>
          </div>
        </div>

        <Link to="/aboutUs">
          <IoMdInformationCircleOutline className="text-xl text-gray-600 hover:text-black" />
        </Link>
      </div>

      {/* Delivery / Pickup buttons */}
      <div className="flex items-center justify-center gap-5 my-5">
        <button
          onClick={() => handleSelectType("delivery")}
          className={`capitalize px-6 py-3 text-sm transition-all duration-200
            ${
              order?.orderType === "delivery"
                ? "border-b-2 border-black text-black font-semibold"
                : "border-b-0 text-gray-500 font-normal"
            }`}
        >
          {t.delivery || "Delivery"}
        </button>
        <button
          onClick={() => handleSelectType("pickup")}
          className={`capitalize px-6 py-3 text-sm transition-all duration-200
            ${
              order?.orderType === "pickup"
                ? "border-b-2 border-black text-black font-semibold"
                : "border-b-0 text-gray-500 font-normal"
            }`}
        >
          {t.pickup || "Pickup"}
        </button>
      </div>

      {/* Deliver to / earliest arrival */}
      <div className="flex flex-col gap-5 border-t border-t-[#d2d2d2] px-10 py-5 lg:w-[70%] w-[95%] mx-auto">
        {/* Deliver to */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="capitalize text-[#777] text-md">
              {t.deliverTo || "Deliver to"}
            </span>
            <div className="flex items-center gap-3">
              <FaMotorcycle className="text-[#777] text-xl" />
              <span className="capitalize text-black font-semibold text-md">
                {getLocationDisplay()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/orderMode"
              className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            >
              {t.edit || "Edit"}
            </Link>
          </div>
        </div>

        {/* Earliest arrival - المنطق مُصحح */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="capitalize text-[#777] text-md">
              {t.earliestArrival || "Earliest arrival"}
            </span>
            <div className="flex items-center gap-3">
              <FiClock className="text-[#777] text-xl" />
              <span className="capitalize text-black font-semibold text-md">
                {getScheduleDisplay()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/time"
              className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            >
              {t.edit || "Edit"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
