import React from "react";
import { fireEvent, render } from '@testing-library/react';

import LanguageDropdown from './index';
import TestProvider from "../../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

const languages = ['a', 'b'];

describe('<LanguageDropdown />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <LanguageDropdown
        languages={languages}
      />
    );

    expect(wrapper.getByTestId('language-dropdown-link')).toBeTruthy();
  });
  it('test language menu', async () => {
    const mockFn = jest.fn();

    const wrapper = render(
      <TestProvider>
        <LanguageDropdown
          onClick={mockFn}
          languages={languages}
        />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('language-dropdown-link')).toBeTruthy();
    });

    fireEvent.click(wrapper.getByTestId('language-dropdown-link'));

    expect(wrapper.getByTestId('language-choices')).toBeDefined();
  });
});
