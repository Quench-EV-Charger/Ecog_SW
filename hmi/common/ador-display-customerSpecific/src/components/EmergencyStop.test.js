import React from "react";
import { render } from '@testing-library/react';

import EmergencyStop from "./EmergencyStop";
import TestProvider from "../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('<EmergencyStop />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <EmergencyStop />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('emergency-stop')).toBeTruthy();
      expect(wrapper.getByTestId('stop-image')).toBeTruthy();
      expect(wrapper.getByText('EMERGENCY_PRESSED')).toBeTruthy();
      expect(wrapper.getByText('EMERGENCY_RELEASE')).toBeTruthy();
    });
  });
});
