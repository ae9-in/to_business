import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ShopsProvider } from './providers/ShopsProvider.tsx'
import { ToastProvider } from './hooks/useToast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ShopsProvider>
          <App />
        </ShopsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
