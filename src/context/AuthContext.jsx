import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Proper token handling from /auth/me
  const checkAuthStatus = async () => {
    try {
      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/auth/me",
        {
          credentials: "include", // ✅ Sends auth cookies
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // ✅ FIXED: Handle different response structures
        if (data.user) {
          setUser(data.user);
          // Try multiple token locations
          const authToken =
            data.token || data.user.token || localStorage.getItem("token");
          if (authToken) {
            setToken(authToken);
            localStorage.setItem("token", authToken);
          }
        } else if (data.data?.user) {
          setUser(data.data.user);
          const authToken =
            data.data.token ||
            data.data.user.token ||
            localStorage.getItem("token");
          if (authToken) {
            setToken(authToken);
            localStorage.setItem("token", authToken);
          }
        }
      }
    } catch (err) {
      console.log("❌ No active session:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check auth on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ✅ Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // ✅ Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // ✅ FIXED: Login with proper token extraction
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/users/login",
        {
          method: "POST",
          credentials: "include", // ✅ Important for cookies
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();


      if (!response.ok) {
        setLoading(false);
        return {
          success: false,
          error: data.message || data.error || "Email or password is incorrect",
        };
      }

      // ✅ FIXED: Extract token properly from different response structures
      let loggedUser = null;
      let authToken = null;

      if (data.data?.user) {
        loggedUser = data.data.user;
        authToken = data.data.token || data.token || data.data.user.token;
      } else if (data.user) {
        loggedUser = data.user;
        authToken = data.token || data.user.token;
      }

      if (loggedUser && authToken) {
        setUser(loggedUser);
        setToken(authToken);
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(loggedUser));
        navigate("/");
        setLoading(false);
        return { success: true };
      } else {
        // Fallback: check auth status after login
        await checkAuthStatus();
        return { success: true };
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setLoading(false);
      return { success: false, error: "Network error" };
    }
  };

  // ✅ FIXED: Register with proper token handling
  const register = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://lilian-backend-7bjc.onrender.com/api/users/register",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        return {
          success: false,
          error: data.message || data.error || "Registration failed",
        };
      }

      let newUser = null;
      let authToken = null;

      if (data.data?.user) {
        newUser = data.data.user;
        authToken = data.data.token || data.token || data.data.user.token;
      } else if (data.user) {
        newUser = data.user;
        authToken = data.token || data.user.token;
      }

      if (newUser && authToken) {
        setUser(newUser);
        setToken(authToken);
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        navigate("/");
        setLoading(false);
        return { success: true };
      } else {
        await checkAuthStatus();
        return { success: true };
      }
    } catch (err) {
      console.error("❌ Register error:", err);
      setLoading(false);
      return { success: false, error: "Network error" };
    }
  };

  // ✅ FIXED: Logout clears everything
  const logout = async () => {
    try {
      await fetch("https://lilian-backend-7bjc.onrender.com/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.log("Logout cleanup:", err);
    } finally {
      // Clear all state
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
