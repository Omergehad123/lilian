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
      console.log("🔄 Fetching products...");
      const res = await fetch(
        "https://lilian-backend.onrender.com/api/products"
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch products`);
      }

      const data = await res.json();
      console.log("✅ Products loaded:", data.data?.length || 0);

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
    console.log("🔄 Manual refresh triggered");
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
