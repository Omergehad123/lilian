import React, { useState, useMemo, useCallback, useEffect } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";

import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../hooks/useCart";
import { useFilter } from "../../hooks/useFilter";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProductsSection() {
  const [openCategory, setOpenCategory] = useState(null);
  const [openAccordions, setOpenAccordions] = useState({});
  const [productMessages, setProductMessages] = useState({});
  const [t, setT] = useState({});

  const { addToCart } = useCart();
  const { products, categories: uiCategories, isLoading } = useProducts();
  const { filters } = useFilter();
  const { language } = useLanguage();

  const navigate = useNavigate();

  const getTranslation = (key, fallback = key) => {
    return t[key] || translations[language]?.[key] || fallback;
  };

  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  // 🔥 UPDATED: Dynamic displayLang function for product names/categories
  const displayLang = useCallback(
    (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      return val[language] || val.en || val.ar || "";
    },
    [language]
  );

  // 🔥 Filter ONLY available products for customers
  const filteredProducts = useMemo(() => {
    let result = Array.isArray(products)
      ? products.filter((product) => product.isAvailable !== false)
      : [];

    // 1. Category filter
    if (filters?.category && filters.category !== "all") {
      result = result.filter((product) => {
        const productCategory =
          product.categoryKey ||
          (product.category &&
            product.category.en?.toLowerCase().replace(/\s+/g, "-"));
        return productCategory === filters.category;
      });
    }

    // 2. Price filter
    if (filters?.price && filters.price < 150) {
      result = result.filter(
        (product) =>
          (product.actualPrice || product.price || 0) <= filters.price
      );
    }

    // 3. Sort
    if (filters?.sort?.type) {
      result.sort((a, b) => {
        const aPrice = a.actualPrice || a.price || 0;
        const bPrice = b.actualPrice || b.price || 0;
        const aName = displayLang(a.name)?.toLowerCase() || "";
        const bName = displayLang(b.name)?.toLowerCase() || "";
        const aDate = new Date(a.createdAt || a.date || 0).getTime();
        const bDate = new Date(b.createdAt || b.date || 0).getTime();

        switch (`${filters.sort.type}-${filters.sort.value}`) {
          case "price-asc":
            return aPrice - bPrice;
          case "price-desc":
            return bPrice - aPrice;
          case "name-asc":
            return aName.localeCompare(bName);
          case "name-desc":
            return bName.localeCompare(aName);
          case "date-newest":
            return bDate - aDate;
          case "date-oldest":
            return aDate - bDate;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [products, filters, displayLang]);

  // 🔥 UPDATED: Use filteredProducts for dynamic categorization
  const productsByCategory = useMemo(() => {
    const map = {};
    filteredProducts.forEach((product) => {
      let key = "uncategorized";

      if (product.categoryKey) {
        key = String(product.categoryKey);
      } else if (product.category && product.category.en) {
        key = product.category.en.toLowerCase().replace(/\s+/g, "-");
      }

      if (!map[key]) map[key] = [];
      map[key].push(product);
    });
    return map;
  }, [filteredProducts]);

  // 🔥 DYNAMIC VISIBLE CATEGORIES - No hardcoded uiCategories!
  const visibleCategories = useMemo(() => {
    if (!uiCategories || !openCategory || openCategory === "all") {
      return uiCategories.filter((c) => c.key !== "all");
    }
    return uiCategories.filter((c) => c.key === openCategory);
  }, [uiCategories, openCategory]);

  const handleMessageChange = useCallback((productId, message) => {
    setProductMessages((prev) => ({
      ...prev,
      [productId]: message,
    }));
  }, []);

  const handleAddToCart = useCallback(
    (product) => {
      const productId = product._id || product.id || product.slug;
      const currentMessage = productMessages[productId] || "";

      addToCart({
        ...product,
        id: productId,
        price: product.actualPrice,
        quantity: 1,
        message: currentMessage,
      });

      toast.success(
        `${displayLang(product.name)} ${getTranslation(
          "addedToCart",
          "added to cart!"
        )}`,
        {
          position: language === "ar" ? "top-left" : "top-right",
          autoClose: 2200,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          progress: undefined,
          rtl: language === "ar",
        }
      );
    },
    [addToCart, productMessages, displayLang, getTranslation, language]
  );

  const handleBuyNow = useCallback(
    (product) => {
      const productId = product._id || product.id || product.slug;
      const currentMessage = productMessages[productId] || "";

      addToCart({
        ...product,
        id: productId,
        price: product.actualPrice,
        quantity: 1,
        message: currentMessage,
      });

      toast.success(
        `${displayLang(product.name)} ${getTranslation(
          "addedToCart",
          "added to cart!"
        )} ${getTranslation("goToCart", "Redirecting to cart...")}`,
        {
          position: language === "ar" ? "top-left" : "top-right",
          autoClose: 1200,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          progress: undefined,
          rtl: language === "ar",
        }
      );

      setTimeout(() => {
        navigate("/cart");
      }, 1200);
    },
    [
      addToCart,
      productMessages,
      displayLang,
      getTranslation,
      language,
      navigate,
    ]
  );

  // Open all accordions if "all" is selected
  useEffect(() => {
    if (openCategory === "all" || openCategory === null) {
      const newOpenAccordions = {};
      uiCategories.forEach(({ key }) => {
        if (key !== "all") newOpenAccordions[key] = true;
      });
      setOpenAccordions(newOpenAccordions);
    } else {
      setOpenAccordions({});
    }
  }, [openCategory, uiCategories]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center px-2" dir={dir}>
        {/* Skeleton loading states remain exactly the same */}
        <div className="lg:w-[70%] w-[95%] overflow-hidden mb-10">
          <div
            className="flex py-8 flex-nowrap overflow-x-scroll hide-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center mx-2 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-3xl my-10 space-y-4">
          {Array.from({ length: 3 }).map((_, catIndex) => (
            <div key={catIndex} className="rounded-sm overflow-hidden">
              <div className="flex justify-center items-center gap-2 p-3 bg-[#eee] animate-pulse">
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              </div>
              <div className="py-4 grid gap-10 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 animate-pulse">
                {Array.from({ length: 4 }).map((_, productIndex) => (
                  <div
                    key={productIndex}
                    className="w-full max-w-xs sm:max-w-[250px] h-auto mx-auto px-2 flex flex-col"
                  >
                    <div className="w-full h-[200px] sm:h-[250px] bg-gray-200 rounded-lg mx-auto"></div>
                    <div className="flex flex-col mt-5 flex-1 justify-between gap-3">
                      <div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded mb-3"></div>
                        <div className="flex gap-2">
                          <div className="h-3 w-10 bg-gray-200 rounded-sm"></div>
                          <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div>
                        <div className="h-10 w-full bg-gray-200 rounded-md mb-1"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-10 w-full bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MAIN CONTENT
  return (
    <div className="w-full flex flex-col items-center px-2" dir={dir}>
      <ToastContainer />

      {/* Filter Status */}
      {Object.values(filters || {}).some(
        (f) => f !== "" && f?.type !== "" && f !== 150
      ) && (
        <div className="w-full lg:w-[70%] w-[95%] bg-blue-100 border border-blue-200 text-blue-800 px-4 py-2 mb-4 rounded-md text-sm">
          <span>{getTranslation("filtersApplied", "Filters applied")}:</span>
          {filters?.category && filters.category !== "all" && (
            <span className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs">
              {uiCategories.find((c) => c.key === filters.category)?.label ||
                filters.category}
            </span>
          )}
          {filters?.price && filters.price < 150 && (
            <span className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs">
              ≤ {filters.price} KW
            </span>
          )}
          {filters?.sort?.type && (
            <span className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs">
              {filters.sort.type} ({filters.sort.value})
            </span>
          )}
        </div>
      )}

      {/* 🔥 DYNAMIC CATEGORIES STRIP */}
      <div className="lg:w-[70%] w-[95%] overflow-hidden">
        <div
          className="flex py-8 flex-nowrap overflow-x-scroll hide-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {uiCategories.map(({ key, label }) => {
            const isSelected = openCategory === key;
            const textColor = isSelected ? "#000" : "#ddd";
            const borderColor = isSelected ? "#000" : "#ddd";

            return (
              <div
                key={key}
                className="flex flex-col items-center cursor-pointer select-none min-w-[90px]"
                style={{ color: textColor }}
                onClick={() => setOpenCategory(isSelected ? null : key)}
              >
                <div
                  className="rounded-full p-2 mb-2 flex items-center justify-center"
                  style={{
                    border: `2px solid ${borderColor}`,
                    transition: "border-color .2s",
                  }}
                >
                  <img
                    src="https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/lilyan-logo_n7koge.jpg"
                    alt={label}
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "contain",
                      borderRadius: "100%",
                    }}
                  />
                </div>
                <span
                  className="text-center text-xs font-medium capitalize"
                  style={{
                    color: textColor,
                    transition: "color .2s",
                    maxWidth: 110,
                    wordBreak: "break-word",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-full max-w-3xl my-10 space-y-4">
        {visibleCategories.map(({ key, label }) => {
          const isOpen = !!openAccordions[key];
          const productsForCat =
            key === "all" ? filteredProducts : productsByCategory[key] || [];

          if (!productsForCat.length) return null;

          return (
            <div
              key={key}
              className="rounded-sm overflow-hidden transition-all"
            >
              <div
                className="flex justify-center items-center gap-2 p-3 cursor-pointer bg-[#eee] hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setOpenAccordions((prev) => {
                    const next = { ...prev, [key]: !prev[key] };
                    return next;
                  });
                }}
              >
                <h3 className="font-semibold capitalize">{label}</h3>
                <span>{isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}</span>
              </div>

              <div
                className={`transition-all duration-300 
                  grid gap-10
                  ${isOpen ? "min-h-[150px] py-4" : "max-h-0 p-0"}
                  overflow-hidden
                  grid-cols-2
                  sm:grid-cols-2
                  md:grid-cols-2
                `}
              >
                {productsForCat.map((product) => {
                  const productId = product._id || product.id || product.slug;
                  const currentMessage = productMessages[productId] || "";

                  return (
                    <div
                      key={productId}
                      className="w-full max-w-xs sm:max-w-[250px] h-auto mx-auto px-2 flex flex-col"
                    >
                      <Link to={`/products/${product.slug}`}>
                        <img
                          src={
                            product.image
                              ? product.image.startsWith("http")
                                ? product.image
                                : `/products/${product.image}`
                              : "./products/product1.jpg"
                          }
                          alt={displayLang(product.name)}
                          className="w-full min-w-0 max-w-xs sm:max-w-[250px] mx-auto h-[200px] sm:h-[250px] object-cover rounded-lg"
                        />
                      </Link>

                      <div className="flex flex-col mt-5 flex-1 justify-between gap-3">
                        <div>
                          <h1 className="font-semibold text-sm leading-tight">
                            {displayLang(product.name)}
                          </h1>
                          <p className="text-gray-500 text-xs mt-1">
                            {getTranslation(
                              "preparationTimeLabel",
                              "Preparation time"
                            )}{" "}
                            {getTranslation("preparationTimeValue", "2 hours")}
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            {product.price &&
                            product.price !== product.actualPrice ? (
                              <>
                                <span className="line-through mr-2 text-xs">
                                  {product.price},000 kw
                                </span>
                                <span className="font-semibold text-lg text-green-600">
                                  {product.actualPrice},000 kw
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-lg">
                                {product.actualPrice},000 kw
                              </span>
                            )}
                          </p>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder={
                              language === "ar"
                                ? "رسالة اختيارية للطلب..."
                                : "Optional message for this order..."
                            }
                            value={currentMessage}
                            onChange={(e) =>
                              handleMessageChange(productId, e.target.value)
                            }
                            className="w-full p-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 bg-white"
                            maxLength={100}
                          />
                          {currentMessage && (
                            <span className="text-xs text-gray-400 block mt-1">
                              {currentMessage.length}/100
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="rounded-md w-full sm:w-[150px] py-2 border border-gray-300 font-bold text-xs capitalize text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex-1 shadow-sm hover:shadow-md"
                          >
                            {getTranslation("addToCartLabel", "Add to cart")}
                          </button>
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="rounded-md w-full sm:w-[150px] py-2 border border-green-400 font-bold text-xs capitalize text-green-600 hover:bg-green-50 hover:border-green-500 transition-all duration-200 flex-1 shadow-sm hover:shadow-md"
                          >
                            {getTranslation("buyNowLabel", "Buy Now")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* No products message */}
        {filteredProducts.length === 0 && (
          <div className="w-full lg:w-[70%] text-center py-20">
            <div className="text-gray-400 text-lg mb-4">
              {getTranslation("noProducts", "لا توجد منتجات")}
            </div>
            <button
              onClick={() => {
                setOpenCategory(null);
                setOpenAccordions({});
              }}
              className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              {getTranslation("showAll", "إظهار الكل")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsSection;
