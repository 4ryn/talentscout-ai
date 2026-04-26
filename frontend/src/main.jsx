import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A26',
            color: '#E8E8F0',
            border: '1px solid #252535',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#0A0A0F' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#0A0A0F' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)