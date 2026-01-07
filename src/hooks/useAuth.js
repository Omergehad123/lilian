import { useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
export const useAuth = () => {
  const context = useContext(AuthContext);

  return context;
};
