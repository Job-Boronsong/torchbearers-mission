import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DonateModalProvider } from './context/DonateModalContext'
import { VolunteerModalProvider } from './context/VolunteerModalContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DonateModalProvider>
        <VolunteerModalProvider>
          <App />
        </VolunteerModalProvider>
      </DonateModalProvider>
    </BrowserRouter>
  </StrictMode>,
)
