import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";

const OrderContext = createContext();

const API_BASE_URL = "https://lilian-backend.onrender.com/api";

export function OrderProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState({});
  const [loadingCities, setLoadingCities] = useState(true);

  // Fetch cities/areas
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`${API_BASE_URL}/city-areas`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.success) {
          const activeCities = data.cities.filter(
            (city) => city.isActive !== false
          );
          setCities(activeCities);

          const areasObj = {};
          activeCities.forEach((city) => {
            areasObj[city.key] = city.areas
              .filter((area) => area.isActive !== false)
              .map((area) => ({
                key: area._id,
                name: area.name,
                shippingPrice: area.shippingPrice,
              }));
          });
          setAreas(areasObj);
        }
      } catch (error) {
        console.error("❌ Failed to fetch cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const cityKeys = useMemo(() => cities.map((city) => city.key), [cities]);

  // 🔥 COMPLETE Order state with FULL address structure
  const [order, setOrder] = useState(() => {
    try {
      const savedOrder = localStorage.getItem("order");
      return savedOrder
        ? JSON.parse(savedOrder)
        : {
          items: [],
          orderType: "pickup",
          shippingAddress: {
            city: "",
            area: "",
            street: "",
            block: "",
            house: "",
            landmark: "",
            additionalInfo: "",
          },
          scheduledSlot: {
            date: new Date().toISOString().split("T")[0],
            timeSlot: "08:00 AM - 01:00 PM",
          },
          message: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          promoCode: "",
          promoDiscount: 0,
        };
    } catch {
      return {
        items: [],
        orderType: "pickup",
        shippingAddress: {
          city: "",
          area: "",
          street: "",
          block: "",
          house: "",
          landmark: "",
          additionalInfo: "",
        },
        scheduledSlot: {
          date: new Date().toISOString().split("T")[0],
          timeSlot: "08:00 AM - 01:00 PM",
        },
        message: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        promoCode: "",
        promoDiscount: 0,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order));
  }, [order]);

  // Order setters - useCallback optimized
  const setItems = useCallback((items) => {
    setOrder((prev) => ({ ...prev, items }));
  }, []);

  const setOrderType = useCallback((type) => {
    setOrder((prev) => ({ ...prev, orderType: type }));
  }, []);

  const setShippingAddress = useCallback((address) => {
    setOrder((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        ...address,
      },
    }));
  }, []);

  const setScheduledSlot = useCallback((slot) => {
    setOrder((prev) => ({ ...prev, scheduledSlot: slot }));
  }, []);

  const setCustomerName = useCallback((name) => {
    setOrder((prev) => ({ ...prev, customerName: name }));
  }, []);

  const setCustomerPhone = useCallback((phone) => {
    setOrder((prev) => ({ ...prev, customerPhone: phone }));
  }, []);

  const setCustomerEmail = useCallback((email) => {
    setOrder((prev) => ({ ...prev, customerEmail: email }));
  }, []);

  const setSpecialInstructions = useCallback((instructions) => {
    setOrder((prev) => ({ ...prev, message: instructions }));
  }, []);

  const setMessage = useCallback(
    (msg) => {
      setSpecialInstructions(msg);
    },
    [setSpecialInstructions]
  );

  const setPromoCode = useCallback((code) => {
    setOrder((prev) => ({ ...prev, promoCode: code }));
  }, []);

  const setPromoDiscount = useCallback((discount) => {
    setOrder((prev) => ({ ...prev, promoDiscount: discount }));
  }, []);

  const clearOrder = useCallback(() => {
    setOrder({
      items: [],
      orderType: "pickup",
      shippingAddress: {
        city: "",
        area: "",
        street: "",
        block: "",
        house: "",
        landmark: "",
        additionalInfo: "",
      },
      scheduledSlot: null,
      message: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      promoCode: "",
      promoDiscount: 0,
    });
  }, []);

  // Totals calculations
  const subtotal = useMemo(
    () =>
      order.items.reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1),
        0
      ),
    [order.items]
  );

  const discountedSubtotal = useMemo(
    () => subtotal * (1 - (order.promoDiscount || 0) / 100),
    [subtotal, order.promoDiscount]
  );

  const shippingCost = useMemo(() => {
    if (order.orderType === "pickup") return 0;

    const cityKey = order.shippingAddress.city;
    const areaName = order.shippingAddress.area;
    const locationKey = order.shippingAddress.locationKey;

    if (locationKey) {
      const [key, area] = locationKey.split(":");
      const cityAreas = areas[key];
      const areaObj = cityAreas?.find(
        (a) => a.name.en === area || a.name.ar === area || a.key === areaName
      );
      return parseFloat(areaObj?.shippingPrice) || 2.5;
    }

    if (cityKey && areaName) {
      const cityAreas = areas[cityKey];
      const areaObj = cityAreas?.find(
        (a) =>
          a.name.en === areaName ||
          a.name.ar === areaName ||
          a.key === areaName
      );
      return parseFloat(areaObj?.shippingPrice) || 2.5;
    }

    return 0;
  }, [order.orderType, order.shippingAddress, areas]);

  const grandTotal = useMemo(
    () => parseFloat((discountedSubtotal + shippingCost).toFixed(3)),
    [discountedSubtotal, shippingCost]
  );

  const validatePromoCode = useCallback(async (code) => {
    if (!code?.trim()) {
      setPromoCode("");
      setPromoDiscount(0);
      return { valid: false, discount: 0 };
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/promos/validate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.success && data.promo) {
        setPromoCode(data.promo.code);
        setPromoDiscount(data.promo.discountPercent);
        return { valid: true, discount: data.promo.discountPercent };
      } else {
        setPromoCode("");
        setPromoDiscount(0);
        return { valid: false, message: data.message || "Invalid promo code" };
      }
    } catch (error) {
      console.error("Promo validation error:", error);
      setPromoCode("");
      setPromoDiscount(0);
      return { valid: false, message: "Validation error" };
    }
  }, [setPromoCode, setPromoDiscount]);

  // 🔥 ✅ FIXED getOrderPayload - Backend Compatible
  const getOrderPayload = useCallback(() => {
    console.log("🔍 getOrderPayload - FULL ORDER:", order);

    // ✅ BACKEND EXPECTS: scheduleTime (not scheduledSlot)
    const scheduleTime =
      order.scheduledSlot && order.scheduledSlot.date && order.scheduledSlot.timeSlot
        ? {
          date: order.scheduledSlot.date,
          timeSlot: order.scheduledSlot.timeSlot,
        }
        : null;

    // 🔥 BACKEND EXPECTS: userInfo object (not separate customer fields)
    const userInfo = {
      name: order.customerName || "",
      phone: order.customerPhone || "",
    };

    // ✅ TRANSFORM items → products structure for backend
    const products = (order.items || []).map((item) => ({
      product: item._id || item.id || new Date().getTime(),
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
      message: item.message || "",
    }));

    const payload = {
      products,
      subtotal: parseFloat(subtotal.toFixed(3)),
      shippingCost: parseFloat(shippingCost.toFixed(3)),
      totalAmount: grandTotal,
      promoCode: order.promoCode || "",
      promoDiscount: parseFloat(order.promoDiscount || 0),
      orderType: order.orderType || "pickup",
      scheduleTime,
      userInfo,
      ...(order.orderType === "delivery" && {
        shippingAddress: {
          city: order.shippingAddress?.city || "",
          area: order.shippingAddress?.area || "",
          street: order.shippingAddress?.street || "",
          block: parseInt(order.shippingAddress?.block) || 0,
          house: parseInt(order.shippingAddress?.house) || 0,
          landmark: order.shippingAddress?.landmark || "",
          additionalInfo: order.shippingAddress?.additionalInfo || "",
        },
      }),
      specialInstructions: order.message || "",
    };

    console.log("🚀 PAYLOAD SENT TO BACKEND:", JSON.stringify(payload, null, 2));
    return payload;
  }, [order, subtotal, shippingCost, grandTotal]);

  const [paymentMethod, setPaymentMethod] = useState(() => {
    try {
      return localStorage.getItem("paymentMethod") || "card";
    } catch {
      return "card";
    }
  });

  useEffect(() => {
    localStorage.setItem("paymentMethod", paymentMethod);
  }, [paymentMethod]);

  // Helper functions
  const getAreasForCity = useCallback(
    (cityKey) => areas[cityKey] || [],
    [areas]
  );

  const getAreaById = useCallback(
    (cityKey, areaId) =>
      areas[cityKey]?.find((area) => area.key === areaId),
    [areas]
  );

  const isPromoValid = useMemo(
    () => !!(order.promoCode && order.promoDiscount > 0),
    [order.promoCode, order.promoDiscount]
  );

  const value = {
    order,
    setItems,
    setOrderType,
    setShippingAddress,
    setScheduledSlot,
    setSpecialInstructions,
    setMessage,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setPromoCode,
    setPromoDiscount,
    clearOrder,
    totalAmount: grandTotal,
    subtotal,
    discountedSubtotal,
    shippingCost,
    getShippingCost: shippingCost,
    getOrderPayload,
    cities,
    areas,
    cityKeys,
    loadingCities,
    paymentMethod,
    setPaymentMethod,
    validatePromoCode,
    isPromoValid,
    getAreasForCity,
    getAreaById,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export default OrderContext;
