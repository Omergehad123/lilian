import { useState, useEffect } from "react";

export const useApiCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiCall = async (endpoint, method = "GET", body) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) options.body = JSON.stringify(body);

      const response = await fetch(`/api/city-areas/${endpoint}`, options);
      const data = await response.json();
      return data;
    } finally {
      setLoading(false);
    }
  };

  const getCities = async () => {
    const data = await apiCall("");
    if (data.success) setCities(data.cities);
    return data;
  };

  const addCity = (cityData) => apiCall("", "POST", cityData);
  const updateCity = (id, cityData) => apiCall(id, "PUT", cityData);
  const deleteCity = (id) => apiCall(id, "DELETE");
  const addAreaToCity = (areaData) => apiCall("add-area", "POST", areaData);

  useEffect(() => {
    getCities();
  }, []);

  return {
    cities,
    loading,
    addCity,
    updateCity,
    deleteCity,
    addAreaToCity,
  };
};
