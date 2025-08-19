import React, { useContext } from "react";
import { Col, Row, Typography, Dropdown, Menu } from "antd";
import NavbarButton from "./NavbarButton";
import { useSelector } from "react-redux";
import "./Navbar.css"; // 👈 Import the CSS styles
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const { Title } = Typography;

function Navbar(props) {
  const { transparent, heading, onTabChange } = props;
  const { ocppOnline, networkAccess } = useSelector((state) => state).charging;
  const { theme, toggleTheme } = useContext(ThemeContext);


  const languages = [
    { key: "en", label: "English" },

    { key: "es", label: "Spanish", disabled: true },
    { key: "fr", label: "French", disabled: true },
    { key: "de", label: "German", disabled: true },
    { key: "hi", label: "Hindi", disabled: true },
    { key: "zh", label: "Chinese", disabled: true },
    { key: "ja", label: "Japanese", disabled: true },
    { key: "ko", label: "Korean", disabled: true },
    { key: "ru", label: "Russian", disabled: true },
    { key: "ar", label: "Arabic", disabled: true },
    { key: "pt", label: "Portuguese", disabled: true },
    { key: "it", label: "Italian", disabled: true },
    { key: "bn", label: "Bengali", disabled: true },
    { key: "pa", label: "Punjabi", disabled: true },
    { key: "tr", label: "Turkish", disabled: true },
    { key: "vi", label: "Vietnamese", disabled: true },
    { key: "ur", label: "Urdu", disabled: true },
    { key: "tl", label: "Tagalog", disabled: true },
    { key: "ms", label: "Malay", disabled: true },
    { key: "ta", label: "Tamil", disabled: true },
  ];


  const handleLanguageClick = ({ key }) => {
    console.log("Selected language:", key);
    // Hook your i18n logic here
  };

  const handleInfoClick = () => onTabChange("info");
  const handleHomeClick = () => onTabChange("home");
  const handleSettingsClick = () => onTabChange("setting");
  const getLogo = () => "Maruti_logo.png";
  const shouldHomeBtnDisabled = () => false;

  const isLanguageDisabled = true;

  const languageButton = (
    <NavbarButton
      theme={theme}
      iconType="GlobalOutlined"
      showStrikethroughWhenDisabled={!isLanguageDisabled} // custom visual-only disabling
    />
  );

  const languageMenu = (
    <Menu
      onClick={handleLanguageClick}
      items={languages}
      style={{
        background: "transparent",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "2px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(10px)",
        width: "150px",
        height: "300px",
        display: "flex",
        flexFlow: "column",
        alignItems: "center"
      }}
      className="futuristic-menu"
    />
  );

  return (
    <Row
      style={{
        padding: "15px",
        minHeight: "15vh",
        maxHeight: "15vh",
        opacity: transparent ? "0.7" : "1",
        backgroundColor: theme === "dark" ? "#000000" : "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      data-testid="navbar"
    >
      <Col
        span={7}
        style={{ height: "15vh", display: "flex", alignItems: "center" }}
      >
        <img
          src={`/brandings/${getLogo()}`}
          alt="Brand logo"
          style={{
            width: "auto",
            height: "auto",
            maxHeight: "60%",
            maxWidth: "60%",
          }}
        />
      </Col>

      <Col
        span={10}
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* <label
          style={{
            position: "relative",
            display: "inline-block",
            width: "60px",
            height: "32px",
          }}
        >
          <input
            type="checkbox"
            onChange={toggleTheme}
            checked={theme === "dark"}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme === "dark" ? "#4caf50" : "#ccc",
              transition: "0.4s",
              borderRadius: "34px",
            }}
          >
            <span
              style={{
                content: '""',
                position: "absolute",
                height: "24px",
                width: "24px",
                left: theme === "dark" ? "32px" : "4px",
                bottom: "4px",
                backgroundColor: "#fff",
                transition: "0.4s",
                borderRadius: "50%",
              }}
            ></span>
          </span>
        </label> */}

        <Title style={{ fontSize: "4.5vh", fontWeight: "bold", margin: 0 }}>
          {heading}
        </Title>
      </Col>

      <Col
        span={7}
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Row
          style={{
            width: "90%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <NavbarButton
            iconSize="2.5vw"
            disabled={!networkAccess}
            theme={theme}
            iconType="WifiOutlined"
            strikethrough
            additionalStyles={{ boxShadow: "none", border: "none" }}
          />
          <NavbarButton
            iconSize="2.5vw"
            disabled={!ocppOnline}
            theme={theme}
            iconType="CloudUploadOutlined"
            strikethrough
            additionalStyles={{ boxShadow: "none", border: "none" }}
          />
          <NavbarButton
            disabled={shouldHomeBtnDisabled()}
            theme={theme}
            onClick={handleHomeClick}
            iconType="HomeOutlined"
            additionalStyles={{
              opacity: shouldHomeBtnDisabled() ? "0.35" : "1",
            }}
          />
          <NavbarButton
            theme={theme}
            onClick={handleSettingsClick}
            iconType="SettingOutlined"
            showStrikethroughWhenDisabled={false} // custom visual-only disabling
          />

          {!isLanguageDisabled ? (
            <Dropdown
              overlay={languageMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div>{languageButton}</div>
            </Dropdown>
          ) : (
            <div>{languageButton}</div> // no dropdown when disabled
          )}

          <NavbarButton
            disabled={shouldHomeBtnDisabled()}
            theme={theme}
            iconType="InfoCircleOutlined"
            onClick={handleInfoClick}
            additionalStyles={{
              opacity: shouldHomeBtnDisabled() ? "0.35" : "1",
            }}
          />
        </Row>
      </Col>
    </Row>
  );
}

export default Navbar;
