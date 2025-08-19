import React, { Component } from "react";
import QRCode from "qrcode";

import InoperativeIcon from "../../assets/icons/inoperative.png";
import FaultedIcon from "../../assets/icons/close.png";
import BlockedIcon from "../../assets/icons/blocked.png";
import CCSPlugDark from "../../assets/images/ccs-plug-dark.png";
import CCSPlugWhite from "../../assets/images/ccs-plug-white.png";
import ACPlugDark from "../../assets/images/ac-plug-dark.png";
import ACPlugWhite from "../../assets/images/ac-plug-white.png";
import CHADEMOPlugDark from "../../assets/images/chademo-plug-dark.png";
import CHADEMOPlugWhite from "../../assets/images/chademo-plug-white.png";
import Reserved from "../../assets/images/reserved.png";


const outletImages = {
  CCSPlugDark,
  CCSPlugWhite,
  ACPlugDark,
  ACPlugWhite,
  CHADEMOPlugDark,
  CHADEMOPlugWhite,
};

// Static QR cache shared across all instances
let sharedQrUrl = null;

class OutletImage extends Component {
  state = {
    qrUrl: null,
  };

  async componentDidMount() {
    const { config } = this.props;
  
    // Only generate QR once globally
    if (!sharedQrUrl && config?.API) {
      try {
        const response = await fetch(`${config.API}/ocpp-client/config`);
        const data = await response.json();
  
        if (data.QRHashStr) {
          const url = await QRCode.toDataURL(data.QRHashStr, { width: 300 });
          sharedQrUrl = url;
          this.setState({ qrUrl: url });
        }
      } catch (err) {
        console.warn("QR generation failed:", err);
      }
    } else {
      // Already generated, use from cache
      this.setState({ qrUrl: sharedQrUrl });
    }
  }
  

  getImgSrc = () => {
    const {
      eachItem,
      faultedOutlets,
      blockedOutlets,
      reservedOutlets,
      inoperativeOutlets,
      chargingMode,
      config,
    } = this.props;

    const isFaultedBecauseOfCombo =
      chargingMode > 0 &&
      (faultedOutlets?.includes(eachItem?.outlet) ||
        blockedOutlets?.includes(eachItem?.outlet));

    if (this.state.qrUrl) return this.state.qrUrl;
    if (isFaultedBecauseOfCombo) return BlockedIcon;
    if (inoperativeOutlets?.includes(eachItem?.outlet)) return InoperativeIcon;
    if (faultedOutlets?.includes(eachItem?.outlet)) return FaultedIcon;
    if (blockedOutlets?.includes(eachItem?.outlet)) return BlockedIcon;
    if (reservedOutlets?.includes(eachItem.outlet)) return Reserved;

    const outletTypeUpperCase = eachItem?.outletType?.toUpperCase();
    const outletImageName = `${outletTypeUpperCase}PlugDark`;
    return outletImages[outletImageName] || Reserved;
  };

  getImgWidth = () => {
    const { eachItem, faultedOutlets, blockedOutlets, reservedOutlets, chargingMode } = this.props;
  
    const isFaultedBecauseOfCombo =
      chargingMode > 0 &&
      (faultedOutlets?.includes(eachItem?.outlet) ||
        blockedOutlets?.includes(eachItem?.outlet));
  
    // If QR is being used, apply 10vw
    if (this.state.qrUrl) return "13vw";
  
    if (
      isFaultedBecauseOfCombo ||
      faultedOutlets?.includes(eachItem?.outlet) ||
      blockedOutlets?.includes(eachItem?.outlet)
    ) {
      return "7.85vw";
    }
  
    if (eachItem?.outletType === "CCS") return "5.9vw";
    if (reservedOutlets?.includes(eachItem?.outlet)) return "5.9vw";
    return "7.85vw";
  };
  

  getImgMarginTop = () => {
    const { eachItem, faultedOutlets, blockedOutlets, chargingMode } = this.props;

    const isFaultedBecauseOfCombo =
      chargingMode > 0 &&
      (faultedOutlets?.includes(eachItem?.outlet) ||
        blockedOutlets?.includes(eachItem?.outlet));

    if (
      isFaultedBecauseOfCombo ||
      faultedOutlets?.includes(eachItem?.outlet) ||
      blockedOutlets?.includes(eachItem?.outlet)
    ) {
      return undefined;
    }

    if (eachItem?.outletType === "CCS") return "0.585vw";
  };

  render() {
    const { eachItem, reservedOutlets } = this.props;

    return (
      <img
        src={this.getImgSrc()}
        alt={eachItem?.outletType || "Outlet image"}
        style={{
          width: this.getImgWidth(),
          marginTop: this.getImgMarginTop(),
          marginBottom: reservedOutlets?.includes(eachItem.outlet) ? "1vw" : "",
        }}
        data-testid="outlet-image"
      />
    );
  }
}

export default OutletImage;
