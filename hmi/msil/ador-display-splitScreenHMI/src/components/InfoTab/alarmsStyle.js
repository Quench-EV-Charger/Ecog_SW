// styles.js

export const Table = {
  minWidth: "1000px", // Slightly under 1024 to allow margin
  color: "#f0f0f0",
  fontFamily: "Arial, sans-serif",
  fontSize: "15px",
  boxShadow: "0 0 8px rgb(136 171 226)",
  borderRadius: "6px",
};

export const TableHeader = (theme) => ({
  backgroundColor: theme === "dark" ? "#2e2e2e" : "red",
  color: "#ffffff",
  fontWeight: "bold",
  padding: "8px",
  borderBottom: "1px solid #444",
  textAlign: "center",
  fontSize: "13px",
})

export const TableContent = (theme) => ({
  padding: "6px 10px",
  textAlign: "center",
  color: theme === "dark" ? "#e0e0e0" : "black",
  fontSize: "16px",
  wordWrap: "break-word",
})

export const PaginationText = (theme) => ({
  margin: "0 12px",
  fontSize: "16px",
  color: theme === "dark" ? "#ccc" : "black",
})
