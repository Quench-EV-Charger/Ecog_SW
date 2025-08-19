import React from "react";
import { render } from '@testing-library/react';

import ModeSelector from './index';
import { ChargingModes } from "../../../constants/constants";

describe('<ModeSelector />', () => {
  it('render without crashing', async () => {
    const mockFn = jest.fn();

    const wrapper = render(
      <ModeSelector
        isSelected={false}
        text={'Mode Select'}
        buttonmode={ChargingModes.F}
        onClick={mockFn}
      />
    );

    expect(wrapper.getByTestId('mode-selector')).toBeTruthy();
    expect(wrapper.getByText('Mode Select')).toBeTruthy();
  });
});
