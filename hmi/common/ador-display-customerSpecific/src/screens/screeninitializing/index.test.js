import React from "react";
import { render } from '@testing-library/react';

import ScreenInitializing from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('ScreenInitializing page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <ScreenInitializing />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('screen-initializing-page')).toBeTruthy();
      expect(wrapper.getByText('INITIALIZING')).toBeDefined();
      expect(wrapper.getByText('CHARGER_INITIALIZING')).toBeDefined();
    });
  });
});
