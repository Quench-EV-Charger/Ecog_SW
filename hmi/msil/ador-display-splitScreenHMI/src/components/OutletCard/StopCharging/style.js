export const rfid_img = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  width: "300px",
  height: "280px",
  left: "160px",
  top: "150px",
  // Uncomment this if you want padding
  // padding: '117.134px 0px'
};

export const rfid_info = (theme) => ({
  width: "362px",
  position: "absolute",
  top: "10%",
  left: "50%",
  transform: "translateX(-50%)",
  color: theme === "dark" ? "white" : "black", // Or any color suitable over image
  fontSize: "2.2rem",
  backgroundColor: "transparent", // Optional: semi-transparent background
  padding: "10px 20px",
  borderRadius: "8px",
  textAlign: "justify",
});
