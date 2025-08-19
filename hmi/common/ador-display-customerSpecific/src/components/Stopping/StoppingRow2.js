import React from "react";
import { Row, Col, Typography } from "antd";

import EcoGCarUnplug from "../../assets/images/ecog_car_unplug.png";

import "../../styles/ThreeDotsAnimation.css";
import "../../styles/InternalStyles.css";
import * as S from "./styles";

const { Title } = Typography;

export default function SecondRow({ t }) {
  return (
    <Row style={S.StoppingRow2} data-testid="stopping-row2">
      <Col span={1}/>
      <Col span={11} style={S.ImgCol}>
        <img src={EcoGCarUnplug} alt="car" style={S.Img} data-testid="car-image"/>
      </Col>
      <Col span={2}/>
      <Col span={10} style={S.TextsContainerCol}>
        <Row>
          <Title style={S.Text} className="redbox flashing">
            <span style={S.WaitTextContent}>
              {t("PLEASE_WAIT").toUpperCase()}
            </span>
          </Title>
        </Row>
        <Row>
          <Title style={{ ...S.Text, ...S.TextContent }} className="redbox">
            {t("CHARGING_FINISHING")}
            <ThreeDotsAnimation />
          </Title>
        </Row>
        <Row>
          <Title style={{ ...S.Text, ...S.TextContent }} className="redbox">
            {t("DO_NOT_UNPLUG")}
          </Title>
        </Row>
      </Col>
    </Row>
  );
}

const ThreeDotsAnimation = () => (
  <div className="snippet" data-title=".dot-falling">
    <div className="stage">
      <div className="dot-falling"/>
    </div>
  </div>
);
