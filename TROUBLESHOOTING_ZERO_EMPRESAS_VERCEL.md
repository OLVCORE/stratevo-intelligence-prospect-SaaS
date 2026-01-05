# 🔍 Troubleshooting: "Zero Empresas Localizadas" no Vercel

## 📋 Problema

A busca avançada está retornando "zero empresas localizadas" no Vercel, apesar de funcionar localmente.

## 🔍 Diagnóstico

### 1. Erro 406 (Not Acceptable) ao buscar classificações CNAE

**Sintoma:**
- Console mostra: `406 (Not Acceptable)` ao tentar buscar classificações CNAE do Supabase
- Avisos: `[Step3] ⚠️ CNAE não encontrado no mapa`

**Causas possíveis:**
1. **Tabela `cnae_classifications` não existe no Supabase de produção**
2. **Tabela não está populada com dados**
3. **Problema de RLS (Row Level Security) bloqueando acesso**
4. **API key do Supabase incorreta ou expirada no Vercel**

**Solução:**
1. Verificar se a tabela existe:
   ```sql
   SELECT COUNT(*) FROM public.cnae_classifications;
   ```
2. Se não existir, executar as migrations:
   ```bash
   supabase db push
   ```
3. Verificar RLS:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'cnae_classifications';
   ```
   Deve haver uma política `cnae_classifications_select_all` permitindo SELECT para todos.

4. Verificar variáveis de ambiente no Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Certificar-se de que estão configuradas para **Production**, **Preview** e **Development**

### 2. API EmpresaQui não retornando resultados

**Sintoma:**
- Edge Function retorna `candidates_collected: 0`
- Logs mostram: `⚠️ NENHUMA candidata encontrada no EmpresaQui!`

**Causas possíveis:**
1. **API key do EmpresaQui não configurada no Supabase Secrets**
2. **API key incorreta ou expirada**
3. **Filtros muito restritivos (CNAE/localização não encontrados)**

**Solução:**
1. Verificar se o secret existe no Supabase:
   ```bash
   supabase secrets list
   ```
   Deve haver `EMPRESASAQUI_API_KEY` ou `EMPRESAQUI_API_KEY`

2. Verificar logs do Edge Function:
   - Acesse: Supabase Dashboard → Edge Functions → `prospeccao-avancada-buscar` → Logs
   - Procure por: `⚠️ EMPRESASAQUI_API_KEY não configurada`

3. Testar API diretamente:
   ```bash
   curl -H "Authorization: Bearer SUA_API_KEY" \
     "https://api.empresaqui.com.br/v1/empresas/busca?cnae=6201&situacao=ATIVA&limit=5"
   ```

### 3. Validação muito restritiva removendo todas as empresas

**Sintoma:**
- `candidates_collected > 0` mas `candidates_after_filter = 0`
- Logs mostram: `✅ Candidatas validadas: 0`

**Causas possíveis:**
1. **CNPJs inválidos ou mal formatados**
2. **Razão social muito curta ou ausente**
3. **Situação cadastral diferente de "ATIVA"**

**Solução:**
1. Verificar logs do Edge Function para ver quantas empresas foram descartadas e por quê
2. Ajustar validação se necessário (mas manter segurança)

## ✅ Correções Implementadas

### 1. Serviço de Classificação CNAE (`cnaeClassificationService.ts`)

**Mudanças:**
- ✅ Substituído `.single()` por `.maybeSingle()` para evitar erro 406 quando não há resultado
- ✅ Adicionado tratamento específico para erro 406/PGRST116
- ✅ Melhorado logging para diagnóstico

**Resultado:**
- Erros 406 não bloqueiam mais a busca de empresas
- Classificações CNAE são opcionais (não obrigatórias)

### 2. Tratamento de Erros

**Mudanças:**
- ✅ Erros ao buscar classificações CNAE são tratados silenciosamente
- ✅ Busca de empresas continua mesmo se classificações falharem
- ✅ Logs detalhados para diagnóstico

## 🔧 Próximos Passos

1. **Verificar Supabase de Produção:**
   - Executar migrations se necessário
   - Verificar se tabela `cnae_classifications` está populada

2. **Verificar Vercel Environment Variables:**
   - Confirmar que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
   - Verificar que estão aplicadas a **todas** as environments (Production, Preview, Development)

3. **Verificar Supabase Secrets:**
   - Confirmar que `EMPRESASAQUI_API_KEY` está configurada
   - Testar API key diretamente

4. **Monitorar Logs:**
   - Verificar logs do Edge Function no Supabase Dashboard
   - Verificar console do navegador no Vercel

## 📝 Notas

- **Classificações CNAE são opcionais:** A busca de empresas funciona mesmo se as classificações CNAE falharem
- **Erro 406 não é crítico:** O serviço agora trata esse erro graciosamente
- **Foco na busca de empresas:** O problema principal é garantir que a API EmpresaQui esteja funcionando

