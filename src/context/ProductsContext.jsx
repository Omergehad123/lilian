import React, { createContext, useState, useEffect } from "react";

const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [categories] = useState([
    "all",
    "new",
    "flower stands",
    "arrangements",
    "hand bouquets",
    "Lilyan Gift’s Box",
    "Flowers Arrangements",
    "New Collection",
    "flowers & chocolate",
    "flower and choco",
    "flower and money box",
    "eid",
    "flower trays",
    "vases",
    "orchid only",
  ]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          "https://lilian-backend.onrender.com/api/products"
        );
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();

        setProducts(data.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, categories }}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContext;
