import React from "react";

import { ReactComponent as Languages } from "../assets/icons/languages.svg";

export default function CustomIcon({ fill }) {
  return (
    <Languages width="3vw" height="3vw" fill={fill} data-testid="custom-icon" />
  );
}
