import React, { Component } from "react";
import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import * as S from "./styles";
import { withTranslation } from "react-i18next";
import { Row, Col, Button } from "antd";
// import About from "../../components/Info/About";
import Temps from "../../components/Info/Temperatures";
import Transactions from "../../components/Info/Transactions";
import Alarms from "../../components/Info/Alarms";
// import DateBox from "../../components/DateBox";


class Info extends Component {
    static contextType = MainContext;

    state = {
        activeTab: "Transactions", // Was "About" before
    };

    takeToHome = () => {
        this.context.changePath("/");
    };

    handleTabClick = (tabName) => {
        this.setState({ activeTab: tabName });
    };

    renderTabContent = () => {
        switch (this.state.activeTab) {
            // case "About":
            //     return <About />;
            case "Temperatures":
                return <Temps />;
            case "Transactions":
                return <Transactions />;
            case "Alarms":
                return <Alarms/>;
            default:
                return null;
        }
    };

    render() {
        return (
            <MainContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        <Navbar heading={"Information"} theme="light" />
                        <Row>

                            <div className="tab-container">
                                {/* <Col offset={2} span={5} style={S.RightCol}>

                                    <Button
                                        style={this.state.activeTab === "About" ? S.ActiveTab : S.HomeButton}
                                        onClick={() => this.handleTabClick("About")}
                                    >
                                        About
                                    </Button>
                                </Col> */}
                                
                                <Col span={6} offset={3} style={S.RightCol}>

                                    <Button
                                        style={this.state.activeTab === "Transactions" ? S.ActiveTab : S.HomeButton}
                                        onClick={() => this.handleTabClick("Transactions")}
                                    >
                                        Transaction logs
                                    </Button>
                                </Col>
                                <Col span={6} style={S.RightCol}>

                                    <Button
                                        style={this.state.activeTab === "Alarms" ? S.ActiveTab : S.HomeButton}
                                        onClick={() => this.handleTabClick("Alarms")}
                                    >
                                        Alarms
                                    </Button>
                                </Col>
                                <Col span={6}  style={S.RightCol}>
                                    <Button
                                        style={this.state.activeTab === "Temperatures" ? S.ActiveTab : S.HomeButton}
                                        onClick={() => this.handleTabClick("Temperatures")}
                                    >
                                        Temperatures
                                    </Button>
                                </Col>
                                
                            </div>
                        </Row>
                        <Row>
                            {this.renderTabContent()}
                        </Row>
                        {/* <DateBox color="dark" /> */}
                        {/* may cause conflicts with tables */}
                       
                    </React.Fragment>
                )}
            </MainContext.Consumer>
        );
    }
}

export default withTranslation()(Info);
