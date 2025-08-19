import React from "react";
import { render } from '@testing-library/react';

import AlertsPage from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('alerts page test', () => {
  it('render without crashing', async () => {

    const wrapper = render(
      <TestProvider>
        <AlertsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('alerts-page')).toBeTruthy();
      expect(wrapper.getByTestId('error-image')).toBeTruthy();
      expect(wrapper.getByText('ERROR_REASON')).toBeTruthy();
      expect(wrapper.getByText('INTERNAL_CABINET_EXCEPTION')).toBeTruthy();
    });
  });
});
