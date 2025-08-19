import React from "react";
import { render } from '@testing-library/react';

import Reboot from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('Reboot page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Reboot />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('reboot-page')).toBeTruthy();
      expect(wrapper.getByTestId('sync-icon')).toBeTruthy();
      expect(wrapper.getByTestId('power-off-icon')).toBeTruthy();
      expect(wrapper.getByText('SYSTEM_IS_REBOOTING')).toBeDefined();
      expect(wrapper.getByText('REBOOT_ESTIMATION')).toBeDefined();
    });
  });
});
