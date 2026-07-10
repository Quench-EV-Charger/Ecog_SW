import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.jsx'

function ErrorFallback({error}) {
  return (
    <div style={{color: 'red', background: 'white', padding: '20px', fontFamily: 'monospace'}}>
      <h2>App Crashed!</h2>
      <p>{error.message}</p>
      <pre style={{overflow: 'auto'}}>{error.stack}</pre>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
