import { Row, Col, Button } from "antd";
import React, { Component } from "react";
import MainContext from "../../providers/MainContext";
import * as S from "./styles";
import { withTranslation } from "react-i18next";

class HomeScreenFooter extends Component {
    static contextType = MainContext;

    takeToHome = () => {
        this.context.changePath("/");
    };

    render() {
        return (
            <MainContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        <Row style={{marginTop:"10vh"}}>
                            <Col span={8} offset={10}>
                                <Button onClick={this.takeToHome} style={S.HomeButtonRed}>
                                    {context.t("GO_HOME")}
                                </Button>
                            </Col>
                        </Row>
                    </React.Fragment>
                )}
            </MainContext.Consumer>
        );
    }
}
export default withTranslation()(HomeScreenFooter);