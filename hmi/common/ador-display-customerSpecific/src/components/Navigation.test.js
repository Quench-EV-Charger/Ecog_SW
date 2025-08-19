import React from "react";
import {render, waitFor} from '@testing-library/react';

import TestProvider from "../providers/TestProvider";
import Navigation from "./Navigation";

describe('<Navigation />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Navigation />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('navigation')).toBeTruthy();
      expect(wrapper.getAllByTestId('navigation-tab')).toBeTruthy();
    });
  });
});
