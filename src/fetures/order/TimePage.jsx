import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../hooks/useOrder";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function TimePage() {
  const navigate = useNavigate();
  const { order, updateOrder, setScheduledTime } = useOrder();
  const { language, changeLanguage } = useLanguage();
  const [t, setT] = useState({});

  const getTranslation = useCallback(
    (key, fallback = key) => {
      return t[key] || translations[language]?.[key] || fallback;
    },
    [language, t]
  );
  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  const dir = language === "ar" ? "rtl" : "ltr";
  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };
  // Today is min allowed
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(
    order?.pickupDate ? new Date(order.pickupDate).getMonth() : today.getMonth()
  );
  const [viewYear, setViewYear] = useState(
    order?.pickupDate
      ? new Date(order.pickupDate).getFullYear()
      : today.getFullYear()
  );

  const [selectedDate, setSelectedDate] = useState(
    order?.pickupDate || getTodayDateString()
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    order?.pickupStartTime || ""
  );
  const [selectedEndTime, setSelectedEndTime] = useState(
    order?.pickupEndTime || ""
  );

  const timeSlots = [
    "08:00 AM - 01:00 PM",
    "01:00 PM - 06:00 PM",
    "06:00 PM - 11:00 PM",
  ];

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function getMonthName(year, month) {
    return new Date(year, month, 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }

  function isBeforeToday(year, month, day) {
    const date = new Date(year, month, day, 0, 0, 0, 0);
    return (
      date <
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      )
    );
  }

  const isAtEarliestMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const handleDateSelect = (date, disabled) => {
    if (disabled) return;

    setSelectedDate(date);
    setSelectedStartTime("");
    setSelectedEndTime("");

    updateOrder({
      pickupDate: date,
      pickupStartTime: "",
      pickupEndTime: "",
      scheduledTime: "",
    });
  };

  const handleTimeSelect = (slot) => {
    const { start, end } = parseTimeSlot(slot);
    setSelectedStartTime(start);
    setSelectedEndTime(end);

    updateOrder({
      pickupDate: selectedDate,
      pickupStartTime: start,
      pickupEndTime: end,
      scheduledTime: `${selectedDate}T${start
        .replace(" AM", "")
        .replace(" PM", "")}:00.000Z`,
    });

    setScheduledTime(
      `${selectedDate}T${start.replace(" AM", "").replace(" PM", "")}:00.000Z`
    );
  };

  const parseTimeSlot = (slot) => {
    const parts = slot.split(" - ");
    return { start: parts[0], end: parts[1] };
  };

  const handlePrevMonth = () => {
    if (isAtEarliestMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstDayOfWeek(viewYear, viewMonth);

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const num = i + 1;
    const dateString = `${viewYear}-${String(viewMonth + 1).padStart(
      2,
      "0"
    )}-${String(num).padStart(2, "0")}`;
    return {
      date: dateString,
      num,
      year: viewYear,
      month: viewMonth,
      day: num,
    };
  });

  const isComplete = selectedDate && selectedStartTime && selectedEndTime;

  const handleBack = () => {
    navigate(-1);
  };

  // Fix: Ensure navigation happens after order updates are truly applied in state.
  const handleSave = () => {
    if (isComplete) {
      updateOrder({
        pickupDate: selectedDate,
        pickupStartTime: selectedStartTime,
        pickupEndTime: selectedEndTime,
        scheduledTime: `${selectedDate}T${selectedStartTime
          .replace(" AM", "")
          .replace(" PM", "")}:00.000Z`,
      });
      // Use setTimeout to navigate on next tick so updateOrder's state flushes first.
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 0);
    }
  };

  return (
    <div className="min-h-screen p-4 relative" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2]">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">
          {getTranslation("shoppingCart", "Shopping Cart")}
        </h1>
        <button
          className="flex items-center justify-center cursor-pointer pb-2"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "ع" : "EN"}
          </span>
        </button>
      </div>

      {/* Calendar Section */}
      <div className="p-6 mb-6 w-[400px] mx-auto bg-white rounded-xl shadow-sm">
        {/* Month Header */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
          <button
            className={`flex items-center justify-center rounded-full w-10 h-10 bg-transparent transition-all duration-300 cursor-pointer ${
              isAtEarliestMonth
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-200"
            }`}
            onClick={handlePrevMonth}
            disabled={isAtEarliestMonth}
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {getMonthName(viewYear, viewMonth)}
          </h2>
          <button
            className="flex items-center justify-center rounded-full w-10 h-10 bg-transparent hover:bg-gray-200 transition-all duration-300 cursor-pointer"
            onClick={handleNextMonth}
          >
            <FaArrowRight />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* Days of week header */}
          <div className="grid grid-cols-7 w-full mb-2">
            {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
              <span
                key={day}
                className="text-sm text-gray-500 font-semibold text-center"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days numbers in calendar-style grid */}
          <div className="grid grid-cols-7 gap-y-2 w-full">
            {[...Array(firstWeekday)].map((_, idx) => (
              <span key={"empty-" + idx} />
            ))}
            {monthDays.map((day) => {
              const disabled = isBeforeToday(day.year, day.month, day.day);
              return (
                <button
                  key={day.date}
                  onClick={() => handleDateSelect(day.date, disabled)}
                  className={`
                    p-2 rounded-full border-2 font-semibold transition-all duration-200 flex items-center justify-center w-10 h-10
                    ${
                      disabled
                        ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed pointer-events-none"
                        : "border-gray-200 hover:bg-black hover:text-white cursor-pointer"
                    }
                    ${
                      selectedDate === day.date && !disabled
                        ? "bg-black text-white border-black shadow-md"
                        : ""
                    }
                  `}
                  disabled={disabled}
                >
                  <span className="text-lg">{day.num}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="p-6 w-[450px] mx-auto mb-5">
        <div className="flex items-center flex-wrap justify-between gap-5">
          {timeSlots.map((time, idx) => {
            const { start, end } = parseTimeSlot(time);
            const selected =
              selectedStartTime === start && selectedEndTime === end;
            return (
              <button
                key={idx}
                onClick={() => handleTimeSelect(time)}
                className={
                  `border border-gray-300 py-3 px-8 cursor-pointer transition-colors duration-200 rounded-lg font-semibold text-xs flex items-center justify-center h-14 ` +
                  (selected
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-white text-black hover:bg-black hover:text-white hover:shadow-md")
                }
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center w-full">
        <button
          onClick={handleSave}
          disabled={!isComplete}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all duration-200 shadow-xl
            shadow-black/10 hover:shadow-2xl active:scale-95
            ${
              isComplete
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          <FaCheck className="text-sm" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}

export default TimePage;
