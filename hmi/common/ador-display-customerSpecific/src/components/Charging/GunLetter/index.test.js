import React from "react";
import { render } from '@testing-library/react';

import { GunLetter } from './index';

describe('<GunLetter />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <GunLetter
        letter={'letter'}
        useQAsOutletID={false}
      />
    );

    expect(wrapper.getByTestId('gun-letter')).toBeTruthy();
    expect(wrapper.getByText('letter')).toBeTruthy();
  });
});
