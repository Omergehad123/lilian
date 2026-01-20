import React from "react";
import { useLanguage } from "../hooks/useLanguage";

const RootLayout = ({ children }) => {
  const { language } = useLanguage();
  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className={dir === "rtl" ? "rtl" : "ltr"}>
      {children}
    </div>
  );
};

export default RootLayout;
