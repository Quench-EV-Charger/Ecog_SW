import React from "react";
import { render } from '@testing-library/react';

import StoppingRow1 from "./StoppingRow1";

describe('<StoppingRow1 />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <StoppingRow1 letter="Stopping Row1" />
    );

    expect(wrapper.getByTestId('stopping-row1')).toBeTruthy();
    expect(wrapper.getByText('Stopping Row1')).toBeDefined();
  });
});
