import React, { useState, useMemo } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../hooks/useCart";
import { useLanguage } from "../../hooks/useLanguage";
import translations from "../../utils/translations";

function ProductPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { products } = useProducts();
  const {
    cart,
    addToCart,
    removeFromCart,
    decreaseItemQty,
    increaseItemQty,
    cartTotal,
  } = useCart();

  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [message, setMessage] = useState("");

  const handleBack = () => {
    navigate(-1);
  };

  const toggleLanguage = () => {
    changeLanguage(language === "en" ? "ar" : "en");
  };

  // Find product by slug
  const product = useMemo(
    () =>
      Array.isArray(products) ? products.find((p) => p.slug === slug) : null,
    [products, slug]
  );

  if (!product) {
    const notFoundText =
      language === "ar" ? "المنتج غير موجود" : "Product Not Found";
    return (
      <div
        className="flex flex-col min-h-screen items-center justify-center bg-[#eee]"
        dir={dir}
      >
        <div className="bg-white px-6 py-4 rounded shadow">{notFoundText}</div>
      </div>
    );
  }

  // Localized product fields (schema has .en / .ar)
  const name =
    product.name?.[language] ||
    product.name?.en ||
    product.name?.ar ||
    (language === "ar" ? "منتج" : "Product");

  const description =
    product.description?.[language] ||
    product.description?.en ||
    product.description?.ar ||
    (language === "ar" ? "لا يوجد وصف متاح." : "No description available.");

  const preparation =
    product.preparation?.[language] ||
    product.preparation?.en ||
    product.preparation?.ar ||
    "";

  const width =
    product.dimensions?.width?.[language] ||
    product.dimensions?.width?.en ||
    product.dimensions?.width?.ar ||
    "";

  const height =
    product.dimensions?.height?.[language] ||
    product.dimensions?.height?.en ||
    product.dimensions?.height?.ar ||
    "";

  const price = product.price || 0;

  // Current cart item and quantity
  const cartItem = cart?.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Labels (can be moved into translations.js if you prefer)
  const preparationLabel = language === "ar" ? "مدة التحضير:" : "Preparation:";
  const defaultPrepValue = language === "ar" ? "ساعتان" : "2 hours";
  const heightLabel = language === "ar" ? "الارتفاع:" : "Height:";
  const widthLabel = language === "ar" ? "العرض:" : "Width:";
  const priceLabel = language === "ar" ? "السعر" : "Price";
  const messageLabel =
    language === "ar"
      ? "اكتب رسالة البطاقة هنا"
      : "Write Your Card Message here";
  const optionalLabel = language === "ar" ? "(اختياري)" : "(Optional)";
  const messagePlaceholder =
    language === "ar" ? "مثال: أطيب التمنيات!" : "Ex: Best wishes!";
  const quantityHint =
    language === "ar"
      ? "يمكنك ضبط الكمية بعد إضافة المنتج إلى السلة"
      : "Set quantity after adding to cart";
  const addToCartLabel = language === "ar" ? "أضف إلى السلة" : "Add to Cart";
  const removeFromCartLabel =
    language === "ar" ? "إزالة من السلة" : "Remove from Cart";
  const cartTotalLabel = language === "ar" ? "إجمالي السلة:" : "Cart Total:";
  const headerBackTitle = language === "ar" ? name : name; // same text; direction handles layout

  // Add item to cart with initial quantity 1 and message
  const handleAddToCart = () => {
    if (!cartItem) {
      addToCart({ ...product, quantity: 1, message });
    }
  };

  const handleIncrease = () => {
    if (cartItem) {
      increaseItemQty(product.id);
    }
  };

  const handleDecrease = () => {
    if (cartItem && cartItem.quantity > 1) {
      decreaseItemQty(product.id);
    }
  };

  const handleRemoveFromCart = () => {
    if (cartItem) {
      removeFromCart(product.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-semibold text-lg">{headerBackTitle}</p>
        <button
          className="cursor-pointer pb-1"
          type="button"
          onClick={toggleLanguage}
        >
          <span className="text-lg text-black">
            {language === "en" ? "EN" : "ع"}
          </span>
        </button>
      </div>

      {/* Centered product section */}
      <div className="flex-1 flex flex-col items-center w-full">
        {/* Image */}
        <div className="flex justify-center items-center mt-6">
          {product.image ? (
            <img
              src={product.image}
              alt={name}
              className="object-cover rounded-xl shadow-lg bg-white max-w-full"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="w-[350px] h-[230px] flex items-center justify-center rounded-xl bg-gray-200 text-gray-400 text-xl shadow-lg">
              {language === "ar" ? "لا توجد صورة" : "No Image Available"}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg mt-7 px-8 py-7 w-full max-w-xl">
          <h1 className="text-xl font-semibold mb-2">{name}</h1>
          <p className="text-gray-700 mb-3 text-sm">{description}</p>

          {/* Preparation / Dimensions */}
          <div className="mb-4 text-black/60 text-xs space-y-1">
            {preparation ? (
              <div>
                <span>{preparationLabel} </span>
                <span className="text-black font-semibold">{preparation}</span>
              </div>
            ) : (
              <p>
                {preparationLabel}{" "}
                <span className="text-black font-semibold">
                  {defaultPrepValue}
                </span>
              </p>
            )}

            {(height || width) && (
              <div className="flex items-center gap-1">
                {height && (
                  <>
                    <span className="font-semibold">{heightLabel}</span>
                    <span className="text-black font-semibold">{height}</span>
                  </>
                )}
                {height && width && <span className="mx-1 text-2xl">-</span>}
                {width && (
                  <>
                    <span className="font-semibold">{widthLabel}</span>
                    <span className="text-black font-semibold">{width}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-black/60">{priceLabel}</span>
            <span>{(price * (quantity || 1)).toFixed(3)} KWD</span>
          </div>

          {/* Message input */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-600">
              {messageLabel}{" "}
              <span className="text-gray-400">{optionalLabel}</span>
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messagePlaceholder}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-[#032117]/20 mb-1"
              disabled={!!cartItem}
            />
          </div>

          {/* Quantity selector */}
          {cartItem ? (
            <div className="flex items-center justify-center gap-5 mb-8">
              <button
                onClick={handleDecrease}
                className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-lg font-bold text-[#032117] bg-gray-100 hover:bg-gray-200"
                aria-label="Decrease quantity"
                type="button"
                disabled={cartItem.quantity <= 1}
              >
                –
              </button>
              <span className="w-8 text-center text-lg">
                {cartItem.quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-lg font-bold text-[#032117] bg-gray-100 hover:bg-gray-200"
                aria-label="Increase quantity"
                type="button"
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5 mb-8">
              <span className="text-gray-400 text-sm">{quantityHint}</span>
            </div>
          )}

          {/* Cart operations */}
          <div className="flex flex-col gap-2">
            {!cartItem && (
              <button
                className="w-full bg-[#032117] hover:bg-[#054a27] transition text-white font-semibold py-3 rounded-lg text-base"
                onClick={handleAddToCart}
                type="button"
              >
                {addToCartLabel} {price.toFixed(3)} KWD
              </button>
            )}
            {cartItem && (
              <button
                className="w-full bg-red-600 hover:bg-red-700 transition text-white font-semibold py-2 rounded-lg text-base"
                onClick={handleRemoveFromCart}
                type="button"
              >
                {removeFromCartLabel}
              </button>
            )}
          </div>

          {/* Cart total */}
          <div className="mt-4 text-right text-sm text-gray-600">
            <span className="font-semibold">{cartTotalLabel} </span>
            {cartTotal.toFixed(3)} KWD
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
