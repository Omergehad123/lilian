import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useLanguage } from "../hooks/useLanguage";
import translations from "../utils/translations";

function Search() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { products } = useProducts();

  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const handleBack = () => {
    navigate(-1);
  };

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  // UI texts (fallback to hard‑coded if some keys are missing in translations)
  const title = t.searchTitle || (language === "en" ? "Search" : "بحث");
  const placeholder =
    t.searchPlaceholder ||
    (language === "en" ? "Search for a product..." : "ابحث عن منتج...");
  const itemsLabel =
    t.searchItems || (language === "en" ? "Items" : "المنتجات");
  const noProductsText =
    t.searchNoProducts ||
    (language === "en" ? "No products found." : "لا توجد منتجات.");

  // helper for product name (supports {en, ar} or plain string)
  const displayName = (name) => {
    if (!name) return t.productFallback || "Product";
    if (typeof name === "string") return name;
    return (
      name[language] || name.en || name.ar || t.productFallback || "Product"
    );
  };

  // Filter with new returned object structure – search in both languages
  let filteredProducts = [];
  if (search.trim().length > 0 && Array.isArray(products)) {
    filteredProducts = products.filter((product) => {
      const nameEn = product?.name?.en?.toLowerCase?.() || "";
      const nameAr = product?.name?.ar?.toLowerCase?.() || "";
      const searchValue = search.trim().toLowerCase();
      return nameEn.includes(searchValue) || nameAr.includes(searchValue);
    });
  }

  return (
    <div className="bg-[#eee]" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>

        <h1 className="capitalize font-semibold text-lg">{title}</h1>

        <button
          className="flex items-center justify-center cursor-pointer"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "EN" : "ع"}
          </span>
        </button>
      </div>

      {/* Search input */}
      <div className="px-3 my-4">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex flex-col gap-1 py-5">
          <h1 className="text-gray-600 capitalize px-3 font-semibold">
            {itemsLabel}
          </h1>

          <div className="bg-white py-7 pl-3 pr-20 flex flex-col gap-5 min-h-[9rem]">
            {search.trim().length > 0 ? (
              filteredProducts.length > 0 ? (
                <div className="flex flex-col gap-4 w-full">
                  {filteredProducts.map((item) => {
                    const id = item._id || item.id || item.slug;
                    return (
                      <Link to={`/products/${item.slug}`} key={id}>
                        <div className="flex justify-between items-center w-full px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={
                                displayName(item.name) ||
                                (language === "en" ? "product" : "منتج")
                              }
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-black">
                                {displayName(item.name)}
                              </span>

                              <span className="text-gray-500 text-sm mb-2 uppercase font-semibold">
                                {item.price !== undefined
                                  ? `${item.price} kw`
                                  : item.actualPrice !== undefined
                                  ? `${item.actualPrice} kw`
                                  : language === "en"
                                  ? "No price"
                                  : "لا يوجد سعر"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-center w-full pt-10">
                  {noProductsText}
                </div>
              )
            ) : (
              // Show nothing before search
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;
