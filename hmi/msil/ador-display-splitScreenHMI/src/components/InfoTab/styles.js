// styles.js
import styled from "styled-components";

export const TabContainer = styled.div`
  width: 100%;
  display: flex;
  margin-top: 40px;
`;

export const RightCol = {
  display: "flex",
  justifyContent: "center",
};

export const HomeButton = (theme) => ({
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "2px solid #d9d9d9",
  color: theme === "dark" ? "white" : "black",
  fontWeight: "500",
  padding: "8px 20px",
  borderRadius: "0px",
  width: "100%",
  // maxWidth: "180px",
})

export const ActiveTab = (theme) => ({
  ...HomeButton(theme),
  backgroundColor: theme === "dark" ? "#1890ff" : "red",
  color: "#fff",
  borderColor:theme === "dark" ? "#1890ff" : "red",
})

export const ChargingText = (theme) => ({
  fontSize: "3vh",
  color: theme === "dark"? "rgb(255, 255, 255)": "black",
  textAlign:"right",
  // marginLeft: "0px"
})
