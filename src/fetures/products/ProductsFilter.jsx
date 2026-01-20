import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiList } from "react-icons/fi";
import { BiSortAlt2 } from "react-icons/bi";
import { IoIosArrowDown } from "react-icons/io";
import { useFilter } from "../../hooks/useFilter";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function SelectedIndicator() {
  return (
    <>
      <span
        className="absolute right-10"
        style={{
          background: "var(--second-color)",
          width: 8,
          height: 8,
          borderRadius: "100%",
          bottom: 4,
          display: "inline-block",
        }}
      />
      <span
        className="absolute -left-4"
        style={{
          background: "var(--second-color)",
          width: 6,
          height: 25,
          bottom: 0,
          display: "inline-block",
        }}
      />
    </>
  );
}

function ProductsFilter() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [t, setT] = useState({});

  const {
    filters,
    setSortFilter,
    setCategoryFilter,
    setPriceFilter,
    clearFilters,
  } = useFilter();

  const { language, changeLanguage } = useLanguage();

  // Safe translation getter
  const getTranslation = (key, fallback = key) => {
    return t[key] || translations[language]?.[key] || fallback;
  };

  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  const [localFilters, setLocalFilters] = useState({
    sort: { type: "", value: "" },
    category: "",
    price: 150,
  });
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  // Sync local filters with global when opening sidebar
  React.useEffect(() => {
    if (isSidebarOpen) {
      setLocalFilters(
        filters || {
          sort: { type: "", value: "" },
          category: "",
          price: 150,
        }
      );
    }
  }, [isSidebarOpen, filters]);

  const handleSortClick = (type, value) => {
    setLocalFilters((prev) => ({ ...prev, sort: { type, value } }));
  };

  const handleCategoryClick = (cat) => {
    const newCat = cat === localFilters.category ? "" : cat;
    setLocalFilters((prev) => ({ ...prev, category: newCat }));
  };

  const handlePriceSliderChange = (e) => {
    setLocalFilters((prev) => ({ ...prev, price: Number(e.target.value) }));
  };

  const handleApplyFilters = () => {
    // Apply local filters to global context
    setSortFilter(localFilters.sort.type, localFilters.sort.value);
    setCategoryFilter(localFilters.category);
    setPriceFilter(localFilters.price);
    closeSidebar();
  };
  const toggleCategoriesAccordion = () => setIsCategoriesOpen((prev) => !prev);
  const togglePriceAccordion = () => setIsPriceOpen((prev) => !prev);

  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");

  const hasFilters =
    localFilters.sort.type !== "" ||
    localFilters.category !== "" ||
    localFilters.price < 150;

  return (
    <div className="w-full bg-[#eee]" dir={dir}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] lg:w-[70%] w-[95%] mx-auto">
        <button
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-sm text-sm text-black font-semibold cursor-pointer hover:shadow-md transition-shadow"
          onClick={openSidebar}
        >
          {getTranslation("filterBtn", "Apply")} &{" "}
          {getTranslation("price", "Price")}
        </button>

        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all"
            onClick={openSidebar}
          >
            <BiSortAlt2 className="text-lg" />
          </button>
          <button
            className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all"
            onClick={openSidebar}
          >
            <FiList className="text-lg" />
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        <>
          <div
            className="fixed left-0 top-0 w-full h-full z-50 flex"
            style={{ pointerEvents: "auto" }}
          >
            <div className="bg-[#f9f9f9] h-full flex flex-col animate-slide-in w-[350px]">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] h-16 px-5 bg-white">
                <button onClick={closeSidebar}>
                  <FiArrowLeft className="text-2xl" />
                </button>
                <span className="font-semibold text-lg">
                  {getTranslation("filterBtn", "Filter")} &{" "}
                  {getTranslation("price", "Price")}
                </span>
                <button
                  className="flex items-center justify-center cursor-pointer pb-2"
                  type="button"
                  onClick={toggleLanguage}
                >
                  <span className="text-lg text-black">
                    {language === "en" ? "EN" : "ع"}
                  </span>
                </button>
              </div>

              <div className="overflow-y-auto h-[calc(100%-106px)] bg-[#eee]">
                {/* Sort Block */}
                <div className="mt-6 mb-5">
                  <div className="flex justify-between items-center mb-3 px-4">
                    <span className="font-semibold text-md text-[#3d3d3d]">
                      {getTranslation("price", "Price")} /{" "}
                      {getTranslation("name", "Name")} /{" "}
                      {getTranslation("date", "Date")}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[#999] text-sm cursor-pointer hover:text-black transition-colors"
                        onClick={() => {
                          clearFilters();
                        }}
                      >
                        clear
                      </button>
                      <BiSortAlt2 className="text-lg" />
                    </div>
                  </div>

                  <div className="space-y-3 bg-white p-4">
                    {/* Sort by price */}
                    <div className="space-y-3">
                      <div
                        className="flex items-center gap-20 relative cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => handleSortClick("price", "asc")}
                      >
                        <div className="text-md font-semibold">
                          {getTranslation("price", "Price")}
                        </div>
                        <div>
                          <span className="text-sm text-[#777] capitalize">
                            low to high
                          </span>
                          {localFilters.sort?.type === "price" &&
                            localFilters.sort?.value === "asc" && (
                              <SelectedIndicator />
                            )}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-20 relative cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => handleSortClick("price", "desc")}
                      >
                        <div className="text-md font-semibold">
                          {getTranslation("price", "Price")}
                        </div>
                        <div>
                          <span className="text-sm text-[#777] capitalize">
                            high to low
                          </span>
                          {localFilters.sort?.type === "price" &&
                            localFilters.sort?.value === "desc" && (
                              <SelectedIndicator />
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Sort by name */}
                    <div className="space-y-3">
                      <div
                        className="flex items-center gap-20 relative cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => handleSortClick("name", "asc")}
                      >
                        <div className="text-md font-semibold">
                          {getTranslation("name", "Name")}
                        </div>
                        <div>
                          <span className="text-sm text-[#777] capitalize">
                            A to Z
                          </span>
                          {localFilters.sort?.type === "name" &&
                            localFilters.sort?.value === "asc" && (
                              <SelectedIndicator />
                            )}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-20 relative cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => handleSortClick("name", "desc")}
                      >
                        <div className="text-md font-semibold">
                          {getTranslation("name", "Name")}
                        </div>
                        <div>
                          <span className="text-sm text-[#777] capitalize">
                            Z to A
                          </span>
                          {localFilters.sort?.type === "name" &&
                            localFilters.sort?.value === "desc" && (
                              <SelectedIndicator />
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Sort by date */}
                    <div className="space-y-3">
                      <div
                        className="flex items-center gap-20 relative cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => handleSortClick("date", "newest")}
                      >
                        <div className="text-md font-semibold">
                          {getTranslation("date", "Date")}
                        </div>
                        <div>
                          <span className="text-sm text-[#777] capitalize">
                            newest
                          </span>
                          {localFilters.sort?.type === "date" &&
                            localFilters.sort?.value === "newest" && (
                              <SelectedIndicator />
                            )}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-20 relative cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => handleSortClick("date", "oldest")}
                      >
                        <div className="text-md font-semibold">
                          {getTranslation("date", "Date")}
                        </div>
                        <div>
                          <span className="text-sm text-[#777] capitalize">
                            oldest
                          </span>
                          {localFilters.sort?.type === "date" &&
                            localFilters.sort?.value === "oldest" && (
                              <SelectedIndicator />
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Block */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-3 px-4">
                    <span className="font-semibold text-md text-[#3d3d3d]">
                      {getTranslation("categories", "Categories")}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[#999] text-sm cursor-pointer hover:text-black transition-colors"
                        onClick={() => {
                          clearFilters();
                        }}
                      >
                        clear
                      </button>
                      <FiList className="text-lg" />
                    </div>
                  </div>

                  <div className="space-y-3 bg-white p-4">
                    {/* Categories */}
                    <details className="mb-3" open={isCategoriesOpen}>
                      <summary
                        className="cursor-pointer py-3 px-2 font-semibold text-[#444] flex items-center justify-between text-base"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleCategoriesAccordion();
                        }}
                      >
                        {getTranslation("categories", "Categories")}
                        <span
                          className={`transition-transform ${
                            isCategoriesOpen ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <IoIosArrowDown />
                        </span>
                      </summary>
                      <div className="px-3 py-2 text-sm text-[#666]">
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {t?.categoryList?.map((cat) => {
                            const id = cat.key || cat.value || cat.label;
                            const label = cat.label || cat.name || String(id);

                            return (
                              <div
                                key={id}
                                className="flex items-center gap-4 relative cursor-pointer py-2 px-1 group hover:bg-gray-50 rounded transition-colors"
                                style={{ transition: "background 0.1s" }}
                                onClick={() => handleCategoryClick(id)}
                              >
                                <span className="text-md font-medium capitalize">
                                  {label}
                                </span>
                                <div className="flex-1" />
                                {localFilters.category === id && (
                                  <SelectedIndicator />
                                )}
                              </div>
                            );
                          }) || (
                            <div className="text-gray-500 p-4">
                              No categories
                            </div>
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Price */}
                    <details className="mb-3" open={isPriceOpen}>
                      <summary
                        className="cursor-pointer py-3 px-2 font-semibold text-[#444] flex items-center justify-between text-base"
                        onClick={(e) => {
                          e.preventDefault();
                          togglePriceAccordion();
                        }}
                      >
                        {getTranslation("price", "Price")}
                        <span
                          className={`transition-transform ${
                            isPriceOpen ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <IoIosArrowDown />
                        </span>
                      </summary>
                      <div className="px-3 py-2 text-sm text-[#666]">
                        <div className="flex flex-col gap-2">
                          <div
                            className="flex items-center gap-4 relative py-2 px-1 group hover:bg-gray-50 rounded transition-colors"
                            style={{ transition: "background 0.1s" }}
                          >
                            <span className="text-md font-medium capitalize">
                              up to&nbsp;
                              <span style={{ color: "var(--second-color)" }}>
                                {localFilters.price}
                              </span>
                            </span>
                            <div className="flex-1" />
                            {localFilters.price < 150 && <SelectedIndicator />}
                          </div>
                          <div className="flex items-center gap-3 px-1 pt-1">
                            <input
                              type="range"
                              min={0}
                              max={150}
                              value={localFilters.price}
                              onChange={handlePriceSliderChange}
                              className="w-full accent-blue-500" // fallback color
                              style={{ height: "4px" }}
                            />
                            <span className="text-xs text-[#888] w-8 text-right">
                              {localFilters.price}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-[#888] pl-1 pr-6 leading-none">
                            <span>0</span>
                            <span>150</span>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="px-4 py-3 bg-white border-t border-[#e5e5e5]">
                <button
                  className={`w-full py-3 rounded-lg text-white font-bold text-md transition-all shadow-md ${
                    hasFilters
                      ? "bg-blue-600 hover:bg-blue-700 cursor-pointer hover:shadow-lg"
                      : "bg-gray-400 opacity-60 cursor-not-allowed"
                  }`}
                  onClick={handleApplyFilters}
                  disabled={!hasFilters}
                >
                  {getTranslation("filterBtn", "Apply Filters")}{" "}
                  {hasFilters ? "✓" : ""}
                </button>
              </div>
            </div>

            {/* Overlay */}
            <div
              className="flex-1 h-full"
              style={{
                background: "#000",
                opacity: 0.3,
                transition: "opacity 0.2s",
              }}
              onClick={closeSidebar}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProductsFilter;
