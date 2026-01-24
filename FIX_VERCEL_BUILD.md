# 🔧 Correções para Build Vercel (MC-2.5)

## Problema
Após commit do MC-2.5, a versão no Vercel apresentou erros 404 para arquivos JavaScript:
- `useICPLibrary-BQyFW64C.js`
- `BulkUploadDialog-BaOM5vqQ.js`
- `InlineCompanySearch-B4cyaBKg.js`
- `LocationMap-CbdD_I1k.js`
- `QualificationEnginePage-D1e__GUv.js`
- `leaflet-DSGLOcP_.js`
- E outros...

## Causa Raiz
1. **Cache do Vercel/CDN**: Arquivos com hashes antigos sendo referenciados
2. **Build inconsistente**: Chunking automático do Vite gerando hashes diferentes
3. **Configuração de headers**: Cache muito agressivo para assets

## Correções Aplicadas

### 1. `vite.config.ts`
- ✅ Configurado `entryFileNames`, `chunkFileNames` e `assetFileNames` com hashes consistentes
- ✅ Desabilitado sourcemaps em produção
- ✅ Mantido chunking automático do Vite (mais confiável)

### 2. `vercel.json`
- ✅ Adicionado header de cache para `/assets/(.*)` com `immutable`
- ✅ Corrigido array `headers` duplicado
- ✅ Mantido rewrite para SPA

## Próximos Passos

1. **Fazer commit e push**:
   ```bash
   git add vite.config.ts vercel.json
   git commit -m "fix(vercel): corrige build e cache de assets para evitar 404"
   git push
   ```

2. **Limpar cache do Vercel**:
   - No dashboard do Vercel, ir em Settings → Data Cache
   - Limpar cache ou fazer redeploy forçado

3. **Verificar build local**:
   ```bash
   npm run build
   npm run preview
   ```

4. **Testar no Vercel**:
   - Aguardar deploy automático
   - Limpar cache do navegador (Ctrl+Shift+R)
   - Verificar se os arquivos JS carregam corretamente

## Notas
- Os erros de `postMessage` do Lusha são da extensão do navegador, não do código
- O erro `tenant-onboarding:1` pode ser cache do navegador, limpar e testar novamente
- Se persistir, verificar logs do build no Vercel para erros de compilação
