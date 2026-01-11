import React, { useState } from "react";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function Login() {
  const { login } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

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
    const result = await login(form.email, form.password);
    setLoading(false);

    if (!result.success) {
      setServerError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href =
      "https://lilian-backend-7bjc.onrender.com/api/auth/google";
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
            to=""
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
    </div>
  );
}

export default Login;
