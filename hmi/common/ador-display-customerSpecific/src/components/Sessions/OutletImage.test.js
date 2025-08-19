import React from "react";
import { render } from '@testing-library/react';

import OutletImage from "./OutletImage";

describe('<OutletImage />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <OutletImage />
    );

    expect(wrapper.getByTestId('outlet-image')).toBeTruthy();
  });
});
