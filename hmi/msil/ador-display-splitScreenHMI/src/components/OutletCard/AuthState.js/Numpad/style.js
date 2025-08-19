export const container = {
  backgroundColor: "transparent",
  height: "55vh",
  color: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};
export const heading = {
  marginBottom: "20px",
  fontSize: "24px",
  color: "#fff",
};
export const textarea = (theme) => ({
  width: "250px",
  height: "30px",
  fontSize: "20px",
  backgroundColor: "transparent",
  color: theme === "dark" ? "white" : "black",
  border: "none",
  borderBottom: "2px solid black", // ✅ Green bottom border
  outline: "none",
  resize: "none",
  textAlign: "center",
  caretColor: "#21C45D", // Optional: custom caret color
  transition: "border-color 0.3s ease",
})

export const numpadContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 90px)",
  gap: "10px",
  marginTop: "30px",
};
export const numpadButton = (theme) => ({
  width: "80px",
  height: "45px",
  fontSize: "20px",
  borderRadius: "10px",
  backgroundColor: "transparent",
  color: theme === "dark" ? "white" : "black",
  border: "none",
  cursor: "pointer",
})
