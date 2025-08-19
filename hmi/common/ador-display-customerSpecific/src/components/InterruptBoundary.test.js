import React from "react";
import {render} from '@testing-library/react';

import InterruptBoundary from "./InterruptBoundary";
import TestProvider from "../providers/TestProvider";
import { waitFor } from '@testing-library/dom';

describe('<InterruptBoundary />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <InterruptBoundary>
          <div>Interrupt Boundary</div>
        </InterruptBoundary>
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.queryByText('Interrupt Boundary')).not.toBeInTheDocument();
    });
  });
  it('render with props', async () => {
    const wrapper = render(
      <TestProvider>
        <InterruptBoundary showAlert>
          <div>Interrupt Boundary</div>
        </InterruptBoundary>
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('alerts-page')).toBeTruthy();
    });
  });
});
