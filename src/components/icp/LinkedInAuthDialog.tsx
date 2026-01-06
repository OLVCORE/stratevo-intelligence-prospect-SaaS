// src/components/icp/LinkedInAuthDialog.tsx
// Dialog para autenticação do LinkedIn OAuth

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LinkedInCredentialsDialog } from './LinkedInCredentialsDialog';

interface LinkedInAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export function LinkedInAuthDialog({
  open,
  onOpenChange,
  onAuthSuccess
}: LinkedInAuthDialogProps) {
  return (
    <LinkedInCredentialsDialog
      open={open}
      onOpenChange={onOpenChange}
      onAuthSuccess={onAuthSuccess}
    />
  );
}
