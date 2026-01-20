import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function Signup() {
  const {
    register,
    upgradeGuest,
    loginAsGuest,
    isGuest,
    loading: authLoading,
  } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [inputError, setInputError] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false); // ✅ Guest loading

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setInputError({ ...inputError, [e.target.name]: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    let errors = {};
    Object.keys(form).forEach((key) => {
      if (!form[key]) errors[key] = true;
    });

    setInputError(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      let result;

      if (isGuest) {
        result = await upgradeGuest(form);
      } else {
        result = await register(form);
      }

      if (!result.success) {
        setServerError(result.error);
      } else {
        navigate("/");
      }
    } catch (err) {
      setServerError("Network error");
    }
    setSubmitting(false);
  };

  // ✅ NEW: Guest Login Handler (same as Login component)
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

  const getTitle = () => {
    if (isGuest) {
      return t.upgradeAccountTitle || "Complete Your Account";
    }
    return t.signupTitle || "Create Account";
  };

  const getButtonText = () => {
    if (submitting || authLoading) {
      return t.signupLoading || "Creating account...";
    }
    if (isGuest) {
      return t.upgradeButton || "Complete Registration";
    }
    return t.signupButton || "Create Account";
  };

  return (
    <div className="my-10" dir={dir}>
      <h1 className="capitalize font-semibold text-gray-500 mb-5 text-2xl mx-5">
        {getTitle()}
      </h1>

      {/* ✅ Guest Status Badge */}
      {isGuest && (
        <div className="mx-5 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-blue-800">
            {t.upgradeGuestMessage ||
              "You have items in your cart. Complete registration to save them!"}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative min-h-[75vh]">
        <div className="flex flex-col mx-5">
          <input
            type="text"
            name="firstName"
            placeholder={t.firstNamePlaceholder}
            value={form.firstName}
            onChange={handleInputChange}
            className={`border-b py-3 bg-transparent focus:outline-none ${
              inputError.firstName ? "border-red-500" : "border-gray-300"
            }`}
            autoComplete="given-name"
          />

          <input
            type="text"
            name="lastName"
            placeholder={t.lastNamePlaceholder}
            value={form.lastName}
            onChange={handleInputChange}
            className={`border-b py-3 bg-transparent focus:outline-none ${
              inputError.lastName ? "border-red-500" : "border-gray-300"
            }`}
            autoComplete="family-name"
          />

          <input
            type="email"
            name="email"
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={handleInputChange}
            className={`border-b py-3 bg-transparent focus:outline-none ${
              inputError.email ? "border-red-500" : "border-gray-300"
            }`}
            autoComplete="email"
          />

          <input
            type="password"
            name="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={handleInputChange}
            className={`border-b py-3 bg-transparent focus:outline-none ${
              inputError.password ? "border-red-500" : "border-gray-300"
            }`}
            autoComplete="new-password"
          />
        </div>

        {serverError && (
          <p className="text-red-500 text-sm mt-3 mx-5">{serverError}</p>
        )}

        <button
          type="submit"
          className={`absolute w-[95%] left-1/2 -translate-x-1/2 -bottom-10 py-3 rounded-md transition capitalize font-medium ${
            submitting || authLoading
              ? "bg-gray-300 cursor-not-allowed"
              : isGuest
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 hover:bg-gray-400"
          }`}
          disabled={submitting || authLoading}
        >
          {getButtonText()}
        </button>
      </form>

      {/* ✅ GUEST LOGIN BUTTON SECTION - SAME AS LOGIN */}
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
              Loading...
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

      {/* ✅ Back to Login Link */}
      <div className="mx-5 mt-6 text-center">
        <Link
          to="/login"
          className="text-[#0066cc] underline text-sm hover:text-[#0052a3] inline-flex items-center gap-1"
        >
          ← {t.backToLogin || "Back to Login"}
        </Link>
      </div>
    </div>
  );
}

export default Signup;
