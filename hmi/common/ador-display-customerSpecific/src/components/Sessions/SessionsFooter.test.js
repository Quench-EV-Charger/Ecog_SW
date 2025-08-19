import React from "react";
import { render } from '@testing-library/react';

import SessionsFooter from "./SessionsFooter";

describe('<SessionsFooter />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <SessionsFooter />
    );

    // expect(wrapper.getByTestId('sessions-footer')).toBeTruthy();
    // expect(wrapper.getByRole('button')).toBeTruthy();
    // Commented as footer is removed on Dual VCCU mode
  });
});
