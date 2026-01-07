import { ProductsProvider } from "./ProductsContext";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { OrderProvider } from "./OrderContext";
import { LanguageProvider } from "./LanguageContext";
import { FilterProvider } from ".//FilterContext";

function Provider({ children }) {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <OrderProvider>
            <LanguageProvider>
              <FilterProvider>{children}</FilterProvider>
            </LanguageProvider>
          </OrderProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

export default Provider;
