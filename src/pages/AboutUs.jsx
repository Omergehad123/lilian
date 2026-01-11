// pages/AboutUs.jsx
import React from "react";
import { FaInstagram, FaWhatsapp, FaPhone, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import translations from "../utils/translations";

const AboutUs = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const handleBack = () => {
    navigate(-1);
  };
  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <div className="min-h-screen px-4" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">{t.about}</h1>
        <button
          className="flex items-center justify-center cursor-pointer pb-2"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "EN" : "ع"}
          </span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-10">
        {/* Logo */}
        <div className="mx-auto rounded-2xl flex items-center justify-center mb-8">
          <img
            src="https://res.cloudinary.com/dbfty465x/image/upload/v1767792745/logo-2_oj8zhp.png"
            alt="Lilyan Logo"
            className="w-[250px] object-contain rounded-xl shadow-lg"
          />
        </div>

        {/* Subtitle */}
        <div className="text-md text-gray-700 mb-12 leading-relaxed">
          <p>{t.aboutDescription1}</p>
          <p className="mt-4">{t.aboutDescription2}</p>
          <p className="mt-4">{t.aboutDescription3}</p>
        </div>

        {/* Store Location Text */}
        <div className="mb-12">
          <h2 className="font-semibold text-lg mb-4">
            {language === "ar" ? "موقع المتجر" : "Store Location"}
          </h2>
          <div className="p-4 bg-gray-100 rounded-xl border border-gray-200 text-base font-medium text-gray-800" style={{ direction: "rtl" }}>
            حولى شارع عبداللطيف العثمان المتفرع من شارع بيروت مجمع غنيمة محل رقم 9
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
