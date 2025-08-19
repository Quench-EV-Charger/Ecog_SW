import { availableButtonShadow } from "../../constants/constants";

export const ChargingText = {
  fontSize: "3vh",
  color: "rgb(55, 55, 68)",
  textAlign:"right"
};

export const RightCol = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-around",
  fontSize:"5vh",
};

export const SessionInfoTextsContainer = {
  border: "1px solid white",
  width: "54.375vh",
  color: "rgb(55, 55, 68)",
  borderRadius: "2.5vw",
};

export const QR= {
  height: "50vh",
  justifyContent: "top",
  alignItems: "top",
};

export const HomeButton = {
  border: "0.156vw solid #E62518",
  color: "#E62518",
  fontSize: "3vh",
  width: "100%",
  height: "7vh",
  boxShadow: availableButtonShadow,
};
export const HomeButtonRed = {
  display: "block",
  width: "20vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: "1.8vw",
  height: "4.05vw",
  backgroundColor: "#E62518",
  boxShadow: availableButtonShadow,
  left: "0",
  bottom: "0",
  position: "absolute"
};

export const Overlay = {
  margin: "3.906vw",
  padding: "2.344vw",
  height: "70vh",
};
export const Table = {
  width: "95%",
  maxWidth: "95%",
  borderCollapse: "collapse",
  margin: "0 auto", // Center the table horizontally
  textAlign: "center", // Center the content inside the table cells
};

export const TableHeader = {
  border: "1px solid black",
  backgroundColor: "#E62518",
  color: "white",
  textAlign: "center",
  padding: "0.5vh 1vh",
  fontSize: "2.5vh", // Adjust font size as needed
};

export const TableRow = {
  border: "1px solid black",
  padding: "0.8vh 1vh",
  textAlign: "center",
  wordBreak: "break-word",
  fontSize: "2vh", // Adjust font size as needed
};

export const CenterTable = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "1vh",

};
export const TableContent = {
  fontSize: "2.5vh", // Adjust font size as needed
};