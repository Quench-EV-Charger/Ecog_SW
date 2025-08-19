import React from "react";
import { render } from '@testing-library/react';
import Spinner from "./Spinner";

describe('<Spinner />', () => {
  it('render with props', async () => {
    const wrapper = render(
      <Spinner text="Spinner" />
    );

    expect(wrapper.getByTestId('spinner')).toBeTruthy();
    expect(wrapper.getByText('Spinner')).toBeDefined();
  });
});
