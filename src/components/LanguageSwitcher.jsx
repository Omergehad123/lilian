import React from "react";
import { useLanguage } from "../hooks/useLanguage";

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage("en")}
        className={language === "en" ? "font-bold underline" : ""}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage("ar")}
        className={language === "ar" ? "font-bold underline" : ""}
      >
        ع
      </button>
    </div>
  );
};

export default LanguageSwitcher;
