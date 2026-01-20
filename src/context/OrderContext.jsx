import React, { createContext, useState, useEffect, useMemo, useCallback } from "react";

const OrderContext = createContext();

const API_BASE_URL = "https://lilian-backend.onrender.com/api";

export function OrderProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState({});
  const [loadingCities, setLoadingCities] = useState(true);
  const [syncedOrderId, setSyncedOrderId] = useState(null);
  const [isGuest, setIsGuest] = useState(true);

  // 🔥 GUEST-FRIENDLY DB SAVE (No auth required)
  const saveOrderToDB = useCallback(async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Update order state with DB order ID
        setOrder(prev => ({ ...prev, _id: data.orderId }));
        setSyncedOrderId(data.orderId);
        setIsGuest(!token); // No token = guest

        // ✅ BOTH DB + localStorage
        const fullOrder = { ...payload, _id: data.orderId, isGuest: !token };
        localStorage.setItem("order", JSON.stringify(fullOrder));

        return { success: true, orderId: data.orderId, isGuest: !token };
      }

      return { success: false, message: data.message || "Save failed" };
    } catch (error) {
      console.error("❌ DB save error:", error);
      return { success: false, message: "Network error" };
    }
  }, []);

  // 🔥 Load cities/areas (unchanged)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`${API_BASE_URL}/city-areas`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.success) {
          const activeCities = data.cities.filter(city => city.isActive !== false);
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

  // 🔥 DB FIRST, localStorage fallback (Guest + Auth)
  useEffect(() => {
    const initializeOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) }
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          // Find latest pending order for this user/guest
          const pendingOrder = ordersData.data?.find(o => o.status === "pending");
          if (pendingOrder) {
            setOrder(pendingOrder);
            setSyncedOrderId(pendingOrder._id);
            setIsGuest(pendingOrder.isGuest || !token);
            return;
          }
        }
      } catch (error) {
        console.log("📡 No DB orders found, using localStorage");
      }

      // Fallback to localStorage
      try {
        const savedOrder = localStorage.getItem("order");
        if (savedOrder) {
          const parsed = JSON.parse(savedOrder);
          setOrder(parsed);
          setSyncedOrderId(parsed._id || null);
          setIsGuest(parsed.isGuest !== false);
        }
      } catch (e) {
        console.log("📦 No localStorage order, starting fresh");
      }
    };

    initializeOrder();
  }, []);

  // 🔥 Order state with localStorage sync
  const [order, setOrder] = useState(() => {
    try {
      const savedOrder = localStorage.getItem("order");
      return savedOrder ? JSON.parse(savedOrder) : {
        items: [],
        orderType: "pickup",
        shippingAddress: { city: "", area: "", street: "", block: "", house: "" },
        scheduledSlot: { date: new Date().toISOString().split("T")[0], timeSlot: "" },
        message: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        promoCode: "",
        promoDiscount: 0,
      };
    } catch {
      return { items: [], orderType: "pickup", shippingAddress: {}, scheduledSlot: {}, message: "", customerName: "", customerPhone: "", customerEmail: "", promoCode: "", promoDiscount: 0 };
    }
  });

  // 🔥 Auto-save to BOTH DB + localStorage (debounced 2s)
  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order)); // Always save locally

    if (!order.items.length) return; // Don't save empty orders

    const timeoutId = setTimeout(async () => {
      const payload = getOrderPayload();
      if (payload.products?.length > 0) {
        await saveOrderToDB(payload);
      }
    }, 2000); // Save 2s after user stops typing

    return () => clearTimeout(timeoutId);
  }, [order, saveOrderToDB]);

  // Order setters (unchanged)
  const setItems = useCallback((items) => setOrder(prev => ({ ...prev, items })), []);
  const setOrderType = useCallback((type) => setOrder(prev => ({ ...prev, orderType: type })), []);
  const setShippingAddress = useCallback((address) => setOrder(prev => ({ ...prev, shippingAddress: { ...prev.shippingAddress, ...address } })), []);
  const setScheduledSlot = useCallback((slot) => setOrder(prev => ({ ...prev, scheduledSlot: slot })), []);
  const setCustomerName = useCallback((name) => setOrder(prev => ({ ...prev, customerName: name })), []);
  const setCustomerPhone = useCallback((phone) => setOrder(prev => ({ ...prev, customerPhone: phone })), []);
  const setCustomerEmail = useCallback((email) => setOrder(prev => ({ ...prev, customerEmail: email })), []);
  const setSpecialInstructions = useCallback((instructions) => setOrder(prev => ({ ...prev, message: instructions })), []);
  const setPromoCode = useCallback((code) => setOrder(prev => ({ ...prev, promoCode: code })), []);
  const setPromoDiscount = useCallback((discount) => setOrder(prev => ({ ...prev, promoDiscount: discount })), []);

  const clearOrder = useCallback(() => {
    setOrder({
      items: [], orderType: "pickup", shippingAddress: {},
      scheduledSlot: {}, message: "", customerName: "",
      customerPhone: "", customerEmail: "", promoCode: "", promoDiscount: 0
    });
    setSyncedOrderId(null);
    setIsGuest(true);
    localStorage.removeItem("order");
    localStorage.removeItem("paymentOrderId");
  }, []);

  // Totals (unchanged)
  const subtotal = useMemo(() =>
    order.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0),
    [order.items]
  );

  const discountedSubtotal = useMemo(() =>
    subtotal * (1 - (order.promoDiscount || 0) / 100),
    [subtotal, order.promoDiscount]
  );

  const shippingCost = useMemo(() => {
    if (order.orderType === "pickup") return 0;

    const cityKey = order.shippingAddress.city;
    const areaName = order.shippingAddress.area;

    if (cityKey && areaName && areas[cityKey]) {
      const areaObj = areas[cityKey].find(a =>
        a.name.en === areaName || a.name.ar === areaName || a.key === areaName
      );
      return parseFloat(areaObj?.shippingPrice) || 2.5;
    }
    return 2.5;
  }, [order.orderType, order.shippingAddress, areas]);

  const grandTotal = useMemo(() => parseFloat((discountedSubtotal + shippingCost).toFixed(3)), [discountedSubtotal, shippingCost]);

  // Backend-compatible payload (unchanged)
  const getOrderPayload = useCallback(() => {
    const scheduleTime = order.scheduledSlot?.date && order.scheduledSlot?.timeSlot ? {
      date: order.scheduledSlot.date,
      timeSlot: order.scheduledSlot.timeSlot,
    } : null;

    const userInfo = {
      name: order.customerName || "",
      phone: order.customerPhone || "",
    };

    const products = (order.items || []).map(item => ({
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
      orderType: order.orderType || "pickup",
      scheduleTime,
      shippingAddress: order.orderType === "delivery" ? order.shippingAddress : undefined,
      userInfo,
      paymentMethod: "card",
      specialInstructions: order.message || "",
    };
  }, [order, subtotal, shippingCost, grandTotal]);

  // Promo validation (unchanged)
  const validatePromoCode = useCallback(async (code) => {
    if (!code?.trim()) {
      setPromoCode(""); setPromoDiscount(0);
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
        setPromoCode(""); setPromoDiscount(0);
        return { valid: false, message: data.message || "Invalid promo code" };
      }
    } catch (error) {
      console.error("Promo validation error:", error);
      setPromoCode(""); setPromoDiscount(0);
      return { valid: false, message: "Validation error" };
    }
  }, [setPromoCode, setPromoDiscount]);

  const [paymentMethod, setPaymentMethod] = useState("card");

  const value = {
    order, setItems, setOrderType, setShippingAddress, setScheduledSlot,
    setSpecialInstructions, setCustomerName, setCustomerPhone, setCustomerEmail,
    setPromoCode, setPromoDiscount, clearOrder, totalAmount: grandTotal,
    subtotal, shippingCost, getOrderPayload, cities, areas, loadingCities,
    paymentMethod, setPaymentMethod, validatePromoCode,
    syncedOrderId,      // 🔥 DB Order ID
    isGuest,            // 🔥 Guest status
    saveOrderToDB,      // 🔥 Manual DB save
    getAreasForCity: (cityKey) => areas[cityKey] || [],
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export default OrderContext;
