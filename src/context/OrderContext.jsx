import React, { createContext, useState, useEffect } from "react";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const cityKeys = ["AHMD", "FARW", "HAWL", "JAHR", "KUWC", "MUBK"];

  const areas = {
    AHMD: [
      "abu halifa",
      "al-fintas",
      "al-maqwa",
      "ali sabah al-salem - umm al hayman",
      "dhaher",
      "east al ahmadi",
      "eqaila",
      "fahd al-ahmad",
      "fahaheel",
      "hadiya",
      "jaber al-ali",
      "mahboula",
      "mangaf",
      "middle of ahmadi",
      "north ahmadi",
      "riqqa",
      "sabah al-ahmad 1",
      "sabah al-ahmad 2",
      "sabah al-ahmad 3",
      "sabah al-ahmad 4",
      "sabah al-ahmad 5",
      "sabah al-ahmad 6",
      "sabah al-ahmad investment",
      "sabah al-ahmad services",
      "sabahiya",
    ],
    FARW: [
      "abbasiya",
      "abdullah al mubarak al-sabah",
      "abdullah al mubarak - west jleeb",
      "abraq khaitan",
      "airport",
      "al-shadadyia",
      "andalus",
      "ardhiya 4",
      "ardhiya 6",
      "ardhiya herafiya",
      "ardhiya small industrial",
      "ardhiya storage zone",
      "ashbellah",
      "dhajeej",
      "farwaniya",
      "firdous",
      "ishbiliya",
      "jeleeb al-shuyoukh",
      "khaitan",
      "kuwait international airport",
      "omariya",
      "rabia",
      "rai",
      "rehab",
      "rigai",
      "sabah al nasser",
      "sabah al-salem univeristy city",
      "sheikh saad aviation terminal",
      "south abdullah almubarak",
      "south khaitan - exhibits",
      "WEST ABDULLAH AL-MUBARAK",
    ],
    HAWL: [
      "al-bidea",
      "al-siddeeq",
      "anjafa",
      "bayan",
      "hawalli",
      "hitteen",
      "jabriya",
      "maidan hawalli",
      "mishrif",
      "mubarak al-abdullah",
      "rumaithiya",
      "salam",
      "salmiya",
      "salwa",
      "shaab",
      "shuhada",
      "zahra",
    ],
    JAHR: [
      "agricultural sulaibiya",
      "chalets of subiya",
      "jahra",
      "jahra industrial 1",
      "naeem",
      "nahdha",
      "nasseem",
      "north west jahra",
      "old jahra",
      "oyoun",
      "qairawan",
      "qasr",
      "saad al abdullah",
      "subiya",
      "sulaibiya residential",
      "taima",
      "waha",
    ],
    KUWC: [
      "abdulla al-salem",
      "adailiya",
      "al hamra tower",
      "al soor gardens - block 1",
      "bneid al qar",
      "crystal tower",
      "daiya",
      "dasma",
      "dasman",
      "doha",
      "faiha",
      "granada",
      "health area",
      "jaber al ahmed",
      "khaldiya",
      "kifan",
      "kuwait city",
      "kuwait free trade zone",
      "mansouriya",
      "mina doha",
      "mirqab",
      "mubarakiya camps",
      "mubarakiya",
      "nahda",
      "north west al-sulaibikhat",
      "nuzha",
      "qadsiya",
      "qibla",
      "qortuba",
      "rawda",
      "salhiya",
      "sawaber",
      "shamiya",
      "sharq",
      "shuwaikh",
      "shuwaikh administrative",
      "shuwaikh industrial 1",
      "shuwaikh industrial 2",
      "shuwaikh industrial 3",
      "shuwaikh medical",
      "shuwaikh port",
      "sulaibikhat",
      "surra",
      "yarmouk",
    ],
    MUBK: [
      "abu flaira",
      "abu hassaniah",
      "al masayel",
      "al-adan",
      "al-fnaitees",
      "al-qurain",
      "al-qusour",
      "messila",
      "mubarak al-kabeer",
      "sabah al-salem",
      "south wista",
      "subhan industrial",
      "west abu ftirah hirafyia",
      "wista",
    ],
  };

  const [order, setOrder] = useState(() => {
    const savedOrder = localStorage.getItem("order");
    return savedOrder
      ? JSON.parse(savedOrder)
      : {
          items: [], // frontend cart items
          orderType: "pickup",
          shippingAddress: {
            city: "",
            area: "",
            street: "",
            block: "",
            house: "",
          },
          scheduledSlot: {
            date: new Date().toISOString().split("T")[0], // today
            timeSlot: "08:00 AM - 01:00 PM",
          }, // { date: "YYYY-MM-DD", timeSlot: "08:00 AM - 01:00 PM" }
          message: "", // optional per-item, will map in items
          customerName: "",
          customerPhone: "",
        };
  });

  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order));
  }, [order]);

  /* =======================
     Order setters
  ======================== */
  const setItems = (items) => setOrder((prev) => ({ ...prev, items }));
  const setOrderType = (type) =>
    setOrder((prev) => ({ ...prev, orderType: type }));
  const setShippingAddress = (address) =>
    setOrder((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, ...address },
    }));
  const setScheduledSlot = (slot) =>
    setOrder((prev) => ({
      ...prev,
      scheduledSlot: slot,
    }));
  const setCustomerName = (name) =>
    setOrder((prev) => ({ ...prev, customerName: name }));
  const setCustomerPhone = (phone) =>
    setOrder((prev) => ({ ...prev, customerPhone: phone }));
  const setMessage = (msg) => setOrder((prev) => ({ ...prev, message: msg }));
  const clearOrder = () =>
    setOrder({
      items: [],
      orderType: "pickup",
      shippingAddress: { city: "", area: "", street: "", block: "", house: "" },
      scheduledSlot: null,
      message: "",
      customerName: "",
      customerPhone: "",
    });

  /* =======================
     Order totals
  ======================== */
  const totalAmount = order.items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  /* =======================
     Prepare payload for backend
  ======================== */
  const getOrderPayload = () => {
    return {
      products: order.items.map((item) => ({
        product: item._id, // assumes frontend item has _id from DB
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
      shippingAddress: { ...order.shippingAddress },
      userInfo: {
        name: order.customerName,
        phone: order.customerPhone,
      },
    };
  };

  /* =======================
     Payment method
  ======================== */
  const [paymentMethod, setPaymentMethod] = useState(() => {
    const saved = localStorage.getItem("paymentMethod");
    return saved || "cash";
  });

  useEffect(() => {
    localStorage.setItem("paymentMethod", paymentMethod);
  }, [paymentMethod]);

  return (
    <OrderContext.Provider
      value={{
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
        getOrderPayload,
        areas,
        cityKeys,
        paymentMethod,
        setPaymentMethod,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export default OrderContext;
