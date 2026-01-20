import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrder } from "../../hooks/useOrder";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth"; // 🔥 NEW: Add auth hook
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
  const location = useLocation();
  const { order, setScheduledSlot } = useOrder();
  const { language, changeLanguage } = useLanguage();
  const { token } = useAuth(); // 🔥 NEW: Get auth token
  const [t, setT] = useState({});

  // 🔥 NEW: Schedule status state
  const [isTodayClosed, setIsTodayClosed] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [adminClosedToday, setAdminClosedToday] = useState(false);

  const apiBase = "https://lilian-backend.onrender.com/api";

  // 🔥 NEW: Check admin schedule status from backend
  const checkAdminScheduleStatus = useCallback(async () => {
    try {
      setScheduleLoading(true);
      const response = await fetch(`${apiBase}/admin/is-today-closed`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAdminClosedToday(data.manuallyClosed || false);
      setIsTodayClosed(data.isClosed || false);
    } catch (error) {
      console.error("Admin schedule check failed:", error);
      // Fallback to time-based check only
      const now = new Date();
      setIsTodayClosed(now.getHours() >= 21);
      setAdminClosedToday(false);
    } finally {
      setScheduleLoading(false);
    }
  }, [apiBase]);

  const getTranslation = useCallback(
    (key, fallback = key) =>
      t[key] || translations[language]?.[key] || fallback,
    [language, t]
  );

  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  // 🔥 Check schedule status on mount and every 5 minutes
  useEffect(() => {
    checkAdminScheduleStatus();
    const interval = setInterval(checkAdminScheduleStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAdminScheduleStatus]);

  const dir = language === "ar" ? "rtl" : "ltr";
  const toggleLanguage = () => changeLanguage(language === "en" ? "ar" : "en");

  const now = new Date();
  const previousPage = location.state?.from || "/";
  const currentHour = now.getHours();
  const currentDateString = getTodayDateString();

  // Time slot boundaries (24h format) + closing times (2hrs before start)
  const timeSlots = [
    {
      display: "10:00 AM - 02:00 PM",
      startHour: 10,
      endHour: 14,
      closesAtHour: 12,
    },
    {
      display: "02:00 PM - 06:00 PM",
      startHour: 14,
      endHour: 18,
      closesAtHour: 16,
    },
    {
      display: "06:00 PM - 11:00 PM",
      startHour: 18,
      endHour: 23,
      closesAtHour: 21,
    },
  ];

  // 🔥 COMBINED LOGIC: Admin closed OR time-based closed
  const isTodayClosedFinal = isTodayClosed || scheduleLoading;

  // Initialize from validated context
  const initialSlot = order?.scheduledSlot || {};
  const [selectedDate, setSelectedDate] = useState(
    initialSlot.date ||
      (isTodayClosedFinal ? getNextDayDateString() : getTodayDateString())
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    initialSlot.startTime || ""
  );
  const [selectedEndTime, setSelectedEndTime] = useState(
    initialSlot.endTime || ""
  );

  const [viewMonth, setViewMonth] = useState(new Date(selectedDate).getMonth());
  const [viewYear, setViewYear] = useState(
    new Date(selectedDate).getFullYear()
  );

  function getNextDayDateString() {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();
  const getMonthName = (year, month) =>
    new Date(year, month, 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

  const isBeforeToday = (year, month, day) => {
    const date = new Date(year, month, day, 0, 0, 0, 0);
    return (
      date <
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    );
  };

  // 🔥 IS TODAY DISABLED IN CALENDAR? (Admin OR Time)
  const isTodayDisabledInCalendar = isTodayClosedFinal;

  const isAtEarliestMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const handleDateSelect = (date, disabled) => {
    if (disabled) return;
    // If today is closed (admin or time) and user tries to select today, go to tomorrow
    if (date === currentDateString && isTodayClosedFinal) {
      setSelectedDate(getNextDayDateString());
      setSelectedStartTime("");
      setSelectedEndTime("");
      setScheduledSlot({ date: getNextDayDateString() });
      return;
    }
    setSelectedDate(date);
    setSelectedStartTime("");
    setSelectedEndTime("");
    setScheduledSlot({ date });
  };

  const parseTimeSlot = (slot) => {
    const [start, end] = slot.display.split(" - ");
    return { start, end };
  };

  // 🔥 FIXED LOGIC: Slot available if currentHour < slot.closesAtHour (ignores admin close for non-today)
  const isTimeSlotAvailable = (slot) => {
    if (selectedDate !== currentDateString) return true;
    return currentHour < slot.closesAtHour;
  };

  const handleTimeSelect = (slot) => {
    if (!isTimeSlotAvailable(slot)) return;

    const { start, end } = parseTimeSlot(slot);
    setSelectedStartTime(start);
    setSelectedEndTime(end);

    const completeSlot = {
      date: selectedDate,
      timeSlot: slot.display,
      startTime: start,
      endTime: end,
    };

    setScheduledSlot(completeSlot);
  };

  const handlePrevMonth = () => {
    if (isAtEarliestMonth) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else setViewMonth(viewMonth - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else setViewMonth(viewMonth + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstDayOfWeek(viewYear, viewMonth);

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateString = `${viewYear}-${String(viewMonth + 1).padStart(
      2,
      "0"
    )}-${String(dayNum).padStart(2, "0")}`;
    return {
      date: dateString,
      num: dayNum,
      year: viewYear,
      month: viewMonth,
      day: dayNum,
    };
  });

  const isComplete =
    selectedDate &&
    timeSlots.some((slot) => {
      const { start, end } = parseTimeSlot(slot);
      return selectedStartTime === start && selectedEndTime === end;
    });

  const handleBack = () => navigate(-1);

  const handleSave = () => {
    const finalSlot = {
      date: selectedDate,
      timeSlot: `${selectedStartTime} - ${selectedEndTime}`,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
    };

    setScheduledSlot(finalSlot);

    if (previousPage && previousPage !== location.pathname) {
      navigate(previousPage, {
        replace: true,
        state: { fromTimePage: true },
      });
    } else {
      navigate("/checkout", { replace: true });
    }
  };

  // 🔥 ENHANCED TODAY STATUS MESSAGE
  const getTodayClosedMessage = () => {
    if (adminClosedToday) {
      return language === "ar"
        ? "اليوم مغلق من قبل الإدارة - أقرب موعد غداً"
        : "Today closed by admin - Earliest available tomorrow";
    }
    return language === "ar"
      ? "اليوم مغلق للحجوزات - أقرب موعد غداً"
      : "Today closed for bookings - Earliest available tomorrow";
  };

  if (scheduleLoading) {
    return (
      <div
        className="min-h-screen p-4 flex items-center justify-center"
        dir={dir}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-[#d2d2d2]">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <h1 className="capitalize font-semibold text-lg">
          {getTranslation("shoppingCart", "Select Time")}
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

      {/* 🔥 ENHANCED TODAY STATUS - Admin OR Time-based */}
      {isTodayClosedFinal && (
        <div className="mx-6 mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl text-center">
          <div className="text-yellow-800 font-semibold text-sm">
            {getTodayClosedMessage()}
          </div>
          {adminClosedToday && (
            <div className="text-yellow-700 text-xs mt-1">
              {language === "ar" ? "تم الإغلاق من قبل الإدارة" : "Admin closed"}
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="p-6 mb-6 w-[400px] mx-auto bg-white rounded-xl shadow-sm">
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

          <div className="grid grid-cols-7 gap-y-2 w-full">
            {[...Array(firstWeekday)].map((_, idx) => (
              <span key={"empty-" + idx} />
            ))}
            {monthDays.map((day) => {
              const disabled =
                isBeforeToday(day.year, day.month, day.day) ||
                (day.date === currentDateString && isTodayDisabledInCalendar);
              const selected = selectedDate === day.date && !disabled;
              return (
                <button
                  key={day.date}
                  onClick={() => handleDateSelect(day.date, disabled)}
                  className={`p-2 rounded-full border-2 font-semibold transition-all duration-200 flex items-center justify-center w-10 h-10 ${
                    disabled
                      ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed pointer-events-none"
                      : "border-gray-200 hover:bg-black hover:text-white cursor-pointer"
                  } ${
                    selected ? "bg-black text-white border-black shadow-md" : ""
                  }`}
                  disabled={disabled}
                  title={
                    disabled && day.date === currentDateString
                      ? language === "ar"
                        ? adminClosedToday
                          ? "اليوم مغلق من قبل الإدارة"
                          : "اليوم مغلق"
                        : adminClosedToday
                        ? "Today closed by admin"
                        : "Today closed"
                      : ""
                  }
                >
                  <span className="text-lg">{day.num}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="p-6 w-[450px] mx-auto mb-5 flex flex-wrap justify-between gap-5">
        {timeSlots.map((slot, idx) => {
          const { start, end } = parseTimeSlot(slot);
          const selected =
            selectedStartTime === start && selectedEndTime === end;
          const available = isTimeSlotAvailable(slot);

          return (
            <button
              key={idx}
              onClick={() => handleTimeSelect(slot)}
              disabled={!available}
              className={`border border-gray-300 py-3 px-8 cursor-pointer transition-colors duration-200 rounded-lg font-semibold text-xs flex items-center justify-center h-14 ${
                selected
                  ? "bg-black text-white border-black shadow-md"
                  : available
                  ? "bg-white text-black hover:bg-black hover:text-white hover:shadow-md"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
              }`}
              title={
                !available && selectedDate === currentDateString
                  ? language === "ar"
                    ? "انتهى وقت هذا الفتحة"
                    : "This slot has closed"
                  : ""
              }
            >
              {slot.display}
            </button>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex items-center justify-center w-full">
        <button
          onClick={handleSave}
          disabled={!isComplete}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all duration-200 shadow-xl shadow-black/10 hover:shadow-2xl active:scale-95 ${
            isComplete
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <FaCheck className="text-sm" />
          <span>{getTranslation("save", "Save")}</span>
        </button>
      </div>
    </div>
  );
}

export default TimePage;
