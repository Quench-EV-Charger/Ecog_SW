import React from "react";
import { render } from '@testing-library/react';

import Sessions from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('Sessions page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Sessions />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('sessions-page')).toBeTruthy();
      expect(wrapper.getByTestId('emergency-stop')).toBeTruthy();
      expect(wrapper.getByTestId('power-failure')).toBeTruthy();
      // expect(wrapper.getByTestId('sessions-footer')).toBeTruthy();
    });
  });
});
