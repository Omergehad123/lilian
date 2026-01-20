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
    <div dir={dir} className={dir === "rtl" ? "rtl" : "ltr"} style={{position: "relative"}}>
      {/* Sticky WhatsApp icon button */}
      <a
        href="https://wa.me/96566222686"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          background: "#25D366",
          color: "#fff",
          padding: "12px",
          borderTopLeftRadius: "24px",
          borderBottomLeftRadius: "24px",
          fontWeight: "bold",
          fontSize: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          textDecoration: "none"
        }}
        aria-label="Contact us on WhatsApp"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          style={{flexShrink: 0}}
        >
          <path d="M16.002 2.667c-7.362 0-13.334 6.008-13.334 13.417 0 2.364.634 4.661 1.836 6.674L2.668 29.335l6.753-1.755c1.963 1.072 4.178 1.643 6.58 1.643 7.362 0 13.334-6.008 13.334-13.417S23.364 2.667 16.002 2.667zm-.006 24.001c-2.096 0-4.143-.558-5.933-1.616l-.423-.249-4.013 1.042 1.073-3.91-.277-.43c-1.156-1.739-1.767-3.761-1.767-5.84 0-6.114 4.951-11.09 11.063-11.09 6.112 0 11.063 4.976 11.063 11.09.001 6.114-4.95 11.091-11.062 11.091zm6.068-8.365c-.328-.164-1.946-.959-2.247-1.072-.301-.111-.52-.166-.738.164-.22.329-.847 1.072-1.04 1.292-.191.22-.383.247-.711.082-.328-.164-1.385-.511-2.641-1.629-.976-.87-1.635-1.943-1.828-2.271-.192-.329-.02-.505.146-.667.15-.147.329-.382.494-.573.167-.195.225-.329.338-.548.109-.219.054-.411-.027-.573-.082-.164-.738-1.777-1.012-2.421-.267-.639-.538-.552-.738-.561-.192-.01-.409-.012-.627-.012-.218 0-.572.082-.873.38-.301.299-1.145 1.119-1.145 2.728 0 1.611 1.172 3.169 1.336 3.387.164.219 2.308 3.528 5.594 4.563.782.23 1.391.367 1.865.48.784.19 1.498.163 2.068.1.632-.071 1.946-.792 2.223-1.557.274-.763.274-1.417.192-1.557-.08-.14-.299-.223-.627-.385z"/>
        </svg>
      </a>
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
