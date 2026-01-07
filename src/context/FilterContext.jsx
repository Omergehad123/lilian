// context/FilterContext.jsx
import React, { createContext, useState, useCallback } from "react";

const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({
    sort: { type: "", value: "" },
    category: "",
    price: 150,
  });

  const updateFilter = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const setSortFilter = useCallback(
    (type, value) => {
      updateFilter({ sort: { type, value } });
    },
    [updateFilter]
  );

  const setCategoryFilter = useCallback(
    (category) => {
      updateFilter({ category });
    },
    [updateFilter]
  );

  const setPriceFilter = useCallback(
    (price) => {
      updateFilter({ price });
    },
    [updateFilter]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      sort: { type: "", value: "" },
      category: "",
      price: 150,
    });
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setSortFilter,
        setCategoryFilter,
        setPriceFilter,
        clearFilters,
        updateFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export default FilterContext;
