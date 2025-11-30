// src/pages/crm/OnboardingTenant.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Ship, Code, Truck, Building, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BUSINESS_MODELS = [
  {
    key: 'eventos',
    name: 'Empresa de Eventos',
    description: 'Gestão de casamentos, eventos corporativos e festas',
    icon: Calendar,
    color: '#8b5cf6'
  },
  {
    key: 'comercio_exterior',
    name: 'Comércio Exterior',
    description: 'Trading, importação e exportação',
    icon: Ship,
    color: '#0ea5e9'
  },
  {
    key: 'software',
    name: 'Software/SaaS',
    description: 'Vendas de software e soluções tecnológicas',
    icon: Code,
    color: '#10b981'
  },
  {
    key: 'logistica',
    name: 'Logística e Transportes',
    description: 'Transportadoras e operadores logísticos',
    icon: Truck,
    color: '#f59e0b'
  }
];

export default function OnboardingTenant() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tenantData, setTenantData] = useState({
    name: '',
    slug: '',
    businessModel: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTenant = async () => {
    if (!tenantData.name || !tenantData.slug || !tenantData.businessModel) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setIsCreating(true);

      // Buscar configuração do modelo de negócio
      const { data: modelTemplate, error: templateError } = await supabase
        .from('business_model_templates')
        .select('crm_config')
        .eq('model_key', tenantData.businessModel)
        .single();

      if (templateError) throw templateError;

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          nome: tenantData.name,
          slug: tenantData.slug,
          business_model: tenantData.businessModel,
          crm_config: modelTemplate.crm_config,
          created_by: user.id,
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Vincular usuário como owner
      const { error: userTenantError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (userTenantError) throw userTenantError;

      toast.success('Empresa cadastrada com sucesso!');
      navigate('/crm/dashboard');

    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast.error(error.message || 'Erro ao cadastrar empresa');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar Sua Empresa</CardTitle>
          <CardDescription>
            Configure o CRM ideal para o seu modelo de negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  placeholder="Minha Empresa Ltda"
                  value={tenantData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    
                    setTenantData({ ...tenantData, name, slug });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Identificador Único (Slug)</Label>
                <Input
                  id="slug"
                  placeholder="minha-empresa"
                  value={tenantData.slug}
                  onChange={(e) => setTenantData({ ...tenantData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Será usado na URL: stratevo.app/crm/{tenantData.slug}
                </p>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Próximo: Escolher Modelo de Negócio
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Escolha o Modelo de Negócio</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  O CRM será customizado automaticamente para o seu segmento
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {BUSINESS_MODELS.map((model) => {
                  const Icon = model.icon;
                  const isSelected = tenantData.businessModel === model.key;

                  return (
                    <Card
                      key={model.key}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setTenantData({ ...tenantData, businessModel: model.key })}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: `${model.color}20` }}
                          >
                            <Icon className="h-6 w-6" style={{ color: model.color }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{model.name}</h3>
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={handleCreateTenant}
                  disabled={!tenantData.businessModel || isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Criando...' : 'Criar Empresa e CRM'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


