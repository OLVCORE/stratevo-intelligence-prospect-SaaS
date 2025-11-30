/**
 * ARIA Labels Helper Hook
 * 
 * Provides consistent ARIA labels for accessibility
 */

export interface AriaLabelOptions {
  action: string;
  context?: string;
  description?: string;
}

export function useAriaLabel({ action, context, description }: AriaLabelOptions) {
  const label = context ? `${action} - ${context}` : action;
  const describedBy = description ? `${action.replace(/\s+/g, '-').toLowerCase()}-description` : undefined;
  
  return {
    'aria-label': label,
    'aria-describedby': describedBy,
    ...(description && {
      'aria-description': description,
    }),
  };
}

/**
 * Screen reader only text component
 */
export function SrOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only" aria-hidden="false">
      {children}
    </span>
  );
}

