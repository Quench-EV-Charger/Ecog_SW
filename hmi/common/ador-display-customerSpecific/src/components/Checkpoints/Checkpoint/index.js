import { Icon, Row, Typography } from "antd";
import React from "react";

import { getCorrectOutletType } from "../../../utils";
import { OutletType } from "../../../constants/constants";

import * as S from "./styles";

const { Title } = Typography;

export const CheckPoint = ({ iconType, iconColor, text, outletType }) => {
  const isCHADEMO = getCorrectOutletType(outletType) === OutletType.CHAdeMO;
  return (
    <Row style={S.CheckPointRow} data-testid="checkpoint">
      <Icon type={iconType} style={S.CheckPointIcon(iconColor)} data-testid="icon"/>
      <Title style={S.CheckPointText(isCHADEMO)}>{text}</Title>
    </Row>
  );
};
