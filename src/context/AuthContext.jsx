import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // check if user exists in localStorage (NOT token)
  const checkAuthStatus = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedIsGuest = localStorage.getItem("isGuest");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        setUser(user);
        setIsGuest(storedIsGuest === "true");
      }
    } catch (e) {
      console.log("Stored data corrupted");
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("isGuest", isGuest ? "true" : "false");
  }, [isGuest]);

  /**
   * Guest Login
   * (Cookie based token is set by backend)
   */
  const loginAsGuest = async () => {
    try {
      const response = await axios.post(
        "https://lilian-backend.onrender.com/api/users/guest-login",
        {},
        { withCredentials: true }
      );

      const data = response.data;

      if (data.status !== "success") {
        return {
          success: false,
          error: data.message || data.error || "Guest login failed",
        };
      }

      const guestUser = data.data?.user;

      if (guestUser) {
        setUser(guestUser);
        setIsGuest(true);

        localStorage.setItem("user", JSON.stringify(guestUser));
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


  /**
   * Normal Login
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "https://lilian-backend.onrender.com/api/users/login",
        { email, password },
        { withCredentials: true }
      );

      const data = response.data;

      if (data.status !== "success") {
        return {
          success: false,
          error: data.message || "Invalid credentials",
        };
      }

      const loggedUser = data.data.user;

      setUser(loggedUser);
      setIsGuest(false);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      localStorage.setItem("isGuest", "false");

      navigate("/");
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Network error" };
    }
  };


  /**
   * Logout
   */
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
      setIsGuest(false);

      localStorage.removeItem("user");
      localStorage.removeItem("isGuest");

      navigate("/");
    }
  };

  /**
   * Register
   */
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

      if (newUser) {
        setUser(newUser);
        setIsGuest(false);

        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("isGuest", "false");

        return { success: true, user: newUser };
      }

      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Network error" };
    }
  };

  /**
   * Upgrade Guest -> Registered
   */
  const upgradeGuest = async (formData) => {
    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/register",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            mergeCart: true,
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

      if (newUser) {
        setUser(newUser);
        setIsGuest(false);

        localStorage.setItem("user", JSON.stringify(newUser));
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
    isGuest,
    login,
    loginAsGuest,
    logout,
    loading,
    register,
    upgradeGuest,
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
