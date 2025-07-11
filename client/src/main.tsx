import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// Initialize PostHog only in production
if (import.meta.env.PROD && import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        posthog.debug(false);
        posthog.opt_out_capturing();
      }
    }
  });
}

const root = createRoot(document.getElementById("root")!);

// Wrap app with PostHogProvider only in production
const AppWithProviders = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    return (
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    );
  }
  
  // In development, render without PostHog
  console.log('PostHog disabled in development mode');
  return <App />;
};

root.render(<AppWithProviders />);
