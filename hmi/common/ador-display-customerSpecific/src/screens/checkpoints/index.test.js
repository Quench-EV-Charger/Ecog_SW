import React from "react";
import { render } from '@testing-library/react';

import CheckPoints from './index';
import TestProvider from "../../providers/TestProvider";
import {waitFor} from "@testing-library/dom";

describe('CheckPoints page test', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <CheckPoints />
      </TestProvider>
    );

    await waitFor(() => {
      expect(wrapper.getByTestId('checkpoints-page')).toBeTruthy();
      expect(wrapper.getAllByTestId('checkpoint')).toHaveLength(8);
    });
  });
});
