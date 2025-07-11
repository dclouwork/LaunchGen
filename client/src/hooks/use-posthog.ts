import { usePostHog as usePostHogOriginal } from 'posthog-js/react';

/**
 * Custom hook for using PostHog analytics
 * This wrapper ensures PostHog is only used in production
 */
export function usePostHog() {
  // Only use the real PostHog hook in production
  if (import.meta.env.PROD) {
    try {
      return usePostHogOriginal();
    } catch (error) {
      // If PostHog isn't initialized, return a mock object
      console.warn('PostHog not initialized:', error);
      return createMockPostHog();
    }
  }
  
  // In development, return a mock object that logs to console
  return createMockPostHog();
}

/**
 * Creates a mock PostHog object for development
 * Logs all tracking calls to console instead of sending to PostHog
 */
function createMockPostHog() {
  return {
    capture: (event: string, properties?: any) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Event: ${event}`, properties);
      }
    },
    identify: (distinctId: string, properties?: any) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Identify: ${distinctId}`, properties);
      }
    },
    setPersonProperties: (properties: any) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Set Person Properties:`, properties);
      }
    },
    reset: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Reset`);
      }
    },
    group: (type: string, key: string, properties?: any) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Group: ${type} - ${key}`, properties);
      }
    },
    setPersonPropertiesForFlags: (properties: any) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Set Person Properties for Flags:`, properties);
      }
    },
    reloadFeatureFlags: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Reload Feature Flags`);
      }
      return Promise.resolve();
    },
    isFeatureEnabled: (flag: string) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Check Feature Flag: ${flag}`);
      }
      return false;
    },
    getFeatureFlag: (flag: string) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Get Feature Flag: ${flag}`);
      }
      return undefined;
    },
    onFeatureFlags: (callback: () => void) => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] On Feature Flags`);
      }
      return () => {};
    },
    opt_out_capturing: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Opt Out`);
      }
    },
    opt_in_capturing: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Opt In`);
      }
    },
    has_opted_out_capturing: () => {
      return false;
    },
    clear_opt_in_out_capturing: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Clear Opt In/Out`);
      }
    },
    startSessionRecording: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Start Session Recording`);
      }
    },
    stopSessionRecording: () => {
      if (import.meta.env.DEV) {
        console.log(`[PostHog Dev] Stop Session Recording`);
      }
    },
    sessionRecordingStarted: () => {
      return false;
    }
  };
}