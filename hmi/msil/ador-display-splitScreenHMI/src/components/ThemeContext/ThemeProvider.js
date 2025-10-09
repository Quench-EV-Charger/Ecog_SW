// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

export const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  // Only subscribe to the specific theme value, not the entire charging state
  const themeFromStore = useSelector((state) => state.charging?.config?.uiConfiguration?.theme);

  // Prioritize localStorage over store to maintain user preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || themeFromStore || "light";
  });

  // Only initialize from store if no localStorage value exists
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (!savedTheme && themeFromStore) {
      setTheme(themeFromStore);
    }
  }, [themeFromStore]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
