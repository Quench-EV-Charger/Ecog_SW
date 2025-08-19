import React from "react";
import { render } from '@testing-library/react';

import ScreenStarting from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('ScreenStarting page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <ScreenStarting />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('screen-starting-page')).toBeTruthy();
      expect(wrapper.getByTestId('power-off-icon')).toBeTruthy();
      expect(wrapper.getByText('BRAND_PRODUCT')).toBeDefined();
    });
  });
});
