// src/context/ThemeContext.js
import React, { createContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";

export const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const store = useSelector((state) => state.charging);

  const [theme, setTheme] = useState(
    store?.config?.uiConfiguration?.theme || "light"
  );

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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
