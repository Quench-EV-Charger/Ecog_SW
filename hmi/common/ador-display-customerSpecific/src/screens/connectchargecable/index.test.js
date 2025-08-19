import React from "react";
import { render } from '@testing-library/react';

import ScreenNoCable from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('ScreenNoCable page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <ScreenNoCable />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('screen-no-cable')).toBeTruthy();
      expect(wrapper.getByTestId('pause-circle-icon')).toBeTruthy();
      expect(wrapper.getAllByText('INSTALL_CHARGE_CABLE').length).toBeGreaterThan(1);
    });
  });
});
