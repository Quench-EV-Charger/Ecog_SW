import React from "react";
import { render } from '@testing-library/react';

import StoppingRow3 from "./StoppingRow3";

describe('<StoppingRow3 />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <StoppingRow3 letter="Stopping Row3" t={str => str} />
    );

    expect(wrapper.getByTestId('stopping-row3')).toBeTruthy();
    expect(wrapper.getByText('STOPPING_NOTE')).toBeTruthy();
  });
});
