// OrderMode.jsx
import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../hooks/useOrder";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function OrderMode() {
  const navigate = useNavigate();
  const { setOrderType, setShippingAddress, areas, order, cityKeys } =
    useOrder();
  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  const [mode, setMode] = useState("delivery");
  const [openCity, setOpenCity] = useState(null);
  const [search, setSearch] = useState("");

  // selected from order
  const selectedCityKey = order?.shippingAddress?.cityKey || "";
  const selectedAreaName = order?.shippingAddress?.areaName || "";

  const handleBack = () => navigate(-1);

  const handleSelectLocation = (cityKey, areaName) => {
    const locationKey = `${cityKey}:${areaName}`; // stable
    setOrderType(mode);
    setShippingAddress({
      cityKey,
      areaName,
      locationKey,
      // keep old string if you still use it elsewhere
      location: `${t.governorates?.[cityKey] || cityKey} - ${areaName}`,
    });
    navigate(-1);
  };

  const searchQuery = search.toLowerCase();

  // governorates + areas with labels from translations
  const visibleCities = (cityKeys || []).flatMap((cityKey) => {
    const cityLabel = t.governorates?.[cityKey] || cityKey;

    // if translated areas exist, use them; otherwise fall back to context areas
    const translatedAreas = t.areas?.[cityKey];
    const baseAreas = translatedAreas || areas[cityKey] || [];

    if (!searchQuery.trim()) {
      return [
        {
          cityKey,
          cityLabel,
          matchingAreas: baseAreas,
        },
      ];
    }

    const cityMatch = cityLabel.toLowerCase().includes(searchQuery);
    const filteredAreas = baseAreas.filter((area) =>
      area.toLowerCase().includes(searchQuery)
    );

    if (!cityMatch && filteredAreas.length === 0) return [];
    return [
      {
        cityKey,
        cityLabel,
        matchingAreas: cityMatch ? baseAreas : filteredAreas,
      },
    ];
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-semibold text-lg">
          {language === "ar" ? "وضع الطلب" : "order mode"}
        </p>
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

      {/* Tabs */}
      <div className="bg-white">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode("delivery")}
            className={`flex-1 text-center py-3 font-medium ${
              mode === "delivery"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-500"
            }`}
          >
            {t.delivery}
          </button>
          <button
            onClick={() => setMode("pickup")}
            className={`flex-1 text-center py-3 font-medium ${
              mode === "pickup"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-500"
            }`}
          >
            {t.pickup}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === "ar"
                ? "ابحث عن المدن والمناطق"
                : "Search for cities and areas"
            }
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Cities & Areas list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {visibleCities.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            {language === "ar" ? "لا توجد نتائج" : "No results found"}
          </div>
        )}

        {visibleCities.map(({ cityKey, cityLabel, matchingAreas }) => (
          <div key={cityKey} className="mb-2">
            <button
              onClick={() =>
                setOpenCity((prev) => (prev === cityKey ? null : cityKey))
              }
              className="w-full flex items-center justify-between bg-[#eee] rounded-lg px-4 py-3 shadow-sm gap-3"
            >
              <span className="text-sm font-bold text-gray-800 capitalize">
                {cityLabel}
              </span>
              <IoIosArrowDown
                className={`text-gray-500 transition-transform ${
                  openCity === cityKey ? "rotate-180" : ""
                }`}
              />
            </button>

            {(openCity === cityKey || searchQuery) &&
              matchingAreas.length > 0 && (
                <div className="mt-1 ml-3">
                  {matchingAreas.map((area) => {
                    const isSelected =
                      selectedCityKey === cityKey && selectedAreaName === area;
                    return (
                      <button
                        key={area}
                        onClick={() => handleSelectLocation(cityKey, area)}
                        className="capitalize w-full text-left bg-white text-sm text-gray-700 border-b border-b-gray-300 hover:bg-gray-100 flex items-center cursor-pointer"
                      >
                        {isSelected && (
                          <span className="inline-block w-2.5 h-11 bg-black"></span>
                        )}
                        <span className="px-4 py-3">{area}</span>
                      </button>
                    );
                  })}
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderMode;
