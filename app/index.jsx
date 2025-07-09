import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
  opt_out_capturing_by_default: import.meta.env.VITE_PUBLIC_DISABLE_TRACKING === 'true',
  debug: true,
  disable_session_recording: true,
  person_profiles: 'identified_only',
};
const apiKey =
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY || 'phc_i1lWRELFSWLrbwV8M8sddiFD83rVhWzyZhP27T3s6V8';

// Debug logging for Sentry DSN
console.log('Sentry DSN from env:', import.meta.env.VITE_SENTRY_DSN_UI);

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN_UI,
  integrations: [browserTracingIntegration(), replayIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions, reduce in production
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample rate for session replays (10%)
  replaysOnErrorSampleRate: 1.0, // Sample rate for replays on error (100%)
  environment: import.meta.env.MODE,
  debug: false, // Enable debug mode to see more logs
});

// Add browser globals for linter
const { document } = globalThis;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PostHogProvider apiKey={apiKey} options={options}>
      <App />
    </PostHogProvider>
  </React.StrictMode>,
);
