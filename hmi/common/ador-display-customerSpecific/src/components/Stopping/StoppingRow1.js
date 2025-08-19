import React from "react";
import { Row } from "antd";

import QuenchSymbol from "../../assets/images/quench_symbol.png";

import * as S from "./styles";

export default function StoppingRow1({ letter, useQAsOutletID }) {
  return (
    <Row style={S.StoppingRow1} data-testid="stopping-row1">
      <GunLetter letter={letter} useQAsOutletID={useQAsOutletID} />
    </Row>
  );
}

const GunLetter = ({ letter, useQAsOutletID }) => (
  <div
    style={{
      backgroundColor: "#E62518",
      border: useQAsOutletID ? "none" : "0.156vw solid  #0070c0",
      boxShadow: "0.078vw 0.313vw 0.938vw rgba(0, 0, 0, 0.08)",
      borderRadius: "50%",
      color: "#FFFFFF",
      height: "12vh",
      width: "12vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "2.5vw",
      fontWeight: "bold",
      backgroundImage: useQAsOutletID ? `url(${QuenchSymbol})` : null,
      backgroundSize: useQAsOutletID ? "cover" : null,
      marginLeft: "40vh",
    }}
  >
    {useQAsOutletID ? "" : letter}
  </div>
);
