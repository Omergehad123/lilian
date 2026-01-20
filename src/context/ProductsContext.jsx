import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ALL products (admin panel)
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://lilian-backend.onrender.com/api/products"
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch products`);
      }

      const data = await res.json();

      // ✅ SHOW ALL PRODUCTS (no filtering here)
      setProducts(data.data || []);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setError(error.message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ FIXED: Generate categories WITHOUT filtering products
  const processedData = useMemo(() => {
    if (products.length === 0) {
      return {
        categories: [{ key: "all", label: "All" }],
        filteredProducts: [],
      };
    }

    // Group ALL products by category (NO filtering)
    const categoryProductsMap = {};

    products.forEach((p) => {
      // ✅ USE actual category.en (exists in your data)
      const categoryName = p.category?.en || "Uncategorized";
      const key = categoryName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      if (key && key !== "uncategorized") {
        if (!categoryProductsMap[key]) {
          categoryProductsMap[key] = [];
        }
        categoryProductsMap[key].push(p);
      }
    });

    // Sort categories by FIRST product creation date (OLDEST first)
    const sortedCategories = Object.keys(categoryProductsMap)
      .map((catKey) => {
        const firstProduct = categoryProductsMap[catKey].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        )[0];

        const categoryName =
          firstProduct?.category?.en ||
          catKey.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

        return {
          key: catKey,
          label: categoryName,
          firstCreatedAt: firstProduct?.createdAt || 0,
        };
      })
      .sort((a, b) => new Date(a.firstCreatedAt) - new Date(b.firstCreatedAt));

    const newCategories = [
      { key: "all", label: "All" },
      ...sortedCategories.map((cat) => ({ key: cat.key, label: cat.label })),
    ];

    return {
      categories: newCategories,
      filteredProducts: products, // ALL products available
    };
  }, [products]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const value = {
    products: processedData.filteredProducts,
    categories: processedData.categories,
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
