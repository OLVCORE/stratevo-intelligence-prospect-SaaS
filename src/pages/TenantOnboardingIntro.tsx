// src/pages/TenantOnboardingIntro.tsx
// Página introdutória do onboarding explicando o processo

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/ModeToggle';
import { 
  Building2, Target, Users, Zap, CheckCircle2, ArrowRight,
  FileText, BarChart3, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TenantOnboardingIntro() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Building2,
      title: 'Dados da Empresa',
      description: 'CNPJ, razão social, setor e informações básicas. Dados da Receita Federal são buscados automaticamente.',
      time: '2 minutos'
    },
    {
      icon: Target,
      title: 'Setores e Nichos',
      description: 'Configure onde você quer prospectar: setores-alvo, nichos, CNAEs e NCMs relacionados aos seus produtos.',
      time: '3 minutos'
    },
    {
      icon: Users,
      title: 'Perfil Cliente Ideal',
      description: 'Defina características do seu cliente ideal: porte, localização, faturamento e critérios de qualificação.',
      time: '3 minutos'
    },
    {
      icon: Zap,
      title: 'Situação Atual',
      description: 'Informe seus produtos, diferenciais, casos de uso e concorrentes para personalizar a plataforma.',
      time: '4 minutos'
    },
    {
      icon: FileText,
      title: 'Histórico e Enriquecimento',
      description: 'Adicione clientes atuais, catálogo de produtos e cases de sucesso (opcional).',
      time: '5 minutos'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-sm px-4 py-2 bg-primary/20 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-2" />
            Configuração Inicial
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Bem-vindo ao STRATEVO One!
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Vamos configurar sua empresa em <strong>5 passos rápidos</strong> para começar a usar a plataforma.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Tempo estimado: <strong>15-20 minutos</strong></span>
          </div>
        </div>

        {/* Steps Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-xs">
                    {step.time}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary">Passo {index + 1}</span>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits */}
        <Card className="mb-12 bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              O que você vai configurar:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Perfil da sua empresa</div>
                  <div className="text-sm text-muted-foreground">Dados cadastrais e administrativos</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">ICP (Ideal Customer Profile)</div>
                  <div className="text-sm text-muted-foreground">Setores, nichos e características-alvo</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Catálogo de produtos</div>
                  <div className="text-sm text-muted-foreground">Produtos e serviços que você oferece</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Configuração de busca</div>
                  <div className="text-sm text-muted-foreground">Termos e palavras-chave para prospecção</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Pronto para começar?</CardTitle>
              <CardDescription>
                Vamos configurar sua empresa em poucos minutos. Você pode pular etapas opcionais e completar depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                size="lg" 
                className="w-full md:w-auto text-lg px-8 h-14"
                onClick={() => navigate('/tenant-onboarding')}
              >
                Começar Configuração
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Você pode salvar e continuar depois. Seus dados serão salvos automaticamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

