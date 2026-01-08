import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1) Initialize from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 2) Sync user + token changes back to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        return {
          success: false,
          error: data.message || "Email or password is incorrect",
        };
      }

      const loggedUser = data.data.user;

      // 3) Save to state (effects will sync to localStorage)
      setToken(loggedUser.token);
      setUser(loggedUser);
      navigate("/");

      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return {
        success: false,
        error: "Network error - server not reachable",
      };
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://lilian-backend.onrender.com/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        return {
          success: false,
          error: data.message || "Registration failed",
        };
      }

      const newUser = data.data.user;
      setToken(newUser.token);
      setUser(newUser);
      navigate("/");

      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      setLoading(false);
      return {
        success: false,
        error: "Network error - server not reachable",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
