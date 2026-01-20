import { useContext } from "react";
import ProductsContext from "../context/ProductsContext";
export const useProducts = () => {
  const context = useContext(ProductsContext);

  return context;
};

