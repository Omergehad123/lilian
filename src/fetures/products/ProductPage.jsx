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
  // ✅ NEW: State for selected main image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  // ✅ NEW: Get all images (support both new images array and legacy single image)
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

  // ✅ NEW: Main image URL
  const mainImage =
    productImages[selectedImageIndex] || "/placeholder-image.jpg";

  // Localized product fields
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

  const price = product.price || product.actualPrice || 0;

  // Current cart item and quantity
  const cartItem = cart?.find((item) => item.id === product._id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Labels
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

  const handleAddToCart = () => {
    if (!cartItem) {
      addToCart({ ...product, quantity: 1, message });
    }
  };

  const handleIncrease = () => {
    if (cartItem) {
      increaseItemQty(product._id);
    }
  };

  const handleDecrease = () => {
    if (cartItem && cartItem.quantity > 1) {
      decreaseItemQty(product._id);
    }
  };

  const handleRemoveFromCart = () => {
    if (cartItem) {
      removeFromCart(product._id);
    }
  };

  // ✅ NEW: Handle thumbnail click
  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-5 py-3 border-b border-b-gray-300">
        <button onClick={handleBack} className="cursor-pointer">
          <FaArrowLeft className="text-lg text-[#666D7D]" />
        </button>
        <p className="capitalize font-semibold lg:text-lg">{name}</p>
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
      <div className="flex-1 flex flex-col items-center w-full px-4">
        {/* ✅ NEW: Image Gallery Section */}
        <div className="flex w-full max-w-4xl gap-4 mt-6">
          {/* Thumbnails - Vertical on left */}
          <div className="flex flex-col gap-2 w-20 lg:w-24 h-[280px] lg:h-[400px] overflow-y-auto">
            {productImages.map((image, index) => (
              <div
                key={index}
                className={`flex-shrink-0 cursor-pointer border-2 rounded-lg p-1 transition-all duration-200 hover:shadow-md ${
                  index === selectedImageIndex
                    ? "border-[#032117] ring-2 ring-[#032117] ring-opacity-50 bg-gray-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleThumbnailClick(index)}
              >
                <img
                  src={image}
                  alt={`${name} - ${index + 1}`}
                  className="w-full h-16 lg:h-20 object-cover rounded-md"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.jpg";
                  }}
                />
              </div>
            ))}
            {/* Show placeholder if no images */}
            {productImages.length === 0 && (
              <div className="w-full h-16 lg:h-20 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">
                {language === "ar" ? "لا صور" : "No images"}
              </div>
            )}
          </div>

          {/* Main Image */}
          <div className="flex-1 max-w-md lg:max-w-lg">
            <div className="relative w-full h-[280px] lg:h-[400px] bg-white rounded-xl shadow-lg overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.jpg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-xl">
                  <span className="text-gray-400 text-lg">
                    {language === "ar" ? "لا توجد صورة" : "No Image Available"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg mt-7 px-6 lg:px-8 py-7 w-full max-w-xl mx-auto">
          <h1 className="text-xl lg:text-2xl font-semibold mb-2">{name}</h1>
          <p className="text-gray-700 mb-3 text-sm leading-relaxed">
            {description}
          </p>

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
              <div className="flex items-center gap-1 flex-wrap">
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
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <span className="font-semibold text-black/60 text-sm">
              {priceLabel}
            </span>
            <span className="text-2xl font-bold text-[#032117]">
              {(price * (quantity || 1)).toFixed(3)} kw
            </span>
          </div>

          {/* Message input */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              {messageLabel}{" "}
              <span className="text-gray-400">{optionalLabel}</span>
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messagePlaceholder}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#032117]/20 focus:border-transparent mb-1"
              disabled={!!cartItem}
            />
          </div>

          {/* Quantity selector */}
          {cartItem ? (
            <div className="flex items-center justify-center gap-5 mb-8 py-4">
              <button
                onClick={handleDecrease}
                className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center text-xl font-bold text-[#032117] bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
                type="button"
                disabled={cartItem.quantity <= 1}
              >
                –
              </button>
              <span className="w-12 text-center text-2xl font-bold">
                {cartItem.quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center text-xl font-bold text-[#032117] bg-gray-100 hover:bg-gray-200 transition-all"
                aria-label="Increase quantity"
                type="button"
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5 mb-8 py-4 bg-gray-50 rounded-lg">
              <span className="text-gray-400 text-sm italic">
                {quantityHint}
              </span>
            </div>
          )}

          {/* Cart operations */}
          <div className="flex flex-col gap-3 mb-6">
            {!cartItem && (
              <button
                className="w-full bg-[#032117] hover:bg-[#054a27] active:bg-[#032117]/90 transition-all duration-200 text-white font-semibold py-4 rounded-xl text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                onClick={handleAddToCart}
                type="button"
              >
                <span>{addToCartLabel}</span>
                <span className="ml-2">{price.toFixed(3)} kw</span>
              </button>
            )}
            {cartItem && (
              <button
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all duration-200 text-white font-semibold py-3 rounded-xl text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                onClick={handleRemoveFromCart}
                type="button"
              >
                {removeFromCartLabel}
              </button>
            )}
          </div>

          {/* Cart total */}
          <div className="text-right text-sm text-gray-600 pt-4 border-t border-gray-100">
            <span className="font-semibold">{cartTotalLabel} </span>
            <span className="font-bold text-lg text-[#032117]">
              {cartTotal.toFixed(3)} kw
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
