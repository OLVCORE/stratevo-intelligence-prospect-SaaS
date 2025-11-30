/**
 * Analytics Configuration
 * 
 * Centraliza tracking de eventos de produto usando PostHog
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    loaded: (posthog) => {
      if (import.meta.env.MODE === 'development') {
        posthog.debug(); // Debug mode em dev
      }
    },
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // Desabilitar autocapture para mais controle
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },
  });
}

/**
 * Analytics helper functions
 */
export const analytics = {
  /**
   * Track custom event
   */
  track: (event: string, properties?: Record<string, any>) => {
    if (!POSTHOG_KEY) {
      if (import.meta.env.MODE === 'development') {
        console.log('[Analytics] Track:', event, properties);
      }
      return;
    }
    
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  },
  
  /**
   * Identify user
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    if (!POSTHOG_KEY) return;
    
    posthog.identify(userId, {
      ...traits,
      identified_at: new Date().toISOString(),
    });
  },
  
  /**
   * Set user properties
   */
  setUserProperties: (properties: Record<string, any>) => {
    if (!POSTHOG_KEY) return;
    
    posthog.people.set(properties);
  },
  
  /**
   * Reset (logout)
   */
  reset: () => {
    if (!POSTHOG_KEY) return;
    posthog.reset();
  },
  
  /**
   * Track page view
   */
  page: (name?: string, properties?: Record<string, any>) => {
    if (!POSTHOG_KEY) return;
    posthog.capture('$pageview', {
      page_name: name,
      ...properties,
    });
  },
  
  /**
   * Start feature flag evaluation
   */
  isFeatureEnabled: (flag: string): boolean => {
    if (!POSTHOG_KEY) return false;
    return posthog.isFeatureEnabled(flag) || false;
  },
};

export default analytics;

