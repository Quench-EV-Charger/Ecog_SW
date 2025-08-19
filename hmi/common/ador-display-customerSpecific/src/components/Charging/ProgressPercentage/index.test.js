import React from "react";
import { render } from '@testing-library/react';

import { ProgressPercentage } from './index';

describe('<ProgressPercentage />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <ProgressPercentage percent={50}/>
    );

    expect(wrapper.getByTestId('progress-percentage')).toBeTruthy();
    expect(wrapper.getByText('50%')).toBeTruthy();
  });
});
