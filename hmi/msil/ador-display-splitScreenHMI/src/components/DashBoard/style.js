// styles.js
export const getDashBackground = (theme) => ({
  position: "relative",
  width: "100vw",
  height: "100vh",
  background:
    theme === "dark"
      ? "linear-gradient(180deg, #000000 25%, #2A2A3A 100%)"
      : "white", // light background
  color: theme === "dark" ? "#fff" : "#000",
  minHeight: "100vh",
});