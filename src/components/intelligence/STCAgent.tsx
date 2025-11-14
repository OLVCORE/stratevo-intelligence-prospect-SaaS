import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2, Send, Sparkles, TrendingUp, Users, Target, Lightbulb, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'agent';
  content: string;
  data?: any;
  timestamp: Date;
}

interface Props {
  companyId: string;
  companyName: string;
  cnpj?: string;
}

/**
 * STC Agent (Sales & TOTVS Checker Agent)
 * Agente conversacional inteligente para análise profunda de empresas
 * Usa GPT-4O-MINI para custo-benefício otimizado
 */
export function STCAgent({ companyId, companyName, cnpj }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [costInfo, setCostInfo] = useState<{ tokens: any; cost: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Carregar histórico ao abrir modal (em background, não bloqueia)
  useEffect(() => {
    if (open) {
      // Permitir perguntas IMEDIATAMENTE ao abrir - SEM DELAY
      setInitialCheckDone(true);
      
      // Carregar histórico em background (não bloqueia)
      if (messages.length === 0) {
      loadConversationHistory();
      }
      
      // Focar no input IMEDIATAMENTE (sem delay)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
          console.log('[STCAgent] ✅ Input focado via ref');
        } else {
          const input = document.querySelector('input[placeholder="Faça uma pergunta sobre a empresa..."]') as HTMLInputElement;
          if (input) {
            input.focus();
            console.log('[STCAgent] ✅ Input focado via querySelector');
          } else {
            console.error('[STCAgent] ❌ Input não encontrado ainda');
          }
        }
      }, 100); // ✅ REDUZIDO: 300ms → 100ms (mais rápido)
    } else {
      // Reset ao fechar
      setInitialCheckDone(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadConversationHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('stc_agent_conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          role: msg.role as 'user' | 'agent',
          content: msg.content,
          data: msg.data,
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
        setInitialCheckDone(true);
      } else {
        // ✅ SEM BUSCA EXTERNA - apenas mensagem de boas-vindas
        setMessages([{
          role: 'agent',
          content: `👋 Olá! Sou o STC Agent, seu assistente de análise inteligente.\n\n**Dados Disponíveis:**\n✅ Análise das 9 abas enriquecidas\n✅ Decisores já identificados\n✅ Análise Digital completa\n✅ Produtos TOTVS recomendados\n✅ Estratégia de abordagem\n\n**Pergunte sobre:**\n• Decisores da empresa\n• Momento de compra\n• Produtos TOTVS ideais\n• Estratégia de abordagem\n• Análise completa\n\nFaça sua pergunta abaixo! ⬇️`,
          timestamp: new Date()
        }]);
        setInitialCheckDone(true);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      // ✅ SEM BUSCA EXTERNA - apenas marcar como pronto
      setInitialCheckDone(true);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveMessage = async (role: 'user' | 'agent', content: string, data?: any, metadata?: any) => {
    try {
      // Verificar se company_id existe antes de salvar
      const { data: companyExists } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .single();
      
      if (!companyExists) {
        console.warn('[STCAgent] ⚠️ Company ID não existe, não salvando conversa:', companyId);
        return; // Não bloquear, apenas não salvar
      }
      
      const { error } = await supabase
        .from('stc_agent_conversations')
        .insert({
          company_id: companyId,
          role,
          content,
          data,
          metadata
        });
      
      if (error) {
        // Erro 409 (Conflict) ou 23503 (foreign key) - não bloquear
        if (error.code === '23505' || error.code === '23503' || error.message?.includes('409')) {
          console.warn('[STCAgent] Mensagem não salva (duplicada ou FK inválida) - ignorando:', error.message);
        } else {
          console.error('[STCAgent] Error saving message:', error);
        }
      }
    } catch (err) {
      console.error('[STCAgent] Error saving message:', err);
      // Não bloquear a UI mesmo com erro ao salvar
    }
  };

  // Auto-scroll para o final quando novas mensagens aparecerem
  useEffect(() => {
    setTimeout(() => {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } catch {}
      const viewport = (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null)
        ?? (document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null);
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  }, [messages]);

  // Habilita scroll manual por mouse e teclado no viewport do ScrollArea
  useEffect(() => {
    const viewport = (scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null)
      ?? (document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null);
    if (!viewport) return;

    // Garante que o viewport seja rolável e focável
    viewport.style.overflowY = 'auto';
    viewport.tabIndex = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const step = 60;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowDown':
          viewport.scrollTop += step;
          break;
        case 'ArrowUp':
          viewport.scrollTop -= step;
          break;
        case 'PageDown':
          viewport.scrollTop += viewport.clientHeight * 0.9;
          break;
        case 'PageUp':
          viewport.scrollTop -= viewport.clientHeight * 0.9;
          break;
        case 'Home':
          viewport.scrollTop = 0;
          break;
        case 'End':
          viewport.scrollTop = viewport.scrollHeight;
          break;
      }
    };

    const focusViewport = () => viewport.focus();
    viewport.addEventListener('keydown', onKeyDown);
    viewport.addEventListener('mouseenter', focusViewport);
    viewport.addEventListener('click', focusViewport);
    return () => {
      viewport.removeEventListener('keydown', onKeyDown);
      viewport.removeEventListener('mouseenter', focusViewport);
      viewport.removeEventListener('click', focusViewport);
    };
  }, [open]);

  // ❌ REMOVIDO: startInitialCheck - não precisa mais fazer buscas externas
  // Os dados já estão enriquecidos nas 9 abas!
  
  // Função helper para análise local (fallback quando edge functions falharem)
  const generateLocalAnalysis = (question: string, context: any, companyData: any): string => {
    const questionLower = question.toLowerCase();
    
    // Análise de Decisores
    if (questionLower.includes('decisor') || questionLower.includes('contato') || questionLower.includes('quem são')) {
      const decisores = context.decisores || [];
      if (decisores.length === 0) {
        return '**Decisores**\n\n❌ Nenhum decisor identificado para esta empresa.\n\nVerifique a aba "Decisores" após o enriquecimento com Apollo.';
      }
      
      let resposta = `**Decisores Identificados (${decisores.length})**\n\n`;
      decisores.slice(0, 10).forEach((d: any, i: number) => {
        resposta += `${i + 1}. **${d.nome}**\n`;
        if (d.cargo) resposta += `   Cargo: ${d.cargo}\n`;
        if (d.email) resposta += `   Email: ${d.email}\n`;
        if (d.linkedin) resposta += `   LinkedIn: ${d.linkedin}\n`;
        if (d.telefone) resposta += `   Telefone: ${d.telefone}\n`;
        resposta += '\n';
      });
      
      if (decisores.length > 10) {
        resposta += `\n... e mais ${decisores.length - 10} decisor(es).\n`;
      }
      
      return resposta;
    }
    
    // Análise de Produtos TOTVS (200+ produtos no banco!)
    if (questionLower.includes('produto') || questionLower.includes('totvs') || questionLower.includes('solução')) {
      const produtos = context.produtos || [];
      const produtosCount = context.produtos_count || produtos.length;
      const usaTotvs = context.totvs?.usaTotvs || false;
      
      let resposta = `**Análise de Produtos TOTVS**\n\n`;
      
      if (usaTotvs) {
        resposta += `✅ **Usa TOTVS** (Confiança: ${context.totvs?.confianca || 0}%)\n\n`;
      } else {
        resposta += `❌ **Não confirmado uso de TOTVS**\n\n`;
      }
      
      if (produtosCount > 0) {
        resposta += `**Produtos Recomendados (${produtosCount} do catálogo de 200+):**\n\n`;
        produtos.slice(0, 10).forEach((p: any, i: number) => {
          resposta += `${i + 1}. **${typeof p === 'string' ? p : p.name || p.nome || p.sku || p}**\n`;
          if (p.description || p.descricao) resposta += `   ${(p.description || p.descricao).substring(0, 100)}...\n`;
          if (p.recommendation_score || p.score) resposta += `   Score: ${p.recommendation_score || p.score}\n`;
          if (p.reason) resposta += `   Motivo: ${p.reason}\n`;
          resposta += `\n`;
        });
        
        if (produtosCount > 10) {
          resposta += `\n... e mais ${produtosCount - 10} produto(s) recomendado(s) do catálogo.\n`;
        }
      } else {
        resposta += `💡 **Produtos sugeridos:** Baseado no setor e porte, considere produtos TOTVS para ${context.empresa.setor || 'este segmento'}.\n`;
        resposta += `📚 Catálogo disponível com 200+ produtos TOTVS.\n`;
      }
      
      return resposta;
    }
    
    // Análise de Similar Companies
    if (questionLower.includes('similar') || questionLower.includes('empresas similares')) {
      const similar = context.similar || [];
      const similarCount = context.similar_count || similar.length;
      
      if (similarCount === 0) {
        return '**Empresas Similares**\n\n❌ Nenhuma empresa similar identificada ainda.\n\nComplete a aba "Similar" para análise de empresas similares.';
      }
      
      let resposta = `**Empresas Similares (${similarCount})**\n\n`;
      similar.slice(0, 10).forEach((s: any, i: number) => {
        resposta += `${i + 1}. **${s.nome}**\n`;
        if (s.score) resposta += `   Score de Similaridade: ${s.score}\n`;
        if (s.location) resposta += `   Localização: ${s.location}\n`;
        if (s.employees_min || s.employees_max) {
          resposta += `   Funcionários: ${s.employees_min || '?'}-${s.employees_max || '?'}\n`;
        }
        if (s.source) resposta += `   Fonte: ${s.source}\n`;
        resposta += `\n`;
      });
      
      if (similarCount > 10) {
        resposta += `\n... e mais ${similarCount - 10} empresa(s) similar(es).\n`;
      }
      
      return resposta;
    }
    
    // Análise de Clients
    if (questionLower.includes('client') || questionLower.includes('clientes')) {
      const clientes = context.clientes || [];
      const clientesCount = context.clientes_count || clientes.length;
      
      if (clientesCount === 0) {
        return '**Clientes**\n\n❌ Nenhum cliente identificado ainda.\n\nComplete a aba "Clients" para análise de clientes da empresa.';
      }
      
      let resposta = `**Clientes Identificados (${clientesCount})**\n\n`;
      clientes.slice(0, 10).forEach((c: any, i: number) => {
        resposta += `${i + 1}. **${c.nome}**\n`;
        if (c.tipo) resposta += `   Tipo: ${c.tipo}\n`;
        if (c.valor) resposta += `   Valor: R$ ${c.valor.toLocaleString('pt-BR')}\n`;
        if (c.status) resposta += `   Status: ${c.status}\n`;
        resposta += `\n`;
      });
      
      if (clientesCount > 10) {
        resposta += `\n... e mais ${clientesCount - 10} cliente(s).\n`;
      }
      
      return resposta;
    }
    
    // Análise de Competitors
    if (questionLower.includes('competidor') || questionLower.includes('concorrente')) {
      const competidores = context.competidores || [];
      const competidoresCount = context.competidores_count || competidores.length;
      
      if (competidoresCount === 0) {
        return '**Concorrentes**\n\n❌ Nenhum concorrente identificado ainda.\n\nComplete a aba "Competitors" para análise de concorrentes TOTVS.';
      }
      
      let resposta = `**Concorrentes TOTVS Identificados (${competidoresCount})**\n\n`;
      competidores.slice(0, 10).forEach((c: any, i: number) => {
        resposta += `${i + 1}. **${c.nome}**\n`;
        if (c.categoria) resposta += `   Categoria: ${c.categoria}\n`;
        if (c.posicao_mercado) resposta += `   Posição: ${c.posicao_mercado}\n`;
        if (c.vantagens_totvs?.length > 0) {
          resposta += `   ✅ Vantagens TOTVS: ${c.vantagens_totvs.slice(0, 3).join(', ')}\n`;
        }
        resposta += `\n`;
      });
      
      if (competidoresCount > 10) {
        resposta += `\n... e mais ${competidoresCount - 10} concorrente(s).\n`;
      }
      
      return resposta;
    }
    
    // Análise de Momento de Compra / Estratégia
    if (questionLower.includes('momento') || questionLower.includes('compra') || questionLower.includes('estratégia') || questionLower.includes('abordagem')) {
      const temperatura = context.icp?.temperatura || 'N/A';
      const icpScore = context.icp?.score || 0;
      
      let resposta = `**Momento de Compra e Estratégia**\n\n`;
      resposta += `🌡️ **Temperatura:** ${temperatura}\n`;
      resposta += `📊 **ICP Score:** ${icpScore}/100\n\n`;
      
      if (temperatura === 'Hot' || icpScore > 70) {
        resposta += `✅ **Momento Ideal:** Empresa com alta probabilidade de compra.\n\n`;
        resposta += `**Estratégia Recomendada:**\n`;
        resposta += `- Abordagem direta via LinkedIn dos decisores\n`;
        resposta += `- Apresentação de casos de sucesso do setor\n`;
        resposta += `- Foco em ROI e resultados rápidos\n`;
      } else if (temperatura === 'Warm' || icpScore > 40) {
        resposta += `🟡 **Momento Moderado:** Empresa com potencial, requer nutrição.\n\n`;
        resposta += `**Estratégia Recomendada:**\n`;
        resposta += `- Envio de conteúdo educacional\n`;
        resposta += `- Build relationship com decisores\n`;
        resposta += `- Acompanhamento trimestral\n`;
      } else {
        resposta += `🔵 **Momento Frio:** Requer trabalho de educação e relacionamento.\n\n`;
        resposta += `**Estratégia Recomendada:**\n`;
        resposta += `- Newsletter mensal\n`;
        resposta += `- Webinars e eventos\n`;
        resposta += `- Acompanhamento de sinais de compra\n`;
      }
      
      return resposta;
    }
    
    // Análise Digital / URLs
    if (questionLower.includes('digital') || questionLower.includes('url') || questionLower.includes('site') || questionLower.includes('web')) {
      const urls = context.digital?.urls || [];
      
      if (urls.length === 0) {
        return '**Análise Digital**\n\n❌ Nenhuma URL analisada ainda.\n\nComplete a aba "Digital" para análise profunda de URLs.';
      }
      
      let resposta = `**Análise Digital Completa (${urls.length} URLs)**\n\n`;
      
      urls.slice(0, 10).forEach((url: any, i: number) => {
        resposta += `${i + 1}. **${url.titulo || url.url}**\n`;
        resposta += `   🔗 ${url.url}\n`;
        if (url.descricao) resposta += `   📝 ${url.descricao.substring(0, 150)}...\n`;
        if (url.palavras_chave?.length > 0) {
          resposta += `   🔑 Keywords: ${url.palavras_chave.slice(0, 5).join(', ')}\n`;
        }
        if (url.conteudo) {
          resposta += `   📄 Análise: ${url.conteudo.substring(0, 200)}...\n`;
        }
        resposta += `\n`;
      });
      
      if (urls.length > 10) {
        resposta += `\n... e mais ${urls.length - 10} URL(s) analisada(s).\n`;
      }
      
      if (context.digital?.tecnologias?.length > 0) {
        resposta += `\n**Tecnologias Identificadas:**\n`;
        context.digital.tecnologias.slice(0, 10).forEach((tech: any) => {
          resposta += `- ${typeof tech === 'string' ? tech : tech.nome || tech}\n`;
        });
      }
      
      return resposta;
    }
    
    // Resposta padrão (análise geral)
    let resposta = `**Análise Geral da Empresa**\n\n`;
    resposta += `**Empresa:** ${context.empresa.nome}\n`;
    if (context.empresa.cnpj) resposta += `**CNPJ:** ${context.empresa.cnpj}\n`;
    if (context.empresa.setor) resposta += `**Setor:** ${context.empresa.setor}\n`;
    if (context.empresa.porte) resposta += `**Porte:** ${context.empresa.porte}\n`;
    
    // ✅ Incluir análise de descrição e mercado (da aba TOTVS)
    if (context.totvs?.analise_descricao) {
      resposta += `\n**📝 Análise de Descrição:**\n${context.totvs.analise_descricao.substring(0, 300)}...\n`;
    }
    if (context.totvs?.analise_mercado) {
      resposta += `\n**🏭 Análise de Mercado:**\n${context.totvs.analise_mercado.substring(0, 300)}...\n`;
    }
    if (context.totvs?.palavras_chave?.length > 0) {
      resposta += `\n**🔑 Palavras-chave:** ${context.totvs.palavras_chave.slice(0, 10).join(', ')}\n`;
    }
    
    resposta += `\n📊 **Resumo das 9 Abas:**\n`;
    resposta += `\n**1. TOTVS:** ${context.totvs?.usaTotvs ? '✅ Usa' : '❌ Não confirmado'} (${context.totvs?.confianca || 0}% confiança)\n`;
    resposta += `**2. Decisores:** ${context.decisores.length} identificados\n`;
    resposta += `**3. Digital:** ${context.digital?.urls_count || 0} URLs analisadas\n`;
    resposta += `**4. Similar:** ${context.similar_count || 0} empresas similares\n`;
    resposta += `**5. Clients:** ${context.clientes_count || 0} clientes\n`;
    resposta += `**6. Competitors:** ${context.competidores_count || 0} concorrentes\n`;
    resposta += `**7. 360°:** Score ${context.icp?.score || 0}/100 (${context.icp?.temperatura || 'N/A'})\n`;
    resposta += `**8. Products:** ${context.produtos_count || 0} produtos recomendados (200+ no catálogo)\n`;
    resposta += `**9. Executive:** ${context.executivo?.resumo ? '✅ Resumo disponível' : '❌ Não disponível'}\n`;
    
    resposta += `\n💡 **Dica:** Faça perguntas específicas sobre:\n`;
    resposta += `- "Quem são os decisores?"\n`;
    resposta += `- "Quais produtos TOTVS recomendar?" (200+ no catálogo)\n`;
    resposta += `- "Quais são os concorrentes?"\n`;
    resposta += `- "Quem são os clientes?"\n`;
    resposta += `- "Quais empresas são similares?"\n`;
    resposta += `- "Qual o momento de compra?"\n`;
    resposta += `- "Como abordar esta empresa?"\n`;
    resposta += `- "O que encontraram nas URLs digitais?"\n`;
    resposta += `- "Análise de mercado da empresa"\n`;
    
    return resposta;
  };

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;
    
    const userMessage = userInput.trim();
    setUserInput('');
    
    // Marcar como done para permitir perguntas imediatas
    if (!initialCheckDone) {
      setInitialCheckDone(true);
    }
    
    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    // Salvar mensagem do usuário
    await saveMessage('user', userMessage);
    
    setLoading(true);
    
    // Adicionar mensagem de loading
    setMessages(prev => [...prev, {
      role: 'agent',
      content: '🤔 Analisando...',
      timestamp: new Date()
    }]);
    
    try {
      // ✅ NOVO: Buscar dados já enriquecidos da empresa (9 abas)
      console.log('[STCAgent] 📊 Buscando dados enriquecidos da empresa...', { companyId });
      
      // Buscar empresa e decisores separadamente (Supabase não suporta nested selects assim)
      // Se companyId não existir em companies, pode ser um ID de quarentena - tentar buscar
      let companyData = null;
      let companyError = null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*, raw_data')
        .eq('id', companyId)
        .maybeSingle(); // ✅ maybeSingle ao invés de single (não erro se não encontrar)
      
      if (data) {
        companyData = data;
      } else if (error) {
        console.warn('[STCAgent] ⚠️ Empresa não encontrada em companies, tentando quarentena...', error);
        // Se não encontrar, pode ser que seja um ID de quarentena - buscar via company_id
        const { data: quarantineData } = await supabase
          .from('quarantine_companies')
          .select('*, raw_data')
          .eq('id', companyId)
          .maybeSingle();
        
        if (quarantineData) {
          // Usar dados da quarentena se não tiver company_id
          companyData = {
            id: quarantineData.company_id || quarantineData.id,
            name: quarantineData.razao_social,
            cnpj: quarantineData.cnpj,
            raw_data: quarantineData.raw_data || {}
          };
        } else {
          throw new Error(`Empresa não encontrada (ID: ${companyId})`);
        }
      }
      
      if (!companyData) {
        throw new Error(`Empresa não encontrada (ID: ${companyId})`);
      }
      
      // Buscar decisores separadamente (usar ID da empresa real, não quarentena)
      const realCompanyId = companyData.id || companyData.company_id || companyId;
      console.log('[STCAgent] 🔍 Buscando decisores para company_id:', realCompanyId);
      
      // Buscar decisores (sem order por coluna que pode não existir)
      const { data: decisionMakers, error: decisoresError } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', realCompanyId);
      
      if (decisoresError) {
        console.warn('[STCAgent] ⚠️ Erro ao buscar decisores (continuando sem eles):', decisoresError);
      }
      
      // Adicionar decisores ao companyData
      const enrichedCompanyData = {
        ...companyData,
        decision_makers: decisionMakers || []
      };
      
      // ✅ NOVO: Usar edge function que analisa dados INTERNOS (não busca externa)
      // Esta função usa apenas os dados já enriquecidos das 9 abas!
      console.log('[STCAgent] 📊 Enviando pergunta com dados internos...');
      
      // Buscar dados das 9 abas (mesmo que a edge function precise)
      // realCompanyId já foi definido acima na linha 289
      
      // ✅ Buscar Relatório TOTVS COMPLETO (com análise profunda, descrição, mercado, keywords)
      // Tratar caso a tabela não exista (PGRST205) ou erro de cache
      let totvsCheck: any = null;
      try {
        const { data, error } = await supabase
          .from('simple_totvs_checks')
          .select('*')
          .eq('company_id', realCompanyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error) {
          totvsCheck = data;
        } else if (error.code !== 'PGRST116' && error.code !== 'PGRST205') {
          console.warn('[STCAgent] ⚠️ Erro ao buscar TOTVS check:', error);
        }
      } catch (err) {
        // Tabela não existe ou erro de cache - continuar sem ela
        console.debug('[STCAgent] ℹ️ Tabela simple_totvs_checks não disponível');
      }
      
      // ✅ Buscar Relatório Completo TOTVS (com full_report)
      const { data: totvsReport, error: totvsReportError } = await supabase
        .from('icp_analysis_results')
        .select('full_report')
        .eq('company_id', realCompanyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (totvsReportError && totvsReportError.code !== 'PGRST116') {
        console.warn('[STCAgent] ⚠️ Erro ao buscar TOTVS report:', totvsReportError);
      }
      
      // ✅ Buscar ICP Analysis COMPLETO (com análise de mercado, descrição, keywords)
      const { data: icpData, error: icpError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('company_id', realCompanyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (icpError && icpError.code !== 'PGRST116') {
        console.warn('[STCAgent] ⚠️ Erro ao buscar ICP analysis:', icpError);
      }
      
      // ✅ Buscar Análise Digital COMPLETA (com URLs analisadas profundamente)
      const { data: digitalAnalysis, error: digitalError } = await supabase
        .from('digital_maturity')
        .select('*')
        .eq('company_id', realCompanyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (digitalError && digitalError.code !== 'PGRST116') {
        console.warn('[STCAgent] ⚠️ Erro ao buscar digital analysis:', digitalError);
      }
      
      // ✅ Buscar SIMILAR COMPANIES (Aba Similar)
      let similarCompanies: any[] = [];
      try {
        const { data, error } = await supabase
          .from('similar_companies')
          .select('*')
          .eq('company_id', realCompanyId)
          .order('similarity_score', { ascending: false })
          .limit(20);
        
        if (!error && data) {
          similarCompanies = data;
        } else if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205' && error.code !== '42703') {
          console.warn('[STCAgent] ⚠️ Erro ao buscar similar companies:', error);
        }
      } catch (err) {
        // Tabela não existe ou coluna não existe - continuar sem ela
        console.debug('[STCAgent] ℹ️ Tabela similar_companies não disponível ou estrutura diferente');
      }
      
      // ✅ Buscar COMPETITORS (Aba Competitors)
      // Usar competitor_stc_matches (relaciona empresas com competidores) em vez de competitors (tabela geral)
      let competitors: any[] = [];
      try {
        const { data: competitorMatches, error: competitorsError } = await supabase
          .from('competitor_stc_matches')
          .select('*')
          .eq('company_id', realCompanyId)
          .order('confidence', { ascending: false })
          .limit(20);
        
        if (!competitorsError && competitorMatches) {
          competitors = competitorMatches.map((m: any) => ({
            name: m.competitor_name,
            match_type: m.match_type,
            confidence: m.confidence,
            evidence: m.evidence,
            source_url: m.source_url,
            source_title: m.source_title
          }));
        } else if (competitorsError && competitorsError.code !== 'PGRST116' && competitorsError.code !== 'PGRST205') {
          console.warn('[STCAgent] ⚠️ Erro ao buscar competitors:', competitorsError);
        }
      } catch (err) {
        // Tabela não existe - continuar sem ela
        console.debug('[STCAgent] ℹ️ Tabela competitor_stc_matches não disponível');
      }
      
      // ✅ Buscar CLIENTS (Aba Clients)
      // Tabela 'clients' não existe - usar dados de similar_companies ou raw_data
      let finalClients: any[] = [];
      try {
        // Tentar buscar de similar_companies (pode ter relationship_type no futuro)
        const { data: similarAsClients } = await supabase
          .from('similar_companies')
          .select('*')
          .eq('company_id', realCompanyId)
          .limit(20);
        
        if (similarAsClients && similarAsClients.length > 0) {
          finalClients = similarAsClients;
        }
      } catch (err) {
        // Continuar sem clients se não houver dados
        console.debug('[STCAgent] ℹ️ Dados de clients não disponíveis');
      }
      
      // ✅ Buscar EXECUTIVE SUMMARY (Aba Executive)
      let executiveData: any = null;
      try {
        const { data, error } = await supabase
          .from('executive_summaries')
          .select('*')
          .eq('company_id', realCompanyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error) {
          executiveData = data;
        } else if (error.code !== 'PGRST116' && error.code !== 'PGRST205') {
          console.warn('[STCAgent] ⚠️ Erro ao buscar executive summary:', error);
        }
      } catch (err) {
        // Tabela não existe - continuar sem ela
        console.debug('[STCAgent] ℹ️ Tabela executive_summaries não disponível');
      }
      
      // ✅ Preparar dados ENRIQUECIDOS das 3 abas principais
      const rawData = enrichedCompanyData?.raw_data || {};
      const fullReport = totvsReport?.full_report || icpData?.full_report || {};
      const digitalIntel = rawData?.digital_intelligence || {};
      
      // ✅ Buscar PRODUCT RECOMMENDATIONS (Aba Products) - Mais de 200 produtos no banco!
      // Tabela 'product_recommendations' não existe ainda - usar dados de raw_data/full_report
      let recommendedProducts: any[] = [];
      
      // Extrair análise TOTVS completa (da aba TOTVS) - declarar uma única vez
      const totvsAnalysis = fullReport?.TOTVS || fullReport?.totvs || {};
      
      recommendedProducts = rawData?.totvs_products || totvsAnalysis?.produtos || rawData?.product_recommendations || [];
      
      // Se não encontrou produtos, tentar extrair do TOTVS check
      if (recommendedProducts.length === 0 && totvsCheck?.evidences) {
        const detectedProducts = new Set<string>();
        (totvsCheck.evidences || []).forEach((ev: any) => {
          if (ev.detected_products && Array.isArray(ev.detected_products)) {
            ev.detected_products.forEach((p: string) => detectedProducts.add(p));
          }
        });
        recommendedProducts = Array.from(detectedProducts).map((p: string) => ({ name: p, category: 'TOTVS' }));
      }
      
      // Extrair análise profunda das URLs (da aba Digital)
      const urlsAnalisadas = digitalIntel.urls || rawData?.digital_urls || [];
      const urlsDetalhadas = urlsAnalisadas.map((url: any) => ({
        url: typeof url === 'string' ? url : url.url || url,
        titulo: url.titulo || url.title || '',
        descricao: url.descricao || url.description || '',
        conteudo: url.conteudo || url.content || url.analise || '',
        palavras_chave: url.palavras_chave || url.keywords || [],
        relevancia: url.relevancia || url.relevance || 0,
        tipo: url.tipo || url.type || ''
      }));
      
      // ✅ totvsAnalysis já foi declarado acima - usar diretamente aqui
      const totvsDescription = totvsAnalysis.description || totvsAnalysis.analise_descricao || rawData?.totvs_analise_descricao || '';
      const totvsKeywords = totvsAnalysis.keywords || totvsAnalysis.palavras_chave || rawData?.totvs_keywords || [];
      const totvsMarket = totvsAnalysis.market || totvsAnalysis.mercado || rawData?.totvs_market_analysis || '';
      
      const intelligenceContext = {
        empresa: {
          nome: enrichedCompanyData?.name || companyName,
          cnpj: enrichedCompanyData?.cnpj || cnpj,
          setor: enrichedCompanyData?.industry || rawData?.setor_amigavel || rawData?.atividade_economica,
          porte: enrichedCompanyData?.employees_count || rawData?.porte_estimado,
          website: enrichedCompanyData?.website || rawData?.melhor_site,
          descricao: enrichedCompanyData?.description || rawData?.descricao || totvsDescription,
          mercado: totvsMarket || icpData?.market_analysis || '',
          palavras_chave: totvsKeywords.length > 0 ? totvsKeywords : rawData?.keywords || [],
        },
        decisores: (decisionMakers || []).map((d: any) => ({
          nome: d.name || d.full_name,
          cargo: d.title || d.role,
          email: d.email,
          linkedin: d.linkedin_url,
          telefone: d.phone,
          departamento: d.department,
          seniority: d.seniority || d.seniority_level,
        })),
        totvs: {
          usaTotvs: totvsCheck?.status === 'confirmed',
          confianca: totvsCheck?.confidence_percent || 0,
          produtos: rawData?.totvs_products || totvsAnalysis?.produtos || [],
          // ✅ DADOS COMPLETOS DA ABA TOTVS
          analise_descricao: totvsDescription,
          palavras_chave: totvsKeywords,
          analise_mercado: totvsMarket,
          evidencias: totvsCheck?.evidences || [],
          triple_matches: totvsCheck?.triple_matches || 0,
          double_matches: totvsCheck?.double_matches || 0,
          single_matches: totvsCheck?.single_matches || 0,
          relatorio_completo: fullReport?.TOTVS || {},
        },
        digital: {
          // ✅ URLs ANALISADAS PROFUNDAMENTE (da aba Digital)
          urls: urlsDetalhadas,
          urls_count: urlsDetalhadas.length,
          tecnologias: digitalIntel.tecnologias || rawData?.tecnologias || [],
          redes_sociais: {
            linkedin: digitalIntel.linkedin_url || rawData?.linkedin_url,
            facebook: digitalIntel.facebook || rawData?.facebook,
            instagram: digitalIntel.instagram || rawData?.instagram,
            twitter: digitalIntel.twitter || rawData?.twitter,
          },
          digital_maturity: digitalAnalysis?.maturity_score || 0,
          keywords_seo: digitalIntel.keywords || rawData?.keywords_seo || [],
          analise_completa: digitalAnalysis || digitalIntel.analise_completa || {},
        },
        icp: {
          score: icpData?.icp_score || 0,
          temperatura: icpData?.temperatura,
          pain_points: icpData?.pain_points || rawData?.pain_points || [],
          oportunidades: icpData?.opportunities || rawData?.opportunities || [],
          market_analysis: icpData?.market_analysis || '',
          recomendacoes: icpData?.recomendacoes || [],
        },
        // ✅ ABA PRODUCTS - Produtos Recomendados (200+ produtos no banco)
        produtos: recommendedProducts || rawData?.totvs_products || totvsAnalysis?.produtos || [],
        produtos_count: recommendedProducts?.length || 0,
        
        // ✅ ABA SIMILAR - Empresas Similares
        similar: (similarCompanies || []).map((s: any) => ({
          nome: s.similar_name || s.name,
          score: s.similarity_score || s.score,
          location: s.location,
          employees_min: s.employees_min,
          employees_max: s.employees_max,
          source: s.source,
        })),
        similar_count: similarCompanies?.length || 0,
        
        // ✅ ABA CLIENTS - Clientes da Empresa
        clientes: (finalClients || []).map((c: any) => ({
          nome: c.client_name || c.name || c.similar_name,
          tipo: c.client_type || c.type || c.relationship_type,
          valor: c.deal_value || c.value,
          status: c.status,
          source: c.source,
        })),
        clientes_count: finalClients?.length || 0,
        
        // ✅ ABA COMPETITORS - Concorrentes TOTVS
        competidores: (competitors || []).map((c: any) => ({
          nome: c.name || c.competitor_name,
          categoria: c.category,
          posicao_mercado: c.market_position,
          forcas: c.strengths || [],
          fraquezas: c.weaknesses || [],
          vantagens_totvs: c.totvs_advantages || [],
          relevancia: c.relevance_score || c.score,
        })),
        competidores_count: competitors?.length || 0,
        
        // ✅ ABA EXECUTIVE - Resumo Executivo
        executivo: {
          resumo: executiveData?.summary || executiveData?.resumo || fullReport?.Executive?.summary || '',
          principais_insights: executiveData?.key_insights || executiveData?.insights || [],
          recomendacoes: executiveData?.recommendations || executiveData?.recomendacoes || [],
          score_overall: executiveData?.overall_score || icpData?.icp_score || 0,
        },
        
        // ✅ Incluir full_report completo para análise profunda
        full_report: fullReport || {},
      };
      
      console.log('[STCAgent] 📊 Contexto enriquecido das 9 ABAS:', {
        // Aba 1: TOTVS
        totvs_status: intelligenceContext.totvs.usaTotvs,
        totvs_analise_descricao: !!intelligenceContext.totvs.analise_descricao,
        totvs_keywords: intelligenceContext.totvs.palavras_chave.length,
        totvs_mercado: !!intelligenceContext.totvs.analise_mercado,
        
        // Aba 2: Decisores
        decisores: intelligenceContext.decisores.length,
        
        // Aba 3: Digital
        urls_analisadas: intelligenceContext.digital.urls_count,
        
        // Aba 4: Similar
        similar_count: intelligenceContext.similar_count,
        
        // Aba 5: Clients
        clientes_count: intelligenceContext.clientes_count,
        
        // Aba 6: Competitors
        competidores_count: intelligenceContext.competidores_count,
        
        // Aba 7: 360°
        icp_score: intelligenceContext.icp.score,
        temperatura: intelligenceContext.icp.temperatura,
        
        // Aba 8: Products
        produtos_count: intelligenceContext.produtos_count,
        
        // Aba 9: Executive
        executivo_resumo: !!intelligenceContext.executivo.resumo,
      });
      
      // Tentar usar edge function, se falhar usar fallback no frontend
      let aiResponse = '';
      let metadata: any = {};
      
      try {
        const { data, error } = await supabase.functions.invoke('stc-agent-internal', {
        body: { 
            companyId: realCompanyId,
          companyName, 
          cnpj,
            question: userMessage,
            companyData: enrichedCompanyData || null,
          }
        });
        
        if (!error && data?.success) {
          aiResponse = data.response || 'Resposta não disponível';
          metadata = data.metadata || {};
        } else {
          throw new Error('Edge function não disponível, usando fallback');
        }
      } catch (edgeError) {
        console.warn('[STCAgent] ⚠️ Edge function stc-agent-internal não disponível, usando fallback...', edgeError);
        
        // ✅ FALLBACK: Análise direta usando company-intelligence-chat (já existe e funciona)
        try {
          const { data: fallbackResponse, error: fallbackError } = await supabase.functions.invoke('company-intelligence-chat', {
            body: {
              companyId: realCompanyId,
              question: userMessage,
              companyData: {
                ...enrichedCompanyData,
                // Adicionar contexto das 9 abas já coletadas
                intelligence: intelligenceContext,
                // Passar dados extras para contexto
                decisores: intelligenceContext.decisores,
                totvs: intelligenceContext.totvs,
                digital: intelligenceContext.digital,
                icp: intelligenceContext.icp,
                produtos: intelligenceContext.produtos,
              }
            }
          });
          
          if (fallbackError) {
            throw fallbackError;
          }
          
          // A função company-intelligence-chat retorna { response: string }
          if (!fallbackResponse || !fallbackResponse.response) {
            throw new Error('Resposta vazia do fallback');
          }
          
          aiResponse = fallbackResponse.response;
          metadata = { model: 'gpt-4o-mini', source: 'fallback-company-intelligence-chat' };
          
          console.log('[STCAgent] ✅ Fallback funcionou!', { answerLength: aiResponse.length });
        } catch (fallbackErr: any) {
          console.error('[STCAgent] ❌ Fallback também falhou:', fallbackErr);
          console.warn('[STCAgent] ⚠️ Todas as edge functions falharam, gerando resposta básica com dados coletados...');
          
          // ✅ FALLBACK FINAL: Análise local básica com os dados já coletados (sem IA)
          aiResponse = generateLocalAnalysis(userMessage, intelligenceContext, enrichedCompanyData);
          metadata = { model: 'local', source: 'fallback-local-analysis' };
          
          console.log('[STCAgent] ✅ Análise local gerada!');
        }
      }
      
      // Remover mensagem de loading
      setMessages(prev => prev.slice(0, -1));
      
      // Calcular stats das 9 ABAS
      const stats = {
        // Aba 1: TOTVS
        totvs_status: intelligenceContext.totvs.usaTotvs,
        totvs_confianca: intelligenceContext.totvs.confianca,
        
        // Aba 2: Decisores
        decisores: intelligenceContext.decisores.length,
        
        // Aba 3: Digital
        urlsDigitais: intelligenceContext.digital.urls_count || 0,
        tecnologias: intelligenceContext.digital.tecnologias?.length || 0,
        
        // Aba 4: Similar
        similar_count: intelligenceContext.similar_count || 0,
        
        // Aba 5: Clients
        clientes_count: intelligenceContext.clientes_count || 0,
        
        // Aba 6: Competitors
        competidores_count: intelligenceContext.competidores_count || 0,
        
        // Aba 7: 360°
        icp_score: intelligenceContext.icp.score || 0,
        temperatura: intelligenceContext.icp.temperatura,
        
        // Aba 8: Products
        produtosTotvs: intelligenceContext.produtos_count || 0,
        
        // Aba 9: Executive
        executivo_disponivel: !!intelligenceContext.executivo.resumo
      };
      
      // Adicionar resposta do agente
      setMessages(prev => [...prev, {
        role: 'agent',
        content: aiResponse,
        data: {
          answer: aiResponse,
          intelligence: intelligenceContext,
          stats: stats,
          ...intelligenceContext // Incluir decisores, notícias, tecnologias, etc.
        },
        timestamp: new Date()
      }]);
      
      // Salvar resposta do agente
      await saveMessage('agent', aiResponse, { intelligence: intelligenceContext, stats }, metadata);
    } catch (err: any) {
      // Remover mensagem de loading
      setMessages(prev => prev.slice(0, -1));
      
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `❌ **Erro:** ${err.message}\n\nTente reformular a pergunta.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setUserInput(question);
  };

  const renderAgentMessage = (msg: Message) => {
    const { data } = msg;
    
    return (
      <div className="space-y-4">
        {/* Texto principal */}
        <div className="prose prose-sm max-w-none">
          {msg.content.split('\n').map((line, i) => {
            if (line.startsWith('##')) {
              return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('##', '').trim()}</h3>;
            } else if (line.startsWith('###')) {
              return <h4 key={i} className="text-base font-semibold mt-3 mb-1">{line.replace('###', '').trim()}</h4>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-semibold">{line.replace(/\*\*/g, '')}</p>;
            } else if (line.trim()) {
              return <p key={i} className="text-sm">{line}</p>;
            }
            return null;
          })}
        </div>
        
        {/* Evidências */}
        {data?.evidences && data.evidences.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">📄 Evidências ({data.evidences.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.evidences.slice(0, 5).map((ev: any, i: number) => (
                <div key={i} className="bg-background border rounded p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <Badge variant={ev.matchType === 'triple' ? 'default' : 'secondary'} className="text-xs">
                      {ev.matchType === 'triple' ? '🎯 TRIPLE' : '🔍 DOUBLE'}
                    </Badge>
                    <span className="text-muted-foreground">Tier {ev.tier}</span>
                  </div>
                  <p className="font-medium">{ev.title}</p>
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline flex items-center gap-1 mt-1">
                      Ver fonte <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Decisores */}
        {data?.decisionMakers && data.decisionMakers.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Decisores Identificados
            </h4>
            <div className="space-y-2">
              {data.decisionMakers.map((dm: any, i: number) => (
                <div key={i} className="bg-background border rounded p-2 text-sm">
                  <p className="font-medium">{dm.name}</p>
                  <p className="text-xs text-muted-foreground">{dm.role}</p>
                  {dm.linkedin && (
                    <a href={dm.linkedin} target="_blank" rel="noopener noreferrer"
                       className="text-primary text-xs hover:underline flex items-center gap-1 mt-1">
                      LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sinais de Compra */}
        {data?.buyingSignals && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sinais de Compra
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Score:</span>
                <Badge variant={data.buyingSignals.score >= 70 ? 'default' : 'secondary'}>
                  {data.buyingSignals.score}/100
                </Badge>
              </div>
              {data.buyingSignals.timing && (
                <div>
                  <span className="text-sm font-medium">Timing:</span>
                  <p className="text-sm text-muted-foreground">{data.buyingSignals.timing}</p>
                </div>
              )}
              {data.buyingSignals.signals && data.buyingSignals.signals.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Sinais:</span>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {data.buyingSignals.signals.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Produtos Recomendados */}
        {data?.recommendedProducts && data.recommendedProducts.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Produtos TOTVS Recomendados
            </h4>
            <div className="space-y-2">
              {data.recommendedProducts.map((prod: any, i: number) => (
                <div key={i} className="bg-background border rounded p-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{prod.product}</span>
                    <Badge variant="outline">{prod.fit}% fit</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{prod.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Estratégia de Abordagem */}
        {data?.approachStrategy && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Estratégia de Abordagem
            </h4>
            <div className="space-y-2 text-sm">
              {data.approachStrategy.channel && (
                <div>
                  <span className="font-medium">Canal:</span> {data.approachStrategy.channel}
                </div>
              )}
              {data.approachStrategy.timing && (
                <div>
                  <span className="font-medium">Timing:</span> {data.approachStrategy.timing}
                </div>
              )}
              {data.approachStrategy.pain && (
                <div>
                  <span className="font-medium">Dor Identificada:</span>
                  <p className="text-muted-foreground">{data.approachStrategy.pain}</p>
                </div>
              )}
              {data.approachStrategy.message && (
                <div>
                  <span className="font-medium">Mensagem Sugerida:</span>
                  <p className="text-muted-foreground italic bg-background p-2 rounded border mt-1">
                    "{data.approachStrategy.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Insights */}
        {data?.insights && data.insights.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Insights
            </h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              {data.insights.map((insight: string, i: number) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Perguntas Sugeridas */}
        {data?.suggestedQuestions && data.suggestedQuestions.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">💬 Perguntas Sugeridas</h4>
            <div className="flex flex-wrap gap-2">
              {data.suggestedQuestions.map((q: string, i: number) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {data?.nextQuestions && data.nextQuestions.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">🔮 Próximas Perguntas</h4>
            <div className="flex flex-wrap gap-2">
              {data.nextQuestions.map((q: string, i: number) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Button 
        onClick={() => { 
          console.log('[STCAgent] Abrindo dialog...');
          setOpen(true); 
          // Permitir input imediatamente
          setInitialCheckDone(true);
          console.log('[STCAgent] Dialog aberto, initialCheckDone:', true);
        }}
        variant="outline"
        size="sm"
        className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all group"
      >
        <Bot className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-medium leading-tight">STC</span>
      </Button>

      <Dialog open={open} onOpenChange={(newOpen) => {
        console.log('[STCAgent] Dialog onOpenChange:', newOpen);
        setOpen(newOpen);
      }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col min-h-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  STC Agent
                  <Badge variant="outline" className="text-xs">GPT-4O-MINI</Badge>
                </div>
                <DialogDescription className="text-xs">
                  Sales & TOTVS Checker Agent
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Header da Empresa */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-3 rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{companyName}</h3>
                {cnpj && <p className="text-xs text-muted-foreground">CNPJ: {cnpj}</p>}
              </div>
              {costInfo && (
                <div className="text-right text-xs text-muted-foreground">
                  <p>Tokens: {costInfo.tokens.total_tokens}</p>
                  <p>Custo: ${costInfo.cost}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mensagens */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 pr-4 [&_[data-radix-scroll-area-viewport]]:overflow-y-auto">
            <div className="space-y-4">
              {loadingHistory && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      renderAgentMessage(msg)
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              
              {/* Referência para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input - SEMPRE DISPONÍVEL */}
          <div className="flex gap-2 pt-4 border-t">
            <input
              ref={inputRef}
              type="text"
              placeholder="Faça uma pergunta sobre a empresa..."
              value={userInput}
              onChange={(e) => {
                console.log('[STCAgent] Input onChange:', e.target.value, 'disabled:', loading);
                if (!loading) {
                  setUserInput(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                console.log('[STCAgent] KeyDown:', e.key, 'value:', e.currentTarget.value, 'disabled:', loading);
                if (e.key === 'Enter' && !e.shiftKey && !loading && userInput.trim()) {
                  e.preventDefault();
                  console.log('[STCAgent] Enter pressionado, enviando mensagem...');
                  sendMessage();
                }
              }}
              onFocus={(e) => {
                console.log('[STCAgent] ✅ Input focado e pronto para digitar!');
              }}
              onBlur={(e) => {
                console.log('[STCAgent] Input perdeu foco');
              }}
              disabled={loading}
              readOnly={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ 
                pointerEvents: loading ? 'none' : 'auto',
                cursor: loading ? 'not-allowed' : 'text',
              }}
              autoComplete="off"
            />
            <Button
              onClick={sendMessage}
              size="icon"
              disabled={loading || !userInput.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
              <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Sugestões rápidas - Mostrar sempre que houver espaço, não apenas após check inicial */}
          {!loadingHistory && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Quem são os decisores?')}
                disabled={loading}
              >
                <Users className="w-3 h-3 mr-1" />
                Decisores
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Qual o momento de compra?')}
                disabled={loading}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Momento de Compra
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Que produtos TOTVS recomendar?')}
                disabled={loading}
              >
                <Target className="w-3 h-3 mr-1" />
                Produtos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion('Como abordar esta empresa?')}
                disabled={loading}
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Estratégia
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
