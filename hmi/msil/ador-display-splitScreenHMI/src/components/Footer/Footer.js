import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

function Footer() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
    const { theme, toggleTheme } = useContext(ThemeContext);
  

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString(); // e.g., 4:23:05 PM
      const dateString = now.toLocaleDateString(); // e.g., 4/8/2025
      setTime(timeString);
      setDate(dateString);
    };

    updateDateTime(); // Initial call
    const interval = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div
      style={{
        marginTop: "15px",
        position: "absolute",
        bottom: "20px",
        right: "5px",
      }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          marginRight: "25px",
          color: theme === "dark" ? "#ffffff" : "#000000",
          fontSize: "25px"
        }}
      >
        {time} {date}
      </span>
    </div>
  );
}

export default Footer;
