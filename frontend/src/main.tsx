import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if (import.meta.env.DEV && typeof window !== 'undefined') {
  Promise.all([
    import('@axe-core/react'),
    import('react-dom')
  ])
    .then(([{ default: axe }, reactDom]) => {
      void axe(React, reactDom, 1000)
    })
    .catch(() => {
      // Ignore issues loading axe in development (e.g., offline install)
    })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
