import React from "react";
import { render } from '@testing-library/react';

import ScreenSaver from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('ScreenSaver page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <ScreenSaver />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('screen-saver')).toBeTruthy();
      expect(wrapper.getByTestId('car-image')).toBeTruthy();
      expect(wrapper.getByText('CHARGING_IN_PROGRESS')).toBeDefined();
      expect(wrapper.getByTestId('back-button')).toBeDefined();
      expect(wrapper.getByTestId('date-box')).toBeDefined();
    });
  });
});
