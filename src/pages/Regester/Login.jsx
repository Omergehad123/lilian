import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function Login() {
  const { login, loginAsGuest, isGuest } = useAuth(); // ✅ Added guest functions
  const { language } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [inputError, setInputError] = useState({
    email: false,
    password: false,
  });

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false); // ✅ Guest loading

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setInputError({
      ...inputError,
      [e.target.name]: false,
    });

    setServerError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    let errors = {};
    let hasError = false;

    if (!form.email) {
      errors.email = true;
      hasError = true;
    }
    if (!form.password) {
      errors.password = true;
      hasError = true;
    }

    setInputError({
      email: !!errors.email,
      password: !!errors.password,
    });

    if (hasError) return;

    setLoading(true);
    setServerError("");

    try {
      const result = await login(form.email, form.password);

      if (!result.success) {
        setServerError(result.error);
      } else {
        navigate("/");
      }
    } catch (error) {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Guest Login Handler
  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setServerError("");

    try {
      const result = await loginAsGuest();
      if (!result.success) {
        setServerError(result.error);
      } else {
        navigate("/");
      }
    } catch (error) {
      setServerError("Guest login failed. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="my-10" dir={dir}>
      <h1 className="capitalize font-semibold text-gray-500 mb-5 text-2xl mx-5">
        {t.loginTitle}
      </h1>

      <form onSubmit={handleLoginSubmit} className="relative h-[65vh]">
        <div className="flex flex-col mx-5">
          <input
            type="email"
            name="email"
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={handleInputChange}
            className={`border-b bg-transparent py-3 text-gray-500 placeholder-gray-400 focus:outline-none ${
              inputError.email ? "border-red-500" : "border-gray-300"
            }`}
          />

          <input
            type="password"
            name="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={handleInputChange}
            className={`border-b bg-transparent py-3 text-gray-500 placeholder-gray-400 focus:outline-none ${
              inputError.password ? "border-red-500" : "border-gray-300"
            }`}
          />

          <Link
            to="/forgot-password"
            className="text-[#0066cc] uppercase text-sm mt-5 text-right"
          >
            {t.forgotPassword}
          </Link>

          {serverError && (
            <p className="text-red-500 text-sm mt-3 font-medium">
              {serverError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`absolute block w-[95%] left-1/2 -translate-x-1/2 -bottom-10 py-3 rounded-md capitalize transition-all duration-300 ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gray-400 hover:bg-gray-500"
          }`}
        >
          {loading ? t.loggingInButton : t.loginButton}
        </button>
      </form>

      {/* ✅ GUEST LOGIN BUTTON SECTION */}
      <div className="mx-5 mt-8">
        <div className="w-full h-px bg-gray-300 mb-4" />

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={guestLoading || isGuest}
          className={`w-full py-3 px-6 rounded-md capitalize transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 ${
            guestLoading || isGuest
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700"
          }`}
        >
          {guestLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              {t.loading || "Loading..."}
            </>
          ) : isGuest ? (
            "✅ Already Guest"
          ) : (
            "👤 Continue as Guest"
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          {t.guestDescription ||
            "Continue shopping without creating an account"}
        </p>
      </div>

      {/* ✅ CREATE ACCOUNT LINK */}
      <div className="mx-5 mt-6 text-center">
        <Link
          to="/signup"
          className="text-[#0066cc] underline text-sm hover:text-[#0052a3]"
        >
          {t.createAccount || "Don't have an account? Create one"}
        </Link>
      </div>
    </div>
  );
}

export default Login;
