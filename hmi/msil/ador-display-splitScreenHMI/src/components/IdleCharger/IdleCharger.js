import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCar } from "react-icons/fa";

const IdleCharger = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    wrapper: {
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #050505, #0f0f0f)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      color: "#ffffff",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: "hidden",
    },
    glowCircle: {
      position: "relative",
      width: "250px",
      height: "250px",
      borderRadius: "50%",
    //   background: "radial-gradient(circle, #121212, #1a1a1a)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 0 50px rgba(0, 255, 157, 0.2)",
      marginBottom: "2rem",
    },
    glowRing: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
    //   boxShadow: "0 0 30pxrgb(104, 159, 138), 0 0 60px #00c776 inset",
    //   animation: "pulseGlow 3s ease-in-out infinite",
      zIndex: 1,
    },
    mainIcon: {
      fontSize: "5.5rem",
      color: "rgb(104, 159, 138)",
      zIndex: 2,
    },
    idleText: {
      fontSize: "4rem",
      fontWeight: "bold",
      textAlign: "center",
      color: "rgb(104, 159, 138)",
    //   textShadow: "0 0 15pxrgb(56, 86, 206), 0 0 25px #00c6b3",
    animation: "floating 4s ease-in-out infinite",
        marginTop: "2rem",
    },
    time: {
      marginTop: "3rem",
      fontSize: "1.1rem",
      color: "#888",
    },
  };

  return (
    <>
      <div style={styles.wrapper}>
        <div style={styles.glowCircle}>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            style={styles.glowRing}
          />
          <FaCar style={styles.mainIcon} />
        </div>

        <motion.div style={styles.idleText}>
          Charger is idle...
        </motion.div>

        <div style={styles.time}>Current Time: {currentTime}</div>
      </div>

      <style>
        {`
        @keyframes floating {
  0% { transform: translateY(0); }
  50% { transform: translateY(-70px); }
  100% { transform: translateY(0); }
}


        `}
      </style>
    </>
  );
};

export default IdleCharger;
