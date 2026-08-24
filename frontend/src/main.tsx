import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DonateModalProvider } from './context/DonateModalContext'
import { VolunteerModalProvider } from './context/VolunteerModalContext'
import { getCachedPublicContent, getPublicContentCacheKey } from './api'
import { preloadPublicRoute } from './routeLoaders'

const renderApp = () => {
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
}

const pathname = window.location.pathname;
const cacheKey = getPublicContentCacheKey(pathname);
const hasFreshPublicContent = cacheKey !== undefined && getCachedPublicContent(cacheKey) !== undefined;

if (hasFreshPublicContent) {
  preloadPublicRoute(pathname)
    .catch(() => undefined)
    .finally(renderApp);
} else {
  renderApp();
}
