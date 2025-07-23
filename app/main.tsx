import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// biome-ignore lint/style/noNonNullAssertion: root is always present
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>Hello World</div>
  </StrictMode>,
);
