import React from "react";
import {render, waitFor} from '@testing-library/react';

import Header from "./Header";
import TestProvider from "../providers/TestProvider";

describe('<Header />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Header title="Header title" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('header')).toBeTruthy();
      expect(wrapper.getByText('Header title')).toBeTruthy();
    });
  });
});
