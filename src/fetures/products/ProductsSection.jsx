import React, { useState, useMemo, useCallback, useEffect } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link } from "react-router-dom";

import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../hooks/useCart";
import { useFilter } from "../../hooks/useFilter";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function ProductsSection() {
  const [openCategory, setOpenCategory] = useState(null);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [productMessages, setProductMessages] = useState({});
  const [t, setT] = useState({});

  const { addToCart } = useCart();
  const { products } = useProducts();
  const { filters } = useFilter();

  const { language, changeLanguage } = useLanguage();

  // Safe translation system ✅
  const getTranslation = (key, fallback = key) => {
    return t[key] || translations[language]?.[key] || fallback;
  };

  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  // Safe categoryList ✅
  const uiCategories =
    t.categoryList || translations[language]?.categoryList || [];

  // helper: read field according to current language
  const displayLang = useCallback(
    (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      return val[language] || val.en || val.ar || "";
    },
    [language]
  );

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = Array.isArray(products) ? [...products] : [];

    // 1. Category filter
    if (filters?.category) {
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

  // Map filtered products into categories by a stable key
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

  // visible categories: all (except "all") or a single selected key
  const visibleCategories =
    !openCategory || openCategory === "all"
      ? uiCategories.filter((c) => c.key !== "all")
      : uiCategories.filter((c) => c.key === openCategory);

  // Handle message change لمنتج معين
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
    },
    [addToCart, productMessages]
  );

  return (
    <div className="w-full flex flex-col items-center px-2" dir={dir}>
      {/* Filter Status */}
      {Object.values(filters || {}).some(
        (f) => f !== "" && f?.type !== "" && f !== 150
      ) && (
        <div className="w-full lg:w-[70%] w-[95%] bg-blue-100 border border-blue-200 text-blue-800 px-4 py-2 mb-4 rounded-md text-sm">
          <span>{getTranslation("filtersApplied", "Filters applied")}:</span>
          {filters?.category && (
            <span className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs">
              {uiCategories.find((c) => c.key === filters.category)?.label ||
                filters.category}
            </span>
          )}
          {filters?.price && filters.price < 150 && (
            <span className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs">
              ≤ {filters.price} KWD
            </span>
          )}
          {filters?.sort?.type && (
            <span className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs">
              {filters.sort.type} ({filters.sort.value})
            </span>
          )}
        </div>
      )}

      {/* Categories strip */}
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
                    src="./lilyan-logo.jpg"
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
          const isOpen = openAccordion === key;
          const productsForCat =
            key === "all" ? filteredProducts : productsByCategory[key] || [];

          if (!productsForCat.length) return null;

          return (
            <div
              key={key}
              className="rounded-sm overflow-hidden transition-all"
            >
              {/* Accordion header */}
              <div
                className="flex justify-center items-center gap-2 p-3 cursor-pointer bg-[#eee] hover:bg-gray-100 transition-colors"
                onClick={() => setOpenAccordion(isOpen ? null : key)}
              >
                <h3 className="font-semibold capitalize">{label}</h3>
                <span>{isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}</span>
              </div>

              {/* Products list */}
              <div
                className={`transition-all duration-300 flex items-center justify-between flex-wrap ${
                  isOpen ? "min-h-[150px] py-4" : "max-h-0 p-0"
                } overflow-hidden`}
              >
                {productsForCat.map((product) => {
                  const productId = product._id || product.id || product.slug;
                  const currentMessage = productMessages[productId] || "";

                  return (
                    <div
                      key={productId}
                      className="py-2 w-[350px] px-5 h-[500px] flex flex-col"
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
                          className="w-[250px] mx-auto h-[250px] object-cover rounded-lg"
                        />
                      </Link>

                      <div className="flex flex-col gap-2 mt-5 flex-1 justify-between">
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
                                  {product.price},000 kwd
                                </span>
                                <span className="font-semibold text-lg text-green-600">
                                  {product.actualPrice},000 kwd
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-lg">
                                {product.actualPrice},000 kwd
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Message Input */}
                        <div className="mt-3">
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

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-3 mt-auto">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="rounded-md w-[150px] py-2 border border-gray-300 font-bold text-xs capitalize text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex-1 shadow-sm hover:shadow-md"
                          >
                            {getTranslation("addToCartLabel", "Add to cart")}
                          </button>
                          <Link
                            to={`/products/${product.slug}`}
                            className="rounded-md w-[150px] py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs capitalize text-center transition-all duration-300 flex-1 shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            {getTranslation("buyNowLabel", "Buy now")}
                          </Link>
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
                setOpenAccordion(null);
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
