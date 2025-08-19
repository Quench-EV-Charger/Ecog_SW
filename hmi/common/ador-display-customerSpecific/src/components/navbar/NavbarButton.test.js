import React from "react";
import { fireEvent, render } from '@testing-library/react';

import NavbarButton from './NavbarButton';

describe('<NavbarButton />', () => {
  it('render without crashing', async () => {
    const mockFn = jest.fn();

    const wrapper = render(
      <NavbarButton
        onClick={mockFn}
        iconType="wifi"
      />
    );

    expect(wrapper.getByTestId('navbar-button')).toBeTruthy();

    fireEvent.click(wrapper.getByTestId('navbar-button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
