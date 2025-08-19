import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";

import MainContext from "../providers/MainContext";
import Sessions from "../screens/sessions";
import AuthorizeEv from "../screens/authEV";
import PlugEV from "../screens/plugEV";
import UnplugEV from "../screens/unplugev";
import Charging from "../screens/charging";
import RetrieveSession from "../components/AuthEV/RetriveFromRfid";
import SessionResult from "../screens/sessionresult";
import Screensaver from "../screens/screensaver";
import Reboot from "../screens/reboot";
import StopCharging from "../screens/stopcharging";
import Stopping from "../screens/stopping";
import CheckPoints from "../screens/checkpoints";
import ChargingMode from "../screens/chargingmode";
import RemoteAuth from "../screens/reboot/RemoteAuth";
import Info from "../screens/info";

class Routing extends Component {
  static contextType = MainContext;
  
  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <div className="container">
            <Switch>
              <Route exact path="/" component={Sessions} />
              <Route exact path="/chargingmode" component={ChargingMode} />
              <Route exact path="/plugev" component={PlugEV} />
              <Route exact path="/unplugev" component={UnplugEV} />
              <Route exact path="/authorize" component={AuthorizeEv} />
              <Route exact path="/checkpoints" component={CheckPoints} />
              <Route exact path="/charging" component={Charging} />
              <Route exact path="/stopcharging" component={StopCharging} />
              <Route exact path="/stopping" component={Stopping} />
              <Route exact path="/retrieve" component={RetrieveSession} />
              <Route exact path="/session-result" component={SessionResult} />
              <Route exact path="/screensaver" component={Screensaver} />
              <Route exact path="/reboot" component={Reboot} />
              <Route exact path="/remoteauth" component={RemoteAuth} />
              <Route exact path="/info" component={Info} />
            </Switch>
          </div>
        )}
      </MainContext.Consumer>
    );
  }
}

export default Routing;

