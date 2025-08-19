import React from "react";

import RetrieveSession from './index';
import TestProvider from "../../../providers/TestProvider";
import { render } from '@testing-library/react';
import {screen, waitFor} from '@testing-library/dom';

describe('<RetrieveSession />', () => {
  it('render without crashing', async () => {
    const wrapper = render(
      <TestProvider>
        <RetrieveSession t={(str) => str} />
      </TestProvider>
    );

    // await waitFor(() => {
    //   expect(screen.getByTestId('retrive-from-frid')).toBeTruthy();
    //   expect(screen.getByTestId('scan-rfid-image')).toBeTruthy();
    // });
  });
});
