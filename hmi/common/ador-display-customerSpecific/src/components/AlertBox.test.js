import React from "react";
import { fireEvent, render } from '@testing-library/react';

import AlertBox from "./AlertBox";

describe('<AlertBox />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <AlertBox
        iconType="warning"
        display={true}
      />
    );

    expect(wrapper.getByTestId('alert-box')).toBeTruthy();
    expect(wrapper.getByTestId('alert-icon')).toBeTruthy();
  });
  it('check props are working', async () => {
    const mockFn = jest.fn();

    const wrapper = render(
      <AlertBox
        iconType="warning"
        display={true}
        errorMessage="This is error message."
        onClose={mockFn}
      />
    );

    expect(wrapper.getByTestId('alert-box')).toBeTruthy();
    expect(wrapper.getByText('This is error message.')).toBeDefined();

    expect(wrapper.getByTestId('close-button')).toBeTruthy();

    fireEvent.click(wrapper.getByTestId('close-button'));

    expect(mockFn).toHaveBeenCalled();
  });
});
