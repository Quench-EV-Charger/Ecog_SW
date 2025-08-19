/* eslint eqeqeq: "off"*/
import React from "react";
import { Row } from "antd";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import StoppingRow1 from "../../components/Stopping/StoppingRow1";
import StoppingRow2 from "../../components/Stopping/StoppingRow2";
import StoppingRow3 from "../../components/Stopping/StoppingRow3";

import { GunLetters } from "../../constants/constants";
import { StoppingPage } from "./styles";

class Stopping extends React.Component {
  static contextType = MainContext;

  componentDidMount() {
    const { addPreventAutoRouteOutlets, selectedState } = this.context; // prettier-ignore
    addPreventAutoRouteOutlets(selectedState);

    if (this.context.config?.isRfidFlow) {
      if (this.context.shouldGoHomeOnSessisonStart)
        this.context.setShouldGoHomeOnSessionStart(false);
    }
  }

  componentDidUpdate() {
    const { selectedState, changePath } = this.context;
    if (selectedState?.pilot == 0) {
      changePath("/");
    }
  }

  render() {
    const { selectedState } = this.context;
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Navbar
              heading={context.t("CHARGING_STOPPING")}
              theme="light"
              headerColor="#E62518"
            />
            <Row style={StoppingPage} data-testid="stopping-page">
              <StoppingRow1
                letter={GunLetters[selectedState?.index]}
                useQAsOutletID={context.config?.useQAsOutletID}
              />
              <StoppingRow2 t={context.t} />
              <StoppingRow3 t={context.t} />
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default Stopping;
