// Header.jsx
import React, { useState, useEffect } from "react";
import {
  FaShoppingCart,
  FaBars,
  FaSearch,
  FaArrowLeft,
  FaApple,
  FaInfoCircle,
} from "react-icons/fa";
import { FaClockRotateLeft } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { MdEmail, MdOutlineMenuBook } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage.js";
import translations from "../utils/translations.js";
import { useAuth } from "../hooks/useAuth.js";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState({});

  const { language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();

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
            {getTranslation("heroTitle", "Lilian De Larose")}
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
        {/* Button to open navbar */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center cursor-pointer"
          type="button"
          aria-label="Open menu"
        >
          <FaBars className="text-lg text-black" />
        </button>

        {/* Links */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            <Link to="/cart" className="relative">
              <FaShoppingCart className="text-lg text-black" />
            </Link>
          </div>

          <Link to="/search" className="flex items-center justify-center">
            <FaSearch className="text-lg text-black" />
          </Link>

          {/* Global language toggle */}
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

          {/* Same toggle inside sidebar */}
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
        {!user ? (
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

              <a
                href="http://localhost:5000/auth/google"
                className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:shadow-sm"
              >
                <span className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FcGoogle className="text-xl" />
                </span>
                <span className="font-semibold text-gray-800">
                  {getTranslation("googleLabel", "Google")}
                </span>
              </a>

              <a
                href="http://localhost:5000/auth/apple"
                className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:shadow-sm"
              >
                <span className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FaApple className="text-xl text-gray-600" />
                </span>
                <span className="font-semibold text-gray-800">
                  {getTranslation("appleLabel", "Apple")}
                </span>
              </a>
            </nav>
          </div>
        ) : (
          <div className="mt-10 border-t border-[#dddd] pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#666D7D] font-semibold capitalize">
                {language === "ar" ? "مرحبا" : "Hello"}{" "}
                {user.firstName ||
                  user.name ||
                  user.email?.split("@")[0] ||
                  "User"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold uppercase tracking-wide transition-all shadow-md hover:shadow-lg"
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
