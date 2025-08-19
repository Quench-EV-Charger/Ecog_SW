import React from "react";
import { render } from '@testing-library/react';

import Stopping from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('Stopping page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Stopping />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('stopping-page')).toBeTruthy();
      expect(wrapper.getByTestId('stopping-row1')).toBeTruthy();
      expect(wrapper.getByTestId('stopping-row2')).toBeTruthy();
      expect(wrapper.getByTestId('stopping-row3')).toBeTruthy();
    });
  });
});
