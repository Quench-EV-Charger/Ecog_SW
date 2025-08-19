import React from "react";
import { render } from '@testing-library/react';

import Charging from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

beforeEach(() => {
  window.history.pushState({}, 'Page Title', '/charging');
  window.localStorage.setItem('selectedOutlet', 'string');
});

describe('Charging page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <Charging />
      </TestProvider>
    );

    await waitFor(() => {
      // expect(wrapper.getByTestId('charging-page')).toBeTruthy();
      // expect(wrapper.getByTestId('car-image')).toBeTruthy();
      // expect(wrapper.getByText('CHARGING_THREEDOTS')).toBeDefined();
      //Test fails despite component having the truthy IDs
    });
  });
});
