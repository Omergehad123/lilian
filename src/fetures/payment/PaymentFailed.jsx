function PaymentFailed() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5]">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          ❌ Payment Failed
        </h1>

        <p className="text-gray-700 mb-6">
          Something went wrong with your payment. Please try again.
        </p>

        <button
          onClick={() => (window.location.href = "/checkout")}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default PaymentFailed;
