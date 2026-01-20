import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const checkAuthStatus = async () => {
    try {
      // 🔥 1. Check localStorage FIRST
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        setUser(user);
        setToken(storedToken);
        setIsGuest(user.isGuest || false);
        setLoading(false);
        return; // ✅ EXIT EARLY - NO API CALL
      }
    } catch (e) {
      console.log("Stored data corrupted");
    }

    // 🔥 2. ONLY check backend if NO local data
    setLoading(false); // Skip backend call entirely
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Sync user/token to localStorage
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // ✅ NEW: Guest Login Function
  const loginAsGuest = async () => {
    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/guest-login",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return {
          success: false,
          error: data.message || data.error || "Guest login failed",
        };
      }

      const guestUser = data.data?.user;
      const authToken = guestUser?.token;

      if (guestUser && authToken) {
        setUser(guestUser);
        setToken(authToken);
        setIsGuest(true);
        localStorage.setItem("user", JSON.stringify(guestUser));
        localStorage.setItem("token", authToken);
        localStorage.setItem("isGuest", "true");
        navigate("/");
        return { success: true, isGuest: true };
      }

      return { success: false, error: "Invalid guest response" };
    } catch (err) {
      console.error("Guest login error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/login",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return {
          success: false,
          error: data.message || data.error || "Invalid credentials",
        };
      }

      const loggedUser = data.data?.user;
      const authToken = loggedUser?.token;

      if (loggedUser && authToken) {
        setUser(loggedUser);
        setToken(authToken);
        setIsGuest(false); // ✅ Reset guest status
        localStorage.setItem("user", JSON.stringify(loggedUser));
        localStorage.setItem("token", authToken);
        localStorage.setItem("isGuest", "false");
        localStorage.removeItem("guestId"); // Clean up guest data
        navigate("/");
        return { success: true, isGuest: false };
      }

      return { success: false, error: "Invalid response format" };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("https://lilian-backend.onrender.com/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.log("Logout cleanup");
    } finally {
      setUser(null);
      setToken(null);
      setIsGuest(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isGuest");
      localStorage.removeItem("guestId");
      navigate("/");
    }
  };

  // Register function - unchanged
  const register = async (formData) => {
    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/register",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return {
          success: false,
          error: data.message || data.error || "Registration failed",
        };
      }

      const newUser = data.data?.user;
      const authToken = newUser?.token;

      if (newUser && authToken) {
        setUser(newUser);
        setToken(authToken);
        setIsGuest(false);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("token", authToken);
        localStorage.setItem("isGuest", "false");
        return { success: true, user: newUser, token: authToken };
      }

      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Network error" };
    }
  };

  // ✅ NEW: Upgrade guest to registered user
  const upgradeGuest = async (formData) => {
    try {
      // First get current guest cart
      const token = localStorage.getItem("token");
      const userResponse = await fetch(
        "https://lilian-backend.onrender.com/api/users/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const currentUser = await userResponse.json();

      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/register",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            mergeCart: true, // Optional: tell backend to merge carts
            guestId: user.guestId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return {
          success: false,
          error: data.message || "Registration failed",
        };
      }

      const newUser = data.data?.user;
      const authToken = newUser?.token;

      if (newUser && authToken) {
        setUser(newUser);
        setToken(authToken);
        setIsGuest(false);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("token", authToken);
        localStorage.setItem("isGuest", "false");
        return { success: true };
      }

      return { success: false };
    } catch (err) {
      console.error("Upgrade error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const value = {
    user,
    token,
    isGuest,
    login,
    loginAsGuest, // ✅ New function
    logout,
    loading,
    register,
    upgradeGuest, // ✅ New function
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
