// LanguageContext.jsx
import React, { createContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Run only in browser
    try {
      const saved = localStorage.getItem("lang");
      if (saved) setLanguage(saved);
    } catch (e) {
      // ignore if localStorage not available
    }
    setIsReady(true);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem("lang", lang);
    } catch (e) {}
  };

  if (!isReady) {
    // Optional: avoid flashing wrong language
    return null; // or a small loader
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
