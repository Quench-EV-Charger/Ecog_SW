import React, { useContext, useEffect } from "react";
import { motion } from "framer-motion";
import carUnplugImg from "../../../assets/images/ecog_car_unplug.png";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";

const PostCharging = ({ eachOutlet, handleClick }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    if (eachOutlet?.needsUnplug && !eachOutlet?.sessionPending) {
      handleClick("unplug");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <div
      style={{
        position: "relative",
        height: "50vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        borderRadius: "20px",
        marginTop: "30px",
      }}
    >
      {/* Background Image */}
      <img
        src={carUnplugImg}
        alt="EV Car"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: theme === "dark" ? 0.1 : 0.2,
          zIndex: 0,
        }}
      />

      {/* Main Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          color: theme === "dark" ? "#fff" : "black",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <h2 style={{ fontSize: "35px", fontWeight: "bold", margin: 0 }}>
          CHARGING STOPPING
        </h2>
        <p style={{ fontSize: "20px", color: theme === "dark" ? "#94a3b8" : "black", marginTop: "6px" }}>
          Wrapping up session. Please wait...
        </p>

        {/* Alert */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          style={{
            backgroundColor: "#ff0057",
            color: "#fff",
            padding: "20px",
            borderRadius: "6px",
            fontWeight: "bold",
            boxShadow: "0 0 15px rgba(255, 0, 87, 0.3)",
            marginTop: "20px",
          }}
        >
          ⚠ DO NOT UNPLUG YOUR EV
        </motion.div>

        {/* Animated Notice */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            color: theme === "dark" ? "#94a3b8" : "black",
            fontSize: "20px",
            marginTop: "30px",
          }}
        >
          Securing charging logs...
        </motion.div>

        <div
          style={{
            fontSize: "20px",
            color: theme === "dark" ? "#94a3b8" : "black",
            marginTop: "12px",
            textAlign: "center",
          }}
        >
          It will take up to 2 min to end session.
          <br />
          Unplug only after confirmation.
        </div>
      </div>
    </div>
  );
};

export default PostCharging;
