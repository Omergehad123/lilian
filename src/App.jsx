import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Homepage from "./pages/HomePage/Homepage";
import Register from "./pages/Regester/Register";
import AboutUs from "./pages/AboutUs";
import Cart from "./components/Cart";
import Search from "./components/Search";
import Checkout from "./fetures/order/Checkout";
import OrderMode from "./fetures/order/OrderMode";
import TimePage from "./fetures/order/TimePage";
import ProductPage from "./fetures/products/ProductPage";
import Orders from "./pages/Orders/Orders";
import OrderDetails from "./pages/Orders/OrderDetails";
import PaymentSuccess from "./fetures/payment/PaymentSuccess";
import PaymentFailed from "./fetures/payment/PaymentFailed";
import ReviewOrder from "./fetures/order/ReviewOrder";

function App() {
  const location = useLocation();

  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  const hideHeaderFooter = [
    "/register",
    "/cart",
    "/checkout",
    "/orderMode",
    "/about-us",
    "/aboutUs",
    "/time",
    "/orders",
    "/order/:orderId",
    "/payment-success",
    "/payment-failed",
    "/reviewOrder",
    "/search",
  ].includes(location.pathname);

  useEffect(() => {
    if (import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    }
  }, []);
  return (
    <div className="App">
      {!hideHeaderFooter && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/search" element={<Search />} />
          <Route path="/time" element={<TimePage />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orderMode" element={<OrderMode />} />
          <Route path="/aboutUs" element={<AboutUs />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/reviewOrder" element={<ReviewOrder />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default App;
