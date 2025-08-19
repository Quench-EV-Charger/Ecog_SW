import React from "react";
import { Progress } from "antd";

import * as S from "./styles";

export const ProgressPercentage = ({ percent }) => (
  <Progress
    style={S.Progress}
    type="circle"
    percent={percent}
    strokeWidth={7}
    strokeColor="#00B051"
    format={(percent) => (
      <span style={{ color: "white" }}>{percent.toFixed(0)}%</span>
    )}
    data-testid="progress-percentage"
  />
);
