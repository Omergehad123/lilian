import React, { createContext, useState, useEffect, useCallback } from "react";

const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [categories] = useState([
    "all",
    "new",
    "flower stands",
    "arrangements",
    "hand bouquets",
    "Lilyan Gift's Box",
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Memoized fetch function
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/products"
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch products`);
      }

      const data = await res.json();

      setProducts(data.data || []);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setError(error.message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manual refresh
  const refreshProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const value = {
    products,
    categories,
    isLoading,
    error,
    refreshProducts,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContext;
