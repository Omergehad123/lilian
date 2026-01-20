import React, { useState } from "react";
import { FaArrowLeft, FaToggleOn } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../hooks/useOrder";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function OrderMode() {
  const navigate = useNavigate();
  const {
    order,
    setOrderType,
    setShippingAddress,
    cities,
    getAreasForCity,
    loadingCities,
  } = useOrder();

  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [mode, setMode] = useState(order.orderType || "delivery");
  const [openCity, setOpenCity] = useState(null);
  const [search, setSearch] = useState("");

  const selectedCity = order.shippingAddress.city || "";
  const selectedArea = order.shippingAddress.area || "";

  const handleBack = () => navigate(-1);

  // Pickup: single static Hawally location
  const pickupCityKey = "HAWL";
  const pickupCityLabel =
    language === "ar" ? "حولي" : t.governorates?.[pickupCityKey] || "Hawally";
  const pickupAreaObj = {
    key: "pickup_single_hawally",
    name: { en: "Hawally Branch", ar: "فرع حولي" },
    shippingPrice: 0,
  };

  const pickupCity = {
    city: { key: pickupCityKey, name: { en: "Hawally", ar: "حولي" } },
    cityLabel: pickupCityLabel,
    matchingAreas: [pickupAreaObj],
  };

  const handleSelectLocation = (cityKey, areaObj) => {
    setOrderType(mode);
    setShippingAddress({
      city: cityKey,
      area: areaObj.name.en, // Area name
      areaId: areaObj.key, // ✅ Area ID
      areaPrice: areaObj.shippingPrice, // ✅ SHIPPING PRICE DIRECTLY ✅
      locationKey: `${cityKey}:${areaObj.name.en}`,
      location: `${t.governorates?.[cityKey] || cityKey} - ${areaObj.name.en}`,
    });
    navigate(-1);
  };

  const searchQuery = search.toLowerCase();

  let visibleCities = [];

  if (mode === "pickup") {
    // Only Hawally, not using backend. Apply search over city or branch label.
    const cityMatch = pickupCityLabel.toLowerCase().includes(searchQuery);
    const areaMatch =
      pickupAreaObj.name.en.toLowerCase().includes(searchQuery) ||
      pickupAreaObj.name.ar.toLowerCase().includes(searchQuery);

    if (!searchQuery.trim() || cityMatch || areaMatch) {
      visibleCities = [pickupCity];
    } else {
      visibleCities = [];
    }
  } else {
    visibleCities = cities
      .filter((city) => city.isActive !== false)
      .map((city) => {
        const cityLabel = t.governorates?.[city.key] || city.name.en;
        const cityAreas = getAreasForCity(city.key);
        if (!searchQuery.trim()) {
          return { city, cityLabel, matchingAreas: cityAreas };
        }
        const cityMatch = cityLabel.toLowerCase().includes(searchQuery);
        const filteredAreas = cityAreas.filter(
          (area) =>
            area.name.en.toLowerCase().includes(searchQuery) ||
            area.name.ar.toLowerCase().includes(searchQuery)
        );
        if (!cityMatch && filteredAreas.length === 0) return null;
        return {
          city,
          cityLabel,
          matchingAreas: cityMatch ? cityAreas : filteredAreas,
        };
      })
      .filter(Boolean);
  }

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  if (loadingCities) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-500">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-semibold text-lg">
          {language === "ar" ? "وضع الطلب" : "Order Mode"}
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

      {/* Cities & Areas */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {visibleCities.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            {language === "ar" ? "لا توجد نتائج" : "No results found"}
          </div>
        ) : (
          visibleCities.map(({ city, cityLabel, matchingAreas }) => (
            <div key={city.key} className="mb-4">
              {/* City Header */}
              <button
                onClick={() =>
                  setOpenCity((prev) => (prev === city.key ? null : city.key))
                }
                className="w-full flex items-center justify-between bg-[#eee] rounded-lg px-4 py-3 shadow-sm gap-3"
                disabled={mode === "pickup"} // Disable expand/collapse in pickup
              >
                <span className="text-sm font-bold text-gray-800 capitalize">
                  {cityLabel}
                </span>
                <IoIosArrowDown
                  className={`text-gray-500 transition-transform ${
                    openCity === city.key || mode === "pickup"
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {/* Areas List */}
              {(openCity === city.key || mode === "pickup" || searchQuery) &&
                matchingAreas.length > 0 && (
                  <div className="mt-1 ml-3 space-y-1">
                    {matchingAreas.map((areaObj) => {
                      const isSelected =
                        selectedCity === city.key &&
                        selectedArea === areaObj.name.en;

                      // All areas from dashboard are active for customers, as before
                      const isAvailable = true;

                      return (
                        <div
                          key={areaObj.key}
                          className="flex items-center w-full"
                        >
                          <label className="flex items-center cursor-pointer w-full group">
                            {/* Visual toggle icon - always ON for customers */}
                            <div className="ml-2 w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all bg-green-500 text-white shadow-md">
                              <FaToggleOn className="w-3 h-3" />
                            </div>

                            {/* Area Button with Shipping Price */}
                            <button
                              onClick={() =>
                                handleSelectLocation(city.key, areaObj)
                              }
                              className={`capitalize flex-1 text-left ml-3 text-sm border-b border-gray-200 py-2 px-3 rounded transition-all ${
                                isSelected
                                  ? "bg-green-100 font-semibold text-green-800 border-green-300"
                                  : "text-gray-700 hover:bg-gray-100 hover:text-green-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>
                                  {
                                    areaObj.name[
                                      language === "ar" ? "ar" : "en"
                                    ]
                                  }
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                                  kw {areaObj.shippingPrice.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrderMode;
