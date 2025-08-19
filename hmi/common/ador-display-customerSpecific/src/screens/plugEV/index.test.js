import React from "react";
import { render } from '@testing-library/react';

import PlugEV from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('PlugEV page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <PlugEV />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('plug-ev-page')).toBeTruthy();
      expect(wrapper.getByText('PLUG_YOUR_EV')).toBeDefined();
      expect(wrapper.getByTestId('car-image')).toBeTruthy();
      expect(wrapper.getByTestId('date-box')).toBeTruthy();
    });
  });
});
