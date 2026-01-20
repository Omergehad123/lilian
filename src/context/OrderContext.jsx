import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const OrderContext = createContext();

const API_BASE_URL = "https://lilian-backend.onrender.com/api";

export function OrderProvider({ children }) {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState({});
  const [loadingCities, setLoadingCities] = useState(true);

  const [savedOrderId, setSavedOrderId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // 1) Fetch cities & areas
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`${API_BASE_URL}/city-areas`);
        if (!response.ok) throw new Error("Failed to fetch cities");
        const data = await response.json();
        if (data.success) {
          const activeCities = data.cities.filter((city) => city.isActive !== false);
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

  // 2) Order state
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

  // 3) Save order to localStorage
  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order));
  }, [order]);

  // 4) Totals
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

    if (cityKey && areaName) {
      const cityAreas = areas[cityKey];
      const areaObj = cityAreas?.find(
        (a) => a.name.en === areaName || a.name.ar === areaName || a.key === areaName
      );
      return parseFloat(areaObj?.shippingPrice) || 2.5;
    }

    return 0;
  }, [order.orderType, order.shippingAddress, areas]);

  const grandTotal = useMemo(
    () => parseFloat((discountedSubtotal + shippingCost).toFixed(3)),
    [discountedSubtotal, shippingCost]
  );

  // 5) Backend payload
  const getOrderPayload = useCallback(() => {
    const scheduleTime =
      order.scheduledSlot && order.scheduledSlot.date && order.scheduledSlot.timeSlot
        ? {
          date: order.scheduledSlot.date,
          timeSlot: order.scheduledSlot.timeSlot,
        }
        : null;

    const userInfo = {
      name: order.customerName || "",
      phone: order.customerPhone || "",
    };

    const products = (order.items || []).map((item) => ({
      product: item._id || item.id,
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
      message: item.message || "",
    }));

    return {
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
  }, [order, subtotal, shippingCost, grandTotal]);

  // 6) Save order to DB
  const saveOrderToDB = useCallback(async (paymentMethod = "card") => {
    if (!order.items.length) throw new Error("No items in order");

    setSavingOrder(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...getOrderPayload(),
        paymentMethod,
        status: "pending",
        isPaid: paymentMethod !== "cash",
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.data?.orderId) {
        throw new Error(data.message || "Failed to save order");
      }

      const orderId = data.data.orderId;
      setSavedOrderId(orderId);

      return { success: true, orderId, isGuest: !token };
    } catch (error) {
      console.error("❌ DB Save failed:", error);

      // DO NOT proceed with fake orderId
      return { success: false, message: error.message };
    } finally {
      setSavingOrder(false);
    }
  }, [order, getOrderPayload]);

  // 7) Complete order (redirect to success)
  const completeOrder = useCallback(
    async (paymentMethod = "card") => {
      const result = await saveOrderToDB(paymentMethod);

      if (!result.success) {
        return { success: false, message: result.message || "Order failed" };
      }

      localStorage.setItem("paymentOrderId", result.orderId);
      localStorage.setItem("paymentMethod", paymentMethod);

      navigate("/success", {
        state: {
          orderId: result.orderId,
          paid: paymentMethod !== "cash",
          method: paymentMethod,
          isGuest: result.isGuest,
        },
      });

      return result;
    },
    [saveOrderToDB, navigate]
  );

  // 8) Order setters
  const setItems = useCallback((items) => {
    setOrder((prev) => ({ ...prev, items }));
    setSavedOrderId(null);
  }, []);

  const setOrderType = useCallback((type) => {
    setOrder((prev) => ({ ...prev, orderType: type }));
  }, []);

  const setShippingAddress = useCallback((address) => {
    setOrder((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, ...address },
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
    (msg) => setSpecialInstructions(msg),
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
    });

    setSavedOrderId(null);
    localStorage.removeItem("paymentOrderId");
  }, []);

  // 9) Promo validation
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
  }, []);

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

  const getAreasForCity = useCallback(
    (cityKey) => areas[cityKey] || [],
    [areas]
  );

  const getAreaById = useCallback(
    (cityKey, areaId) => areas[cityKey]?.find((area) => area.key === areaId),
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
    saveOrderToDB,
    completeOrder,
    savedOrderId,
    savingOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export default OrderContext;
