// OrderContext.jsx
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
      "al qurain markets",
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
          items: [],
          orderType: "pickup",
          shippingAddress: {
            locationKey: "",
            cityKey: "",
            areaName: "",
            street: "",
            city: "",
            country: "",
          },
          scheduledTime: "",
          message: "",
        };
  });

  useEffect(() => {
    localStorage.setItem("order", JSON.stringify(order));
  }, [order]);

  const setItems = (items) => setOrder((prev) => ({ ...prev, items }));
  const setOrderType = (type) =>
    setOrder((prev) => ({ ...prev, orderType: type }));
  const setShippingAddress = (address) =>
    setOrder((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, ...address },
    }));
  const setScheduledTime = (time) =>
    setOrder((prev) => ({ ...prev, scheduledTime: time }));
  const setMessage = (msg) => setOrder((prev) => ({ ...prev, message: msg }));

  const clearOrder = () =>
    setOrder({
      items: [],
      orderType: "pickup",
      shippingAddress: {
        locationKey: "",
        cityKey: "",
        areaName: "",
        street: "",
        city: "",
        country: "",
      },
      scheduledTime: "",
      message: "",
    });

  const orderTotal = order.items.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );
  const setPickupDate = (date) =>
    setOrder((prev) => ({ ...prev, pickupDate: date }));
  const setPickupTimes = (start, end) =>
    setOrder((prev) => ({
      ...prev,
      pickupStartTime: start,
      pickupEndTime: end,
    }));
  const updateOrder = (newOrderData) => {
    setOrder((prev) => ({ ...prev, ...newOrderData }));
    localStorage.setItem("order", JSON.stringify({ ...prev, ...newOrderData }));
  };

  return (
    <OrderContext.Provider
      value={{
        order,
        setItems,
        setOrderType,
        setShippingAddress,
        setScheduledTime,
        setMessage,
        clearOrder,
        orderTotal,
        areas,
        cityKeys,
        setPickupDate,
        setPickupTimes,
        updateOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export default OrderContext;
