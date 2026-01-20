import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Provider from "./context/Provider.jsx";
import { BrowserRouter } from "react-router-dom";
import RootLayout from "./utils/RootLayout.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider>
        <RootLayout>
          <App />
        </RootLayout>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
