export const rfid_img = {
  display: 'block',
  width: '100%',
  maxWidth: '250px',
  maxHeight: '100%',
  objectFit: 'contain',
  margin: '0 auto',
};

export const rfid_info = (theme) => ({
  width: "90%",
  maxWidth: "500px",
  color: theme === "dark" ? "white" : "black",
  fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
  backgroundColor: "transparent",
  padding: "10px",
  borderRadius: "8px",
  textAlign: "center",
  lineHeight: "1.3",
});
