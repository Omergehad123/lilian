import React, { useState } from "react";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function Signup() {
  const { register, loading: authLoading } = useAuth();
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
      const result = await register(form);
      if (!result.success) {
        setServerError(result.error);
      } else {
        // Registration success, optionally redirect to login or dashboard
        navigate("/login");
      }
    } catch (err) {
      setServerError("An unexpected error occurred.");
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = () => {
    window.location.href =
      "https://lilian-backend-7bjc.onrender.com/api/auth/google";
  };

  return (
    <div className="my-10" dir={dir}>
      <h1 className="capitalize font-semibold text-gray-500 mb-5 text-2xl mx-5">
        {t.signupTitle}
      </h1>

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

        <span className="my-15 text-gray-500 uppercase font-semibold w-fit mx-auto relative block before:content-[''] before:absolute before:h-[2px] before:w-[90px] before:left-8 before:top-3 before:bg-gray-500 after:content-[''] after:absolute after:h-[2px] after:w-[90px] after:right-8 after:top-3 after:bg-gray-500">
          {t.orLabel}
        </span>

        <h1 className="capitalize font-semibold text-gray-500 mb-5 text-2xl mx-5">
          {t.loginWith}
        </h1>

        <div className="flex flex-col">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-10 px-5 text-[#666D7D] text-sm border-y border-gray-300 py-3 capitalize font-semibold hover:bg-gray-200"
          >
            <FcGoogle className="text-2xl" />
            {t.googleLabel}
          </button>
        </div>

        <button
          type="submit"
          className="absolute w-[95%] left-1/2 -translate-x-1/2 -bottom-10 py-3 bg-gray-300 rounded-md hover:bg-gray-400 transition capitalize"
          disabled={submitting || authLoading}
        >
          {submitting || authLoading
            ? t.signupLoading || "Signing up..."
            : t.signupButton}
        </button>
      </form>
    </div>
  );
}

export default Signup;
