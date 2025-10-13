import React, { Component } from "react";
import { Button } from "antd";

import Percentage from "./Percentage";
import OutletImage from "./OutletImage";
import ReservationNotification from "../../components/ReservationNotification";

import { GunLetters } from "../../constants/constants";
import { getCorrectOutletType, capitalizeFirstLetter } from "../../utils";

import QuenchSymbol from "../../assets/images/quench_symbol.png";
import CCSPlugDark from "../../assets/images/ccs-plug-dark.png";
import QRCode from "qrcode";

import * as S from "./styles";

class OutletSession extends Component {
  constructor(props) {
    super(props);
    this.state = {
      qrData: null,
    };
  }

  async componentDidMount() {
    const { context } = this.props;
    if (context?.config?.API) {
      try {
        const response = await fetch(`${context.config.API}/ocpp-client/config`);
        const data = await response.json();
        if (data.QRHashStr) {
          const qrUrl = await QRCode.toDataURL(data.QRHashStr, { width: 300 });
          this.setState({ qrData: qrUrl });
        }
      } catch (err) {
        console.warn("QR generation failed:", err);
      }
    }
  }

  renderOutletId = () => {
    const { eachItem, useQAsOutletID } = this.props;
    if (useQAsOutletID) {
      return (
        <div
          style={{
            ...S.GunIdContainer,
            backgroundImage: `url(${QuenchSymbol})`,
            backgroundSize: "cover",
            backgroundColor: "#E62518",
          }}
        />
      );
    } else {
      return (
        <div style={{ ...S.GunIdContainer, background: "#FFFFFF" }}>
          {GunLetters[eachItem?.index]}
        </div>
      );
    }
  };

  render() {
    const {
      eachItem,
      context,
      getStatusText,
      handleSessionClick,
      handleButtonClick,
      getButtonText,
      isDisabled,
    } = this.props;

    const { qrData } = this.state;

    return (
      <div style={S.TariffContainer} data-testid="session">
        <div onClick={() => handleSessionClick(eachItem)} style={S.TariffBox}>
          {this.renderOutletId()}
          <div style={S.TariffBoxContent}>
            <span style={S.OutletTypeText}>
              {qrData && (
                <img
                  src={CCSPlugDark}
                  alt={`${eachItem?.outletType}`}
                  style={{
                    width: "24px",
                    paddingRight: "2px",
                    paddingBottom: "6px",
                  }}
                  data-testid="outlet-image"
                />
              )}
              {getCorrectOutletType(eachItem?.outletType)}{" "}
              {capitalizeFirstLetter(eachItem?.mode)}2
            </span>

            {context?.activeOutlets?.includes(eachItem?.outlet) ? (
              <Percentage eachItem={eachItem} />
            ) : (
              <OutletImage
                eachItem={eachItem}
                faultedOutlets={context.faultedOutlets}
                blockedOutlets={context.blockedOutlets}
                activeOutlets={context.activeOutlets}
                chargingMode={context.chargingMode}
                reservedOutlets={context.reservedOutlets}
                inoperativeOutlets={context.inoperativeOutlets}
                config={context.config}
              />
            )}

            <div>
              {context?.reservedOutlets?.includes("1") &&
                eachItem?.outlet?.includes("1") && (
                  <ReservationNotification outletId={1} />
                )}
              {context?.reservedOutlets?.includes("2") &&
                eachItem?.outlet?.includes("2") && (
                  <ReservationNotification outletId={2} />
                )}
            </div>
          </div>
        </div>

        <span style={S.StatusText}>{getStatusText(eachItem)}</span>

        {context.chargingMode == 0 ? (
          <div style={S.ButtonContainer}>
            <Button
              style={S.Button(eachItem, isDisabled)}
              onClick={() => handleButtonClick(eachItem)}
            >
              {getButtonText(eachItem)}
            </Button>
          </div>
        ) : context.chargingMode == 1 && eachItem.outlet == 1 ? (
          <div style={S.ButtonContainer}>
            <Button
              style={S.Button2(context.chargerState[0], isDisabled)}
              onClick={() => handleButtonClick(context.chargerState[0])}
            >
              {getButtonText(context.chargerState[0])}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
}

export default OutletSession;
