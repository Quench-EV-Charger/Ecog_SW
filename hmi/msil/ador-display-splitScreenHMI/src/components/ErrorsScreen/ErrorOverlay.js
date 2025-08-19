import React, { useEffect } from "react";
import { Row, Col, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

const ErrorOverlay = ({ shown, image, altText, messages }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const main = document.getElementById("main-content");

    if (shown && main) {
      main.style.filter = "blur(5px)";
      main.style.pointerEvents = "none";
    } else if (main) {
      main.style.filter = "none";
      main.style.pointerEvents = "auto";
    }

    return () => {
      if (main) {
        main.style.filter = "none";
        main.style.pointerEvents = "auto";
      }
    };
  }, [shown]);

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        display: shown ? "flex" : "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        zIndex: "150",
      }}
      data-testid="error-overlay"
    >
      <Row justify="space-between" align="middle">
        <Col span={24} style={{ textAlign: "center" }}>
          <img
            style={{ height: "23.438vw" }}
            alt={altText || "Error sign"}
            src={image}
            data-testid="error-image"
          />
        </Col>
      </Row>
      <Row
        justify="space-around"
        style={{ textAlign: "center" }}
      >
        <Col span={24}>
          <Title level={1}>
            <div
              style={{
                color: "#E62518",
                height: "9.375vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {messages.map((msgKey, idx) => (
                <span key={idx} style={{ fontSize: "3vw" }}>
                  {t(msgKey)}
                </span>
              ))}
            </div>
          </Title>
        </Col>
      </Row>
    </div>
  );
};

export default ErrorOverlay;
