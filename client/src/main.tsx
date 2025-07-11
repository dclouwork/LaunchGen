import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";
import "./index.css";

const isProduction = import.meta.env.MODE === "production";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={isProduction ? import.meta.env.VITE_PUBLIC_POSTHOG_KEY : ""}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        loaded: (posthog) => {
          if (!isProduction) {
            posthog.opt_out_capturing();
            console.log("PostHog analytics disabled in development");
          }
        },
        capture_pageview: isProduction,
        capture_pageleave: isProduction,
        autocapture: isProduction,
        disable_session_recording: !isProduction,
        capture_exceptions: isProduction,
        debug: false,
      }}
    >
      <App />
    </PostHogProvider>
  </StrictMode>
);
