import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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

function App() {
  const location = useLocation();
  const hideHeaderFooter =
    location.pathname === "/register" ||
    location.pathname === "/cart" ||
    location.pathname === "/checkout" ||
    location.pathname === "/orderMode" ||
    location.pathname === "/aboutUs" ||
    location.pathname === "/time" ||
    location.pathname === "/search";

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
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default App;
