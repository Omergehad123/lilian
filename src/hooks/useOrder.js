import { useContext } from "react";
import orderContext from "../context/OrderContext";
export const useOrder = () => {
  const context = useContext(orderContext);

  return context;
};
