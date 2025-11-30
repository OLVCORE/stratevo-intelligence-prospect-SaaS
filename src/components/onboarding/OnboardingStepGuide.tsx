// src/components/onboarding/OnboardingStepGuide.tsx
// Componente de guia/tutorial para cada step do onboarding

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle2, Clock, Lightbulb } from 'lucide-react';

interface StepGuideProps {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  tips?: string[];
  importantNotes?: string[];
}

const stepInfo: Record<number, StepGuideProps> = {
  1: {
    stepNumber: 1,
    title: 'Dados Básicos da Empresa',
    description: 'Vamos começar com as informações fundamentais da sua empresa. O CNPJ será usado para buscar automaticamente dados da Receita Federal.',
    estimatedTime: '2 minutos',
    tips: [
      'O CNPJ busca automaticamente: Data de Abertura, Situação Cadastral, Natureza Jurídica e Capital Social',
      'Você pode editar os dados buscados automaticamente se necessário',
      'O setor será classificado automaticamente baseado no CNAE principal'
    ],
    importantNotes: [
      'Estes dados são essenciais para identificar seu perfil de cliente ideal (ICP)',
      'O email informado será usado para notificações e recuperação de conta'
    ]
  },
  2: {
    stepNumber: 2,
    title: 'Setores, Nichos e CNAEs',
    description: 'Configure onde você quer prospectar. Essas informações serão usadas para encontrar empresas que se encaixam no seu perfil.',
    estimatedTime: '3 minutos',
    tips: [
      'Selecione setores onde você já tem clientes ou quer expandir',
      'Os CNAEs-alvo ajudam a encontrar empresas com atividades específicas',
      'Os NCMs são importantes se você trabalha com produtos físicos'
    ],
    importantNotes: [
      'Quanto mais específico, melhor será o matching de empresas',
      'Você pode adicionar ou remover setores/nichos depois nas configurações'
    ]
  },
  3: {
    stepNumber: 3,
    title: 'Perfil Cliente Ideal (ICP)',
    description: 'Defina as características do seu cliente ideal: porte, localização, faturamento e outros critérios de qualificação.',
    estimatedTime: '3 minutos',
    tips: [
      'Pense em seus melhores clientes atuais para definir o ICP',
      'Seja específico com faixas de faturamento e número de funcionários',
      'A localização ajuda a focar em regiões onde você pode atender melhor'
    ],
    importantNotes: [
      'O ICP é usado para classificar e priorizar leads automaticamente',
      'Você pode ajustar o ICP depois baseado nos resultados'
    ]
  },
  4: {
    stepNumber: 4,
    title: 'Diferenciais',
    description: 'Conte-nos sobre seus diferenciais e o que destaca sua solução no mercado. Isso ajuda a personalizar recomendações e identificar oportunidades.',
    estimatedTime: '4 minutos',
    tips: [
      'Seja honesto sobre ticket médio e ciclo de venda - isso ajuda na análise',
      'Liste seus principais concorrentes para melhorar a análise competitiva',
      'Os casos de uso ajudam a identificar oportunidades de cross-sell'
    ],
    importantNotes: [
      'Essas informações são usadas para gerar recomendações personalizadas',
      'Você pode atualizar essas informações a qualquer momento'
    ]
  },
  5: {
    stepNumber: 5,
    title: 'ICP Benchmarking',
    description: 'Eleja empresas alvo para oferecer seus serviços e produtos. Adicione clientes atuais e empresas de referência para análise comparativa e identificação de padrões.',
    estimatedTime: '5 minutos',
    tips: [
      'Clientes atuais ajudam a identificar padrões e melhorar o ICP',
      'Empresas de benchmarking servem como referência para análise comparativa',
      'Quanto mais empresas você adicionar, mais robusta será a análise'
    ],
    importantNotes: [
      'Este passo é importante para criar um ICP mais assertivo',
      'As empresas adicionadas serão usadas para identificar oportunidades similares'
    ]
  },
  6: {
    stepNumber: 6,
    title: 'Revisão e Confirmação',
    description: 'Revise e confirme todas as informações fornecidas antes de finalizar o onboarding. Este é o momento de verificar se tudo está correto.',
    estimatedTime: '2 minutos',
    tips: [
      'Verifique especialmente CNPJ, e-mail e dados de contato',
      'Confirme se os setores e nichos selecionados estão corretos',
      'Revise o perfil do cliente ideal e empresas de benchmarking'
    ],
    importantNotes: [
      'Após finalizar, você poderá editar algumas informações nas configurações',
      'A empresa será criada e você receberá acesso completo à plataforma',
      'Recomendamos revisar tudo agora para evitar retrabalho depois'
    ]
  }
};

export function OnboardingStepGuide({ stepNumber }: { stepNumber: number }) {
  const info = stepInfo[stepNumber];
  
  if (!info) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Info className="h-5 w-5 text-primary" />
            {info.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {info.estimatedTime}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {info.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {info.tips && info.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary">
              <Lightbulb className="h-4 w-4" />
              Dicas
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {info.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {info.importantNotes && info.importantNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <Info className="h-4 w-4" />
              Importante
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {info.importantNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

