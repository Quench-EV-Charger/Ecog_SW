import React from "react";
import { render } from '@testing-library/react';

import Footer from "./Footer";

describe('<Footer />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <Footer title="Footer title" />
    );

    expect(wrapper.getByTestId('footer')).toBeTruthy();
    expect(wrapper.getByTestId('logo-img')).toBeTruthy();
    expect(wrapper.getByText('Footer title')).toBeDefined();
  });
});
