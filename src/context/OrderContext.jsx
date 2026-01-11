import React, { createContext, useState, useEffect, useMemo } from "react";

const OrderContext = createContext();

const API_BASE_URL = "https://lilian-backend-7bjc.onrender.com/api"; // Your backend URL

export function OrderProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState({});
  const [loadingCities, setLoadingCities] = useState(true);

  // ✅ FIXED: Fetch ONLY ACTIVE cities/areas for customers
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`${API_BASE_URL}/city-areas`); // ✅ No auth needed!

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // ✅ Filter ONLY ACTIVE cities and areas for customers
          const activeCities = data.cities.filter(
            (city) => city.isActive !== false
          );

          setCities(activeCities);

          // ✅ Transform for easy lookup - ONLY active areas
          const areasObj = {};
          activeCities.forEach((city) => {
            areasObj[city.key] = city.areas
              .filter((area) => area.isActive !== false) // ✅ Only active areas
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

  // ... rest of your existing order state (UNCHANGED - PERFECT!)
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
              areaId: "", // ✅ This stores the area._id for backend
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
          };
    } catch {
      return {
        items: [],
        orderType: "pickup",
        shippingAddress: {
          city: "",
          area: "",
          areaId: "",
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
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order));
  }, [order]);

  const setItems = (items) => setOrder((prev) => ({ ...prev, items }));
  const setOrderType = (type) =>
    setOrder((prev) => ({ ...prev, orderType: type }));

  // ✅ IMPROVED: Better address handling with areaId
  const setShippingAddress = (address) =>
    setOrder((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        ...address,
        // Auto-set areaId when area changes
        ...(address.area && {
          areaId:
            areas[prev.shippingAddress.city]?.find(
              (a) => a.name.en === address.area || a.name.ar === address.area
            )?.key || "",
        }),
      },
    }));

  const setScheduledSlot = (slot) =>
    setOrder((prev) => ({ ...prev, scheduledSlot: slot }));
  const setCustomerName = (name) =>
    setOrder((prev) => ({ ...prev, customerName: name }));
  const setCustomerPhone = (phone) =>
    setOrder((prev) => ({ ...prev, customerPhone: phone }));
  const setMessage = (msg) => setOrder((prev) => ({ ...prev, message: msg }));

  const clearOrder = () =>
    setOrder({
      items: [],
      orderType: "pickup",
      shippingAddress: {
        city: "",
        area: "",
        areaId: "",
        street: "",
        block: "",
        house: "",
      },
      scheduledSlot: null,
      message: "",
      customerName: "",
      customerPhone: "",
    });

  const totalAmount = useMemo(
    () =>
      order.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [order.items]
  );

  // ✅ IMPROVED: Calculate shipping cost
  const getShippingCost = useMemo(() => {
    const areaId = order.shippingAddress.areaId;
    const cityKey = order.shippingAddress.city;
    const area = areas[cityKey]?.find((a) => a.key === areaId);
    return area ? area.shippingPrice : 0;
  }, [order.shippingAddress.areaId, order.shippingAddress.city, areas]);

  const getOrderPayload = () => {
    return {
      products: order.items.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
        message: item.message || order.message || "",
      })),
      totalAmount,
      orderType: order.orderType,
      scheduleTime: order.scheduledSlot
        ? {
            date: order.scheduledSlot.date,
            timeSlot: order.scheduledSlot.timeSlot,
          }
        : null,
      shippingAddress: {
        ...order.shippingAddress,
        areaId: order.shippingAddress.areaId, // ✅ Backend needs this!
      },
      userInfo: {
        name: order.customerName,
        phone: order.customerPhone,
      },
    };
  };

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

  // ✅ NEW HELPER FUNCTIONS for easy use in components
  const getAreasForCity = (cityKey) => areas[cityKey] || [];
  const getAreaById = (cityKey, areaId) =>
    areas[cityKey]?.find((area) => area.key === areaId);

  const value = {
    order,
    setItems,
    setOrderType,
    setShippingAddress,
    setScheduledSlot,
    setMessage,
    setCustomerName,
    setCustomerPhone,
    clearOrder,
    totalAmount,
    getShippingCost, // ✅ NEW: Easy shipping cost access
    getOrderPayload,
    cities,
    areas,
    cityKeys,
    loadingCities,
    paymentMethod,
    setPaymentMethod,
    // ✅ NEW HELPERS
    getAreasForCity,
    getAreaById,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export default OrderContext;
