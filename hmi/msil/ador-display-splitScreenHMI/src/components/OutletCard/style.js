export const boxStyle = (theme) => ({
  background: theme === "dark" ? "#1C1C1C" : "white",
  padding: "10px",
  border: "1px solid rgba(39, 39, 42, 0.5)",
  boxShadow:
    "0px 10px 25px -5px rgba(0, 0, 0, 0.2), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
  borderRadius: "12px",
  width: "50%", // or whatever fits your layout
  height: "500px", // optional
  boxSizing: "border-box",
})

export const gun_icon = {
  display: "block",
  // height: "8%",
  width: "18%",
};

export const gun_heading = (theme) => ({
  paddingLeft: "5px",
  fontSize: "larger",
  paddingTop: "5px",
  color: theme === "dark" ? "white" : "black",
})

export const getSOCStyle = (status) => {
  const statusColors = {
    charging: '#00BFFF',
    preparing: '#FFA500',
    reserved: '#FF6347',
    available: '#21C45D',
  };

  return {
    padding: '10px 20px', // Flexible size based on content
    background: statusColors[status] || '#ff4d4f',
    borderRadius: '25px', // Fully rounded pill-style
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    
    fontSize: 'larger',
    color: 'white',
    whiteSpace: 'nowrap',  // Prevents text wrap
  };
};

