#!/bin/bash
# 🧹 Script de limpeza rápida do banco de dados

echo "🧹 ========================================"
echo "🧹 LIMPEZA DE RELATÓRIOS TOTVS"
echo "🧹 ========================================"
echo ""
echo "⚠️  Este script vai limpar:"
echo "   - Histórico de relatórios antigos"
echo "   - Cache de verificações TOTVS"
echo "   - Status das empresas em quarentena"
echo ""
echo "✅ Será preservado:"
echo "   - Suas 40 empresas"
echo "   - Usuários e configurações"
echo ""
read -p "Continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo "❌ Limpeza cancelada!"
    exit 1
fi

echo ""
echo "🔥 Executando limpeza via Supabase CLI..."
echo ""

# Executar SQL via supabase CLI
supabase db execute --file scripts/cleanup-stc-reports.sql

echo ""
echo "✅ LIMPEZA CONCLUÍDA!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Abrir Chrome → F12 → Console"
echo "2. Executar: localStorage.clear(); location.reload();"
echo "3. Testar verificação em UMA empresa"
echo "4. Salvar relatório"
echo "5. Carregar do histórico"
echo ""
echo "🚀 Tudo deve funcionar agora!"
echo ""

