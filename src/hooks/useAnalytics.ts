/**
 * React Hook for Analytics
 * 
 * Automatically identifies user and provides tracking functions
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { analytics } from '@/lib/analytics';

export function useAnalytics() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  // Auto-identify user when available
  useEffect(() => {
    if (user && tenant) {
      analytics.identify(user.id, {
        email: user.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        tenantStatus: tenant.status,
      });
      
      analytics.setUserProperties({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        email: user.email,
      });
    }
  }, [user, tenant]);
  
  return analytics;
}

/**
 * Hook to track page views
 */
export function usePageTracking(pageName: string, properties?: Record<string, any>) {
  const { tenant } = useTenant();
  
  useEffect(() => {
    analytics.page(pageName, {
      ...properties,
      tenant_id: tenant?.id,
    });
  }, [pageName, tenant?.id]);
}

