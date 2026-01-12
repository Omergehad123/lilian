import React, { createContext, useState, useEffect, useMemo } from "react";

const OrderContext = createContext();

const API_BASE_URL = "https://lilian-backend-7bjc.onrender.com/api";

export function OrderProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState({});
  const [loadingCities, setLoadingCities] = useState(true);

  // ✅ Fetch cities/areas
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

  // ✅ FIXED Order state - Added specialInstructions
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
            },
            scheduledSlot: {
              date: new Date().toISOString().split("T")[0],
              timeSlot: "08:00 AM - 01:00 PM",
            },
            message: "", // ✅ This becomes specialInstructions
            customerName: "",
            customerPhone: "",
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
        },
        scheduledSlot: {
          date: new Date().toISOString().split("T")[0],
          timeSlot: "08:00 AM - 01:00 PM",
        },
        message: "",
        customerName: "",
        customerPhone: "",
        promoCode: "",
        promoDiscount: 0,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order));
  }, [order]);

  // ✅ Order setters
  const setItems = (items) => setOrder((prev) => ({ ...prev, items }));
  const setOrderType = (type) =>
    setOrder((prev) => ({ ...prev, orderType: type }));
  const setShippingAddress = (address) =>
    setOrder((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, ...address },
    }));
  const setScheduledSlot = (slot) =>
    setOrder((prev) => ({ ...prev, scheduledSlot: slot }));
  const setCustomerName = (name) =>
    setOrder((prev) => ({ ...prev, customerName: name }));
  const setCustomerPhone = (phone) =>
    setOrder((prev) => ({ ...prev, customerPhone: phone }));

  // ✅ FIXED: Special instructions setter (maps to message)
  const setSpecialInstructions = (instructions) =>
    setOrder((prev) => ({ ...prev, message: instructions }));

  // Keep old message setter for backward compatibility
  const setMessage = (msg) => setSpecialInstructions(msg);

  // ✅ Promo setters
  const setPromoCode = (code) =>
    setOrder((prev) => ({ ...prev, promoCode: code }));
  const setPromoDiscount = (discount) =>
    setOrder((prev) => ({ ...prev, promoDiscount: discount }));

  const clearOrder = () =>
    setOrder({
      items: [],
      orderType: "pickup",
      shippingAddress: { city: "", area: "", street: "", block: "", house: "" },
      scheduledSlot: null,
      message: "",
      customerName: "",
      customerPhone: "",
      promoCode: "",
      promoDiscount: 0,
    });

  // ✅ Totals مع الـ Promo
  const subtotal = useMemo(
    () =>
      order.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [order.items]
  );

  const discountedSubtotal = useMemo(
    () => subtotal * (1 - order.promoDiscount / 100),
    [subtotal, order.promoDiscount]
  );

  const shippingCost = useMemo(() => {
    if (order.orderType === "pickup") return 0;
    const areaId = order.shippingAddress.areaId;
    const cityKey = order.shippingAddress.city;
    const area = areas[cityKey]?.find((a) => a.key === areaId);
    return area ? area.shippingPrice : 0;
  }, [order.orderType, order.shippingAddress, areas]);

  const grandTotal = useMemo(
    () => discountedSubtotal + shippingCost,
    [discountedSubtotal, shippingCost]
  );

  const validatePromoCode = async (code) => {
    if (!code.trim()) {
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
      setPromoCode("");
      setPromoDiscount(0);
      return { valid: false, message: "Validation error" };
    }
  };

  // ✅ FIXED: getOrderPayload - NOW INCLUDES specialInstructions!
  const getOrderPayload = () => ({
    products: order.items.map((item) => ({
      product: item._id,
      quantity: item.quantity,
      price: item.price,
      message: item.message || order.message || "", // per-product message
    })),
    totalAmount: grandTotal,
    orderType: order.orderType,
    promoCode: order.promoCode || null,
    promoDiscount: order.promoDiscount || 0,
    subtotal,
    discountedSubtotal,
    shippingCost,
    scheduleTime: order.scheduledSlot
      ? {
          date: order.scheduledSlot.date,
          timeSlot: order.scheduledSlot.timeSlot,
        }
      : null,
    shippingAddress: {
      ...order.shippingAddress,
    },
    userInfo: {
      name: order.customerName,
      phone: order.customerPhone,
    },
    // ✅ FIXED: This was MISSING!
    specialInstructions: order.message || null,
  });

  const [paymentMethod, setPaymentMethod] = useState(() => {
    try {
      return localStorage.getItem("paymentMethod") || "cash";
    } catch {
      return "cash";
    }
  });

  useEffect(() => {
    localStorage.setItem("paymentMethod", paymentMethod);
  }, [paymentMethod]);

  // ✅ Helpers
  const getAreasForCity = (cityKey) => areas[cityKey] || [];
  const getAreaById = (cityKey, areaId) =>
    areas[cityKey]?.find((area) => area.key === areaId);
  const isPromoValid = useMemo(
    () => order.promoCode && order.promoDiscount > 0,
    [order]
  );

  const value = {
    order,
    setItems,
    setOrderType,
    setShippingAddress,
    setScheduledSlot,
    setSpecialInstructions, // ✅ NEW: Direct setter
    setMessage, // ✅ Keep for backward compatibility
    setCustomerName,
    setCustomerPhone,
    setPromoCode,
    setPromoDiscount,
    clearOrder,
    totalAmount: grandTotal,
    subtotal,
    discountedSubtotal,
    shippingCost,
    getShippingCost: shippingCost,
    getOrderPayload, // ✅ NOW PERFECTLY includes specialInstructions
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
