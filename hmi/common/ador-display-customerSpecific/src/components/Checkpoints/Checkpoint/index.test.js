import React from "react";
import { render } from '@testing-library/react';

import { CheckPoint } from './index';

describe('<CheckPoint />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <CheckPoint
        iconType="check"
        iconColor={'white'}
        text={'Check point'}
      />
    );

    expect(wrapper.getByTestId('checkpoint')).toBeTruthy();
    expect(wrapper.getByTestId('icon')).toBeTruthy();
    expect(wrapper.getByText('Check point')).toBeTruthy();
  });
});
