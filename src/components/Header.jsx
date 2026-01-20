import React, { useState, useEffect } from "react";
import {
  FaShoppingCart,
  FaBars,
  FaSearch,
  FaArrowLeft,
  FaInfoCircle,
} from "react-icons/fa";
import { FaClockRotateLeft } from "react-icons/fa6";
import { MdEmail, MdOutlineMenuBook } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage.js";
import translations from "../utils/translations.js";
import { useAuth } from "../hooks/useAuth.js";
import { useCart } from "../hooks/useCart";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState({});

  const { language, changeLanguage } = useLanguage();
  const { user, logout, token } = useAuth(); // ✅ Get token
  const { cart } = useCart();

  const getTranslation = (key, fallback = key) => {
    return t[key] || translations[language]?.[key] || fallback;
  };

  useEffect(() => {
    setT(translations[language] || {});
  }, [language]);

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  // 🔥 PROTECTED ROUTES - Only show if logged in
  const isAuthenticated = user || token;

  return (
    <header
      className={`${
        open ? "justify-center gap-20 " : "gap-0"
      } bg-white shadow flex items-center justify-between px-8 py-4 transition-all duration-500`}
    >
      {/* Logo and Brand */}
      <div className="hidden lg:flex items-center gap-4">
        <img
          src="https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/lilyan-logo_n7koge.jpg"
          alt="Logo"
          className="w-[100px] object-contain"
        />
        <div>
          <h1 className="font-bold capitalize text-xl">
            {getTranslation("heroTitle", "Lilyan De Larose")}
          </h1>
          <p className="text-[#777] text-sm mt-1">
            {getTranslation("heroSubtitle", "Your slogan here")}
          </p>
        </div>
      </div>

      {/* Mobile Logo */}
      <div className="lg:hidden">
        <img
          src="https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/lilyan-logo_n7koge.jpg"
          alt="Logo"
          className="w-12 h-12 object-contain"
        />
      </div>

      {/* Actions: Button + Links */}
      <div className="flex items-center justify-between gap-4 w-full lg:w-fit">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center cursor-pointer"
          type="button"
          aria-label="Open menu"
        >
          <FaBars className="text-lg text-black" />
        </button>

        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            <Link to="/cart" className="relative">
              <FaShoppingCart className="text-lg text-black" />
              {cart && cart.length > 0 && (
                <span
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold flex items-center justify-center min-w-[20px] h-[20px] leading-none border-2 border-white shadow"
                  style={{ fontSize: "12px" }}
                  aria-label={`Cart count: ${cart.length}`}
                >
                  {cart.length}
                </span>
              )}
            </Link>
          </div>

          <Link to="/search" className="flex items-center justify-center">
            <FaSearch className="text-lg text-black" />
          </Link>

          <button
            className="flex items-center justify-center cursor-pointer pb-2"
            type="button"
            onClick={toggleLanguage}
          >
            <span className="text-lg text-black">
              {language === "en" ? "EN" : "ع"}
            </span>
          </button>
        </div>
      </div>

      {/* Side Navbar */}
      <div
        className={`
          lg:w-[300px] w-full fixed top-0 h-full bg-white z-50 transition-all duration-300 shadow-xl px-5 py-3
          ${open ? "left-0" : "-left-[150rem]"}
        `}
      >
        <div className="flex items-center justify-between border-b border-[#ddd] pb-5 mb-5">
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer"
            aria-label="Close menu"
            type="button"
          >
            <FaArrowLeft className="text-lg text-[#666D7D]" />
          </button>

          <button
            className="cursor-pointer"
            type="button"
            onClick={toggleLanguage}
          >
            <span className="text-lg text-black">
              {language === "en" ? "EN" : "ع"}
            </span>
          </button>
        </div>

        {/* Main menu */}
        <div>
          <span className="capitalize text-lg text-[#666D7D] font-semibold border-b border-[#dddd] pb-3 block mb-2">
            {getTranslation("menuTitle", "Menu")}
          </span>

          <nav className="flex flex-col gap-2">
            <Link
              to="/cart"
              className="flex items-center gap-10 text-[#666D7D] text-sm border-b border-[#dddd] pb-3 capitalize font-semibold relative hover:text-black transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center justify-center relative">
                <FaShoppingCart className="text-lg text-[#666D7D]" />
                {cart && cart.length > 0 && (
                  <span
                    className="absolute -top-2 -right-3 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold flex items-center justify-center min-w-[20px] h-[20px] leading-none border-2 border-white shadow"
                    style={{ fontSize: "12px" }}
                    aria-label={`Cart count: ${cart.length}`}
                  >
                    {cart.length}
                  </span>
                )}
              </span>
              {getTranslation("Cart", "My Cart")}
            </Link>

            <Link
              to="/"
              className="flex items-center gap-10 text-[#666D7D] text-sm border-b border-[#dddd] pb-3 capitalize font-semibold hover:text-black transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center justify-center">
                <MdOutlineMenuBook className="text-lg text-[#666D7D]" />
              </span>
              {getTranslation("menuItems", "Menu")}
            </Link>

            {/* 🔥 ORDERS LINK - Only show if authenticated */}
            {isAuthenticated ? (
              <Link
                to="/orders"
                className="flex items-center gap-10 text-[#666D7D] text-sm border-b border-[#dddd] pb-3 capitalize font-semibold hover:text-black transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="flex items-center justify-center">
                  <FaClockRotateLeft className="text-lg text-[#666D7D]" />
                </span>
                {getTranslation("orders", "My Orders")}
              </Link>
            ) : (
              <div className="flex items-center gap-10 text-gray-400 text-sm border-b border-[#dddd] pb-3">
                <span className="flex items-center justify-center">
                  <FaClockRotateLeft className="text-lg text-gray-400" />
                </span>
                {getTranslation("orders", "My Orders")} (Login required)
              </div>
            )}

            <Link
              to="/aboutUs"
              className="flex items-center gap-10 text-[#666D7D] text-sm border-b border-[#dddd] pb-3 capitalize font-semibold hover:text-black transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center justify-center">
                <FaInfoCircle className="text-lg text-[#666D7D]" />
              </span>
              {getTranslation("about", "About Us")}
            </Link>
          </nav>
        </div>

        {/* Auth section */}
        {!isAuthenticated ? (
          <div className="mt-10">
            <span className="capitalize text-lg text-[#666D7D] font-semibold border-b border-[#dddd] pb-3 block mb-4">
              {getTranslation("regester", "Sign in with")}
            </span>

            <nav className="flex flex-col gap-3">
              <Link
                to="/register"
                className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:shadow-sm"
                onClick={() => setOpen(false)}
              >
                <span className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MdEmail className="text-xl text-gray-600" />
                </span>
                <span className="font-semibold text-gray-800">Email</span>
              </Link>
            </nav>
          </div>
        ) : (
          <div className="mt-10 border-t border-[#dddd] pt-4">
            <span className="text-sm text-[#666D7D] font-semibold capitalize">
              {language === "ar" ? "مرحبا" : "Hello"}{" "}
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold uppercase tracking-wide transition-all shadow-md hover:shadow-lg mt-3"
            >
              {language === "ar" ? "تسجيل الخروج" : "Logout"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
