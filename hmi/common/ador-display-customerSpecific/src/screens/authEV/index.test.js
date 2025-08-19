import React from "react";
import { render } from '@testing-library/react';

import AuthPage from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('auth EV page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <AuthPage />
      </TestProvider>
    );

    // await waitFor(() => {
    //   expect(wrapper.getByTestId('auth-page')).toBeTruthy();
    //   expect(wrapper.getByTestId('navigation')).toBeTruthy();
    //   expect(wrapper.getByTestId('numpad')).toBeTruthy();
    //   expect(wrapper.getByTestId('scan-rfid-image')).toBeTruthy();
    // });
  });
});
