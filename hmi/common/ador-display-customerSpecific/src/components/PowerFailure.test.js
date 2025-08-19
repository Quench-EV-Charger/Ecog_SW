import React from "react";
import {render, waitFor} from '@testing-library/react';

import TestProvider from "../providers/TestProvider";
import PowerFailure from "./PowerFailure";

describe('<PowerFailure />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <PowerFailure shown />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('power-failure')).toBeTruthy();
      expect(wrapper.getByTestId('warning-image')).toBeTruthy();
      expect(wrapper.getByText('POWER_FAILURE')).toBeDefined();
    });
  });
});
