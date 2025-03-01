import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;

// Check if the app is being pre-rendered by react-snap
const isPrerendering = navigator.userAgent.includes('ReactSnap');

// Use the appropriate rendering method based on whether we're prerendering
if (rootElement.hasChildNodes() && !isPrerendering) {
  // If we have child nodes and we're not prerendering, hydrate the app
  hydrateRoot(
    rootElement,
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>
  );
} else {
  // Otherwise, create a new root
  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>
  );
}