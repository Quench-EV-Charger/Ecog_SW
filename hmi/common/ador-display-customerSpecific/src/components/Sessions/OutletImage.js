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

// Cache for QR codes
const qrCache = {};

class OutletImage extends Component {
  state = {
    qrUrl: null,
  };

  qrPollInterval = null;
  lastQRHash = null;

  fetchQRCode = async () => {
    const { config, eachItem } = this.props;
  
    if (!config?.API) return;

    try {
      const response = await fetch(`${config.API}/ocpp-client/config`);
      const data = await response.json();
  
      if (data.QRHashStr && data.QRHashStr.trim()) {
        // Check if QR string has changed
        if (this.lastQRHash !== data.QRHashStr) {
          this.lastQRHash = data.QRHashStr;
          let qrStringToUse = data.QRHashStr;
          
          // Check if multiple QR strings are provided (comma-separated)
          if (data.QRHashStr.includes(",")) {
            // Multiple QR strings - use outlet-specific one
            const qrStrings = data.QRHashStr.split(",").map(str => str.trim());
            const outletIndex = parseInt(eachItem?.outlet) - 1; // Convert outlet number to index
            
            // Use corresponding QR string, or fallback to first one
            qrStringToUse = qrStrings[outletIndex] || qrStrings[0];
          }
          
          // Clear cache and generate new QR for this outlet
          const cacheKey = `outlet_${eachItem?.outlet}`;
          const url = await QRCode.toDataURL(qrStringToUse, { width: 300 });
          qrCache[cacheKey] = url;
          
          this.setState({ qrUrl: url });
          console.log(`[OutletImage] QR updated for outlet ${eachItem?.outlet}`);
        }
      } else {
        // QR string is empty/cleared - reset to normal
        if (this.lastQRHash !== null) {
          this.lastQRHash = null;
          const cacheKey = `outlet_${eachItem?.outlet}`;
          delete qrCache[cacheKey]; // Clear cache
          this.setState({ qrUrl: null });
          console.log(`[OutletImage] QR cleared for outlet ${eachItem?.outlet}`);
        }
      }
    } catch (err) {
      console.warn("QR generation failed:", err);
    }
  };

  async componentDidMount() {
    // Initial fetch
    await this.fetchQRCode();
    
    // Start polling every 5 seconds
    this.qrPollInterval = setInterval(() => {
      this.fetchQRCode();
    }, 5000);
  }

  componentDidUpdate(prevProps) {
    // If outlet changes, immediately refetch
    if (prevProps.eachItem?.outlet !== this.props.eachItem?.outlet) {
      this.lastQRHash = null; // Reset to force refresh
      this.fetchQRCode();
    }
  }

  componentWillUnmount() {
    if (this.qrPollInterval) {
      clearInterval(this.qrPollInterval);
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
