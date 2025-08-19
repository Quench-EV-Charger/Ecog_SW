import React from "react";
import { render } from '@testing-library/react';

import StopCharging from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('StopCharging page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <StopCharging />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('stop-charging-page')).toBeTruthy();
      expect(wrapper.getByTestId('scan-rfid-image')).toBeTruthy();
      expect(wrapper.getByTestId('date-box')).toBeTruthy();
    });
  });
});
