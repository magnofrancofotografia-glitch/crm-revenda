#!/bin/bash
echo "🔍 Verificando BLING_API..."
if grep -q "api.bling.com.br" index.html; then
  echo "⚠️  Corrigindo URL da API..."
  sed -i '' "s|const BLING_API = 'https://api.bling.com.br/Api/v3';|const BLING_API = '/api/bling?path=';|g" index.html
fi
echo "✅ BLING_API: $(grep 'BLING_API' index.html)"
git add .
git commit -m "atualização $(date '+%d/%m/%Y %H:%M')"
git push
echo "🚀 Deploy feito!"
