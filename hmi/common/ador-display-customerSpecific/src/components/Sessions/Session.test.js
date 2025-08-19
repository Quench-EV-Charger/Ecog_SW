import React from "react";
import { render } from '@testing-library/react';

import Session from "./Session";

describe('<Session />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <Session
        context={{}}
        getStatusText={(str) => str}
        isDisabled={jest.fn()}
        getButtonText={jest.fn()}
      />
    );

    expect(wrapper.getByTestId('session')).toBeTruthy();
    // expect(wrapper.getByRole('button')).toBeTruthy();
  });
});
