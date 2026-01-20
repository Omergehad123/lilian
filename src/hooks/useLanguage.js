import { useContext } from "react";
import LanguageContext from "../context/LanguageContext";
export const useLanguage = () => {
  const context = useContext(LanguageContext);

  return context;
};

