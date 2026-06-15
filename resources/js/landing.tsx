import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/landing.css';
import App from './landing/App';

const rootEl = document.getElementById('root');

if (rootEl) {
  // basename is injected by landing.blade.php so React Router works both at the
  // root domain (basename "/") and under a Laravel sub-path
  // (e.g. /koperasi-kakitangan/public).
  const basename = rootEl.dataset.basename || '/';

  createRoot(rootEl).render(
    <StrictMode>
      <App basename={basename} />
    </StrictMode>,
  );
}
