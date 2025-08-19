import React from "react";
import { render } from '@testing-library/react';

import UnplugEV from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('UnplugEV page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <UnplugEV />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('unplug-ev-page')).toBeTruthy();
      expect(wrapper.getByTestId('car-image')).toBeTruthy();
      expect(wrapper.getByTestId('date-box')).toBeTruthy();
    });
  });
});
