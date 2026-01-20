import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaHome, FaShoppingCart } from "react-icons/fa";

function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorReason, setErrorReason] = useState("Unknown error");
  
  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('//payment-failed')) {
      const cleanUrl = currentUrl.replace(/\/\//g, '/');
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  useEffect(() => {
    const paymentId = searchParams.get("paymentId") || searchParams.get("Id");
    const error = searchParams.get("error");

    if (error) {
      const messages = {
        no_payment_id: "No payment ID received",
        not_paid: "Payment was not completed",
        server_error: "Server error occurred",
      };
      setErrorReason(messages[error] || error);
    }

    console.log("Payment failed details:", { paymentId, error });
  }, [searchParams]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 py-12 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-red-100">
        {/* Icon */}
        <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="text-4xl text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-gray-900 mb-4">
          ❌ Payment Failed
        </h1>

        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <p className="text-red-800 font-semibold mb-2">Payment ID:</p>
          <p className="text-sm text-red-700 bg-white px-3 py-1 rounded-lg font-mono">
            {searchParams.get("paymentId") || searchParams.get("Id") || "N/A"}
          </p>
          {errorReason !== "Unknown error" && (
            <>
              <p className="text-red-800 font-semibold mt-4 mb-2">Reason:</p>
              <p className="text-sm text-red-700">{errorReason}</p>
            </>
          )}
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-8 text-lg leading-relaxed">
          Something went wrong with your payment. No charges were made to your
          card.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FaShoppingCart />
            Try Payment Again
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-100 text-gray-900 px-6 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border"
          >
            <FaHome />
            Back to Home
          </button>
        </div>

        {/* Support */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500 mb-2">Need help?</p>
          <p className="text-xs text-blue-600 font-semibold hover:text-blue-700 cursor-pointer">
            Contact support → support@lilyandelarosekw.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailed;
