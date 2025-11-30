/**
 * Product Tour Component
 * 
 * Interactive guided tour for new users using React Joyride
 */

import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const TOUR_STEPS: Step[] = [
  {
    target: '.verification-card',
    content: 'Aqui você verifica quais produtos a empresa investigada já utiliza. Clique em "Verificar" para iniciar a análise.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.opportunities-tab',
    content: 'Veja oportunidades de cross-sell identificadas por IA baseadas no setor da empresa e produtos já detectados.',
    placement: 'top',
  },
  {
    target: '.decisores-tab',
    content: 'Encontre os decisores-chave da empresa para sua abordagem comercial. Dados enriquecidos automaticamente.',
    placement: 'top',
  },
  {
    target: '.analysis-360-tab',
    content: 'Análise completa 360° com recomendações estratégicas personalizadas baseadas em todos os dados coletados.',
    placement: 'top',
  },
  {
    target: '.executive-summary-tab',
    content: 'Resumo executivo consolidado de todas as análises, pronto para apresentação ou exportação.',
    placement: 'top',
  },
];

interface ProductTourProps {
  steps?: Step[];
  runOnMount?: boolean;
}

export function ProductTour({ steps = TOUR_STEPS, runOnMount = false }: ProductTourProps) {
  const [run, setRun] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!user || !runOnMount) return;
    
    // Verificar se usuário já completou o tour
    const hasCompletedTour = localStorage.getItem(`tour-completed-${user.id}`);
    const hasSeenTourToday = localStorage.getItem(`tour-seen-today-${user.id}`);
    const today = new Date().toDateString();
    
    // Não mostrar se já completou ou viu hoje
    if (hasCompletedTour === 'true' || hasSeenTourToday === today) {
      return;
    }
    
    // Delay para garantir que DOM está pronto
    const timer = setTimeout(() => {
      // Verificar se elementos existem na página atual
      const hasVerificationCard = document.querySelector('.verification-card');
      if (hasVerificationCard) {
        setRun(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, runOnMount, location.pathname]);
  
  const handleTourCallback = (data: CallBackProps) => {
    const { status, type } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (user) {
        if (status === STATUS.FINISHED) {
          localStorage.setItem(`tour-completed-${user.id}`, 'true');
        }
        localStorage.setItem(`tour-seen-today-${user.id}`, new Date().toDateString());
      }
      setRun(false);
    }
    
    // Track analytics
    if (type === 'tour:start') {
      // analytics.track('tour_started', { step_count: steps.length });
    } else if (type === 'step:after') {
      // analytics.track('tour_step_completed', { step_index: data.index });
    } else if (status === STATUS.FINISHED) {
      // analytics.track('tour_completed', { step_count: steps.length });
    }
  };
  
  // Não renderizar se não há usuário ou não deve rodar
  if (!user || (!run && !runOnMount)) {
    return null;
  }
  
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleTourCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: 'hsl(var(--background))',
        },
        tooltip: {
          borderRadius: '8px',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: 'hsl(var(--foreground))',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}

/**
 * Hook to manually trigger tour
 */
export function useProductTour() {
  const [run, setRun] = useState(false);
  
  const startTour = () => {
    setRun(true);
  };
  
  return {
    startTour,
    TourComponent: () => (
      <ProductTour runOnMount={false} />
    ),
  };
}

