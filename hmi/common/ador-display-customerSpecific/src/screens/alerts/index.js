import React, { Component } from "react";
import { Row, Typography } from "antd";
import { withTranslation } from "react-i18next";

import Navbar from "../../components/navbar";
import MainContext from "../../providers/MainContext";

import errorIcon from "../../assets/images/error-icon.png";
import { Errors } from "../../constants/Errors";

import * as S from "./styles";

const { Title } = Typography;

class AlertScreen extends Component {
  static contextType = MainContext;

  isErrorNotReceivedFromEvents = () => {
    return (
      this.context?.errorCode &&
      Object.keys(Errors) &&
      Array.isArray(Object.keys(Errors)) &&
      Object.keys(Errors).includes(this.context.errorCode)
    );
  };

  getInternalCabinetExceptionText = () => {
    if (this.context?.errorCode === "communication_error") {
      return this.context.t("INTERNAL_CABINET_EXCEPTION_COMM_ERR");
    } else {
      return this.context.t("INTERNAL_CABINET_EXCEPTION");
    }
  };

  getCommErrorStyle = () => {
    if (this.context?.errorCode === "communication_error") {
      return S.CommErrorCodeText;
    } else {
      return S.ErrorCodeText;
    }
  };

  componentDidMount() {
    if (
      this.context.showAlert &&
      this.context.errorCode === "communication_error"
    ) {
      this.context.changePath("/");
    }
  }

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Navbar heading={context.t("CONTACT_SUPPORT")} theme="light" />
            <Row style={S.AlertPage} data-testid="alerts-page">
              <Row style={S.IconContainer}>
                <img
                  style={S.Icon}
                  alt="Error sign"
                  src={errorIcon}
                  data-testid="error-image"
                />
              </Row>
              <Row style={S.ErrorReasonTextContainer}>
                <Title style={S.ErrorReasonText}>
                  {context.t("ERROR_REASON")}
                </Title>
              </Row>
              <Row style={S.InternalExceptionTextContainer}>
                <Title style={S.InternalExceptionText}>
                  {this.getInternalCabinetExceptionText()}
                </Title>
              </Row>
              <Row style={S.ErrorCodeTextContainer}>
                <Title style={this.getCommErrorStyle()}>
                  {this.isErrorNotReceivedFromEvents()
                    ? context.t(Errors[context.errorCode])
                    : context.t(context.errorCode)}
                </Title>
              </Row>
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default withTranslation()(AlertScreen);
