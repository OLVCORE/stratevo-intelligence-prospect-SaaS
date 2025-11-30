/**
 * Page View Tracker
 * 
 * Automatically tracks page views for analytics
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

export function PageViewTracker() {
  const location = useLocation();
  const analytics = useAnalytics();
  
  useEffect(() => {
    // Track page view on route change
    const pageName = location.pathname.replace(/^\//, '') || 'home';
    analytics.track('page_view', {
      path: location.pathname,
      search: location.search,
      page_name: pageName,
    });
  }, [location.pathname, location.search, analytics]);
  
  return null;
}

