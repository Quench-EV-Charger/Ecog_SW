import React from "react";
import { render } from '@testing-library/react';

import DateBox from "./DateBox";

describe('<DateBox />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <DateBox />
    );

    expect(wrapper.getByTestId('date-box')).toBeTruthy();
  });
});
