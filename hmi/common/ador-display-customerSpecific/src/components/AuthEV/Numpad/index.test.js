import React from "react";
import { fireEvent, render, waitFor } from '@testing-library/react';

import Numpad from './index';
import TestProvider from "../../../providers/TestProvider";

describe('<Numpad />', () => {
  it('render without crashing', async () => {

    const mockOnPINSubmit = jest.fn();

    const wrapper = render(
      <TestProvider>
        <Numpad currentPIN="" onPINSubmit={mockOnPINSubmit}/>
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('numpad')).toBeTruthy();
      expect(wrapper.getByTestId('otp-input')).toBeTruthy();
      expect(wrapper.getAllByRole('button')).toHaveLength(12);
    });

    const enterBtn = wrapper.getByText('ENTER');
    expect(enterBtn).toBeTruthy();

    fireEvent.click(enterBtn);

  });
});
