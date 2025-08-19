import React from "react";
import { render } from '@testing-library/react';

import Navbar from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('<Navbar />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Navbar
          heading="Navbar"
        />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('navbar')).toBeTruthy();
      expect(wrapper.getByText('Navbar')).toBeTruthy();
      expect(wrapper.getAllByTestId('navbar-button')).toHaveLength(6);
    });
  });
});
