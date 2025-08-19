import React, { useContext, useState } from "react";
import * as S from "./styles";
import { withTranslation } from "react-i18next";
import { Row, Col, Button } from "antd";
import Temps from "../../components/InfoTab/Temperatures";
import Transactions from "../../components/InfoTab/Transactions";
import Alarms from "../../components/InfoTab/Alarms";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const Info = () => {
    const [activeTab, setActiveTab] = useState("Transactions");
    const { theme, toggleTheme } = useContext(ThemeContext);


    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "Temperatures":
                return <Temps />;
            case "Transactions":
                return <Transactions />;
            case "Alarms":
                return <Alarms />;
            default:
                return null;
        }
    };

    return (
        <>
            <div>
                <S.TabContainer>
                    <Col span={6} offset={3} style={S.RightCol}>
                        <Button
                            style={activeTab === "Transactions" ? S.ActiveTab(theme) : S.HomeButton(theme)}
                            onClick={() => handleTabClick("Transactions")}
                        >
                            Transaction logs
                        </Button>
                    </Col>
                    <Col span={6} style={S.RightCol}>
                        <Button
                            style={activeTab === "Alarms" ? S.ActiveTab(theme) : S.HomeButton(theme)}
                            onClick={() => handleTabClick("Alarms")}
                        >
                            Alarms
                        </Button>
                    </Col>
                    <Col span={6} style={S.RightCol}>
                        <Button
                            style={activeTab === "Temperatures" ? S.ActiveTab(theme) : S.HomeButton(theme)}
                            onClick={() => handleTabClick("Temperatures")}
                        >
                            Temperatures
                        </Button>
                    </Col>
                </S.TabContainer>
            </div>
            <div>
                {renderTabContent()}
            </div>
        </>
    );
};

export default withTranslation()(Info);
