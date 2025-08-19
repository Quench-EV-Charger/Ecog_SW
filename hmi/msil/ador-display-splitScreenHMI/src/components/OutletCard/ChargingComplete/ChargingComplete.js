import React, { useContext, useEffect } from "react";
import { motion } from "framer-motion";
import carUnplugImg from "../../../assets/images/ecog_car_unplug.png";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";
import { FaBolt } from "react-icons/fa";

const ChargingComplete = ({ eachOutlet, handleClick, status }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingLeft: "20px",
    paddingRight: "20px",
    marginTop: "20px",
  };

  const cardStyle = {
    backgroundColor: "transparent",
    padding: "10px",
    borderRadius: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "28rem",
    textAlign: "center",
    backdropFilter: "blur(10px)",
  };

  const headingStyle = {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: theme === "dark" ? "white" : "black",
    marginBottom: "0.1rem",
  };

  const paragraphStyle = {
    marginTop: "0.5rem",
    fontSize: "1.1rem",
    color: theme === "dark" ? "white" : "black",
  };

  const imageStyle = {
    width: "100%",
    maxWidth: "250px",
    height: "auto",
    marginTop: "20px",
    borderRadius: "1rem",
    boxShadow:
      theme === "dark"
        ? "0 0 15px rgba(255, 255, 255, 0.3)"
        : "0 0 15px rgb(210, 33, 33)",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClick("initial");
    }, 120000);
    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  return (
    <div style={containerStyle}>
      <motion.div
        style={cardStyle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <img src={carUnplugImg} alt="EV unplug" style={imageStyle} />
        <h2 style={headingStyle}>
          <FaBolt style={{ color: "gold", marginRight: "0.1rem" }} /> Charging
          Complete!
        </h2>
        <p style={paragraphStyle}>
          <b style={{ color: "rgb(238, 13, 13)" }}>Unplug your EV </b>now and
          place the cable back in the holder to keep things safe and ready for
          the next drive.
        </p>
      </motion.div>
    </div>
  );
};

export default ChargingComplete;
