import React from "react";
import { Progress } from "antd";

import { getCorrectOutletType, secondsToHms } from "../../utils";
import { OutletType } from "../../constants/constants";

export default function ({ eachItem }) {
  const isAC = getCorrectOutletType(eachItem.outletType) === OutletType.AC;

  if (!isAC) {
    return (
      <Progress
        style={{ marginTop: "1vw" }}
        type="circle"
        percent={!!eachItem.EVRESSSOC && +eachItem.EVRESSSOC.toFixed(0)}
        strokeWidth={7}
        strokeColor="#92D050"
        format={(percent) => <span>{percent}%</span>}
      />
    );
  } else {
    return (
      <Progress
        className="ac-progress"
        style={{ marginTop: "1.95vw" }}
        type="circle"
        format={(percent) => (
          <span style={{ fontSize: "1.57vw" }}>
            {secondsToHms(eachItem.curr_ses_secs)}
          </span>
        )}
      />
    );
  }
}
