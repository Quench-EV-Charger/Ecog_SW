import React from "react";
import { render } from '@testing-library/react';

import AnimationPlayer from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('animation test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <AnimationPlayer />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('animation-player')).toBeTruthy();
    })
  });
});
