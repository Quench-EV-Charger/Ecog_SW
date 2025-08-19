import React from "react";
import { render } from '@testing-library/react';

import StoppingRow2 from "./StoppingRow2";
import { waitFor } from "@testing-library/dom";

describe('<StoppingRow2 />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <StoppingRow2 letter="Stopping Row2" t={(str) => str} />
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('stopping-row2')).toBeTruthy();
      expect(wrapper.getByTestId('car-image')).toBeTruthy();
      expect(wrapper.getByText('CHARGING_FINISHING')).toBeTruthy();
      expect(wrapper.getByText('DO_NOT_UNPLUG')).toBeTruthy();
    });
  });
});
