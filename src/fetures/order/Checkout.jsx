import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useOrder } from "../../hooks/useOrder";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import { FaMotorcycle } from "react-icons/fa";

const Checkout = () => {
  const { order, setCustomerName, setCustomerPhone, setShippingAddress } =
    useOrder();
  const { cart } = useCart();
  const navigate = useNavigate();

  const inputBase =
    "lg:w-[400px] w-full p-1 border-b focus:outline-none text-gray-700";
  const buttonBase =
    "w-full px-4 py-2 rounded-xl font-semibold flex items-center justify-center";

  // orderType to determine if pickup or delivery
  const orderType = order?.orderType || "delivery";

  // Shipping & customer info
  const [street, setStreet] = useState(order.shippingAddress?.street || "");
  const [block, setBlock] = useState(order.shippingAddress?.block || "");
  const [house, setHouse] = useState(order.shippingAddress?.house || "");
  const [name, setName] = useState(order.customerName || "");
  const [phone, setPhone] = useState(order.customerPhone || "");

  const orderTotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Helpers for displaying location and schedule info
  const getLocationDisplay = () => {
    if (!order.shippingAddress) return "Not set";
    const { city, area, street, block, house } = order.shippingAddress;
    let parts = [];
    if (city) parts.push(city);
    if (area) parts.push(area);
    if (street) parts.push("St " + street);
    if (block) parts.push("Blck " + block);
    if (house) parts.push("Hse " + house);
    if (!parts.length) return "Not set";
    return parts.join(", ");
  };

  const getScheduleDisplay = () => {
    const slot = order.scheduledSlot;
    if (!slot || !slot.date || !slot.startTime || !slot.endTime) {
      return "Not set";
    }
    const dtObj = new Date(slot.date);
    const dateStr = isNaN(dtObj)
      ? slot.date
      : dtObj.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
    return `${dateStr} (${slot.startTime} - ${slot.endTime})`;
  };

  const handleSaveAndNavigateToReview = () => {
    // Only save street/block/house for delivery type
    if (orderType === "pickup") {
      setShippingAddress({});
    } else {
      setShippingAddress({
        street,
        block: block === "" ? "" : Number(block),
        house: house === "" ? "" : Number(house)
      });
    }
    setCustomerName(name);
    setCustomerPhone(phone);

    navigate("/reviewOrder");
  };

  // Form validation: require street/block/house for delivery, but not pickup
  const isFormValid =
    (orderType === "pickup" ||
      (street.trim() && block.toString().trim() && house.toString().trim())) &&
    name.trim() &&
    phone.trim();

  const handleSelectType = () => {
    navigate("/orderMode");
  };

  // Handlers for numeric only input for block and house
  const handleBlockChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setBlock(value);
  };

  const handleHouseChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setHouse(value);
  };

  return (
    <div className="min-h-screen " dir="ltr">
      {/* Header */}
      <div className=" flex items-center justify-between px-5 py-3 border-b sticky top-0">
        <button onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h1 className="font-bold text-xl">Checkout</h1>
        <button>EN</button>
      </div>

      <div className="p-8 lg:w-[60%] w-[95%] mx-auto rounded-2xl">
        <div className="flex items-center justify-center gap-5 my-5">
          <button
            onClick={() => handleSelectType("delivery")}
            className={`capitalize px-6 py-3 text-sm transition-all duration-200
              ${
                orderType === "delivery"
                  ? "border-b-2 border-black text-black font-semibold"
                  : "border-b-0 text-gray-500 font-normal"
              }`}
            disabled={orderType === "delivery"}
            style={orderType === "delivery" ? {} : { cursor: "pointer" }}
          >
            Delivery
          </button>
          <button
            onClick={() => handleSelectType("pickup")}
            className={`capitalize px-6 py-3 text-sm transition-all duration-200
              ${
                orderType === "pickup"
                  ? "border-b-2 border-black text-black font-semibold"
                  : "border-b-0 text-gray-500 font-normal"
              }`}
            disabled={orderType === "pickup"}
            style={orderType === "pickup" ? {} : { cursor: "pointer" }}
          >
            Pickup
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 w-full mb-9">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="capitalize text-[#777] text-md">Deliver to</span>
              <div className="flex items-center gap-3">
                <FaMotorcycle className="text-[#777] text-xl" />
                <span className="capitalize text-black font-semibold text-md">
                  {getLocationDisplay()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                onClick={() => navigate("/orderMode")}
              >
                Edit
              </button>
            </div>
          </div>
          {/* Earliest arrival */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="capitalize text-[#777] text-md">
                Earliest arrival
              </span>
              <div className="flex items-center gap-3">
                <FiClock className="text-[#777] text-xl" />
                <span className="capitalize text-black font-semibold text-md">
                  {getScheduleDisplay()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="capitalize text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                onClick={() => navigate("/time")}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        <form className="space-y-5 mb-8 flex items-center gap-5 justify-center flex-wrap">
          {orderType !== "pickup" ? (
            <>
              <div>
                <input
                  className={inputBase}
                  placeholder="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder="block"
                  value={block}
                  onChange={handleBlockChange}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder="house"
                  value={house}
                  onChange={handleHouseChange}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <input
                  className={inputBase}
                  placeholder="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <input
                  className={inputBase}
                  placeholder="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}
        </form>

        <h3 className="text-xl font-semibold text-center mb-6">
          Total: KWD {orderTotal}
        </h3>

        <div className="flex flex-col gap-4">
          <button
            className={`${buttonBase} ${
              isFormValid
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleSaveAndNavigateToReview}
            type="button"
            disabled={!isFormValid}
          >
            Review Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
