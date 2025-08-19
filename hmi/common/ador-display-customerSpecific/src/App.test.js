import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { render } from '@testing-library/react';
import TestProvider from "./providers/TestProvider";

it('renders without crashing', () => {
  const div = document.createElement('div');
  render(
    <TestProvider>
      <App />
    </TestProvider>
  );
  ReactDOM.unmountComponentAtNode(div);
});
