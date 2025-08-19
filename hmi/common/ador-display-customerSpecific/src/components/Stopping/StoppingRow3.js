import React from "react";
import { Row, Typography } from "antd";

import "../../styles/FlashingBoxAnimation.css";
import "../../styles/InternalStyles.css";
import * as S from "./styles";

const { Title } = Typography;

export default function StoppingRow3({ t }) {
  return (
    <Row style={S.StoppingRow3} data-testid="stopping-row3">
      <Title className="redbox" style={S.NoteText}>
        {t("STOPPING_NOTE")}
      </Title>
    </Row>
  );
}
