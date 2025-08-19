import React from "react";

import QuenchSymbol from "../../../assets/images/quench_symbol.png";

export const GunLetter = ({ letter, useQAsOutletID }) => (
  <div
    style={{
      backgroundColor: "#E62518",
      border: useQAsOutletID ? "none" : "0.156vw solid  #0070c0",
      boxShadow: "0.078vw 0.313vw 0.938vw rgba(0, 0, 0, 0.08)",
      borderRadius: "50%",
      color: "#FFFFFF",
      height: "11vh",
      width: "11vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "2.5vw",
      fontWeight: "bold",
      backgroundImage: useQAsOutletID ? `url(${QuenchSymbol})` : null,
      backgroundSize: useQAsOutletID ? "cover" : null,
      margin: "2vh",
    }}
    data-testid="gun-letter"
  >
    {useQAsOutletID ? "" : letter}
  </div>
);
