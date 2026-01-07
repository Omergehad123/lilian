import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import { FaArrowLeft } from "react-icons/fa";

import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

const Register = () => {
  const navigate = useNavigate();

  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [page, setPage] = useState("signup");

  const handleBack = () => {
    navigate(-1);
  };

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <div dir={dir}>
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-b-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
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

      {/* tabs */}
      <div className="flex items-center gap-5 mx-5 mt-5 mb-10">
        <button
          className={`${
            page === "login"
              ? "text-white bg-[#0099cc]"
              : "border border-[#0099CC] text-[#0099CC] bg-transparent"
          } py-2 capitalize w-[48%] rounded-md cursor-pointer transition duraiton-300`}
          onClick={() => setPage("login")}
        >
          {t.loginLabel || (language === "ar" ? "تسجيل الدخول" : "login")}
        </button>
        <button
          className={`${
            page === "signup"
              ? "text-white bg-[#0099cc]"
              : "border border-[#0099CC] text-[#0099CC] bg-transparent"
          } py-2 capitalize w-[48%] rounded-md cursor-pointer transition duraiton-300`}
          onClick={() => setPage("signup")}
        >
          {t.signupLabel || (language === "ar" ? "إنشاء حساب" : "signup")}
        </button>
      </div>

      {page === "login" && <Login />}
      {page === "signup" && <Signup />}
    </div>
  );
};

export default Register;
