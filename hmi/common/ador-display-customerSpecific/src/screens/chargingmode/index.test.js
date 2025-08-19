import React from "react";
import { render } from '@testing-library/react';

import ChargingMode from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('ChargingMode page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <ChargingMode />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('charging-mode-page')).toBeTruthy();
      expect(wrapper.getAllByTestId('mode-selector')).toHaveLength(3);
      // expect(wrapper.getByTestId('next-button')).toBeDefined();
      // expect(wrapper.getByTestId('cancel-button')).toBeDefined();
      // expect(wrapper.getByTestId('date-box')).toBeDefined();
      // Commented because these elements no longer exist and are not required for Dual VCCU mode
    });
  });
});
