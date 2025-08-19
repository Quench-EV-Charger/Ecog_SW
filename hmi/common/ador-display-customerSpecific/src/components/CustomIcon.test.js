import React from "react";
import { render } from '@testing-library/react';

import CustomIcon from "./CustomIcon";

describe('<CustomIcon />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <CustomIcon />
    );

    expect(wrapper.getByTestId('custom-icon')).toBeTruthy();
  });
});
