#!/bin/bash

# Script para fazer deploy do stage do API Gateway no LocalStack
# Este script deve ser executado após o deploy do Serverless Framework

echo "🔧 Fazendo deploy do stage do API Gateway..."

# Obter o API ID do output do serverless info
API_ID=$(serverless info --stage local 2>&1 | grep -o 'restapis/[^/]*' | head -1 | sed 's|restapis/||')

if [ -z "$API_ID" ]; then
  echo "❌ Não foi possível obter o API ID. Verifique se o deploy foi concluído."
  exit 1
fi

echo "API ID encontrado: $API_ID"

# Fazer deploy do stage usando a API do LocalStack
STAGE_NAME="local"
DEPLOYMENT_ID=$(date +%s)

echo "Criando deployment..."

# Criar deployment usando a API do LocalStack
echo "Criando deployment do stage '$STAGE_NAME'..."

# Primeiro, verificar se a API existe
API_CHECK=$(curl -s "http://localhost:4566/restapis/$API_ID" 2>&1)
if echo "$API_CHECK" | grep -q "id"; then
  echo "✅ API encontrada: $API_ID"
else
  echo "⚠️  API não encontrada. Tentando criar deployment mesmo assim..."
fi

# Criar deployment
DEPLOYMENT_RESPONSE=$(curl -s -X POST \
  "http://localhost:4566/restapis/$API_ID/deployments" \
  -H "Content-Type: application/json" \
  -d "{
    \"stageName\": \"$STAGE_NAME\",
    \"description\": \"Deployment for $STAGE_NAME stage\"
  }" 2>&1)

echo "Resposta do deployment: $DEPLOYMENT_RESPONSE"

# Aguardar um pouco para o deployment ser processado
sleep 2

# Testar a API
echo ""
echo "🧪 Testando a API..."
TEST_RESPONSE=$(curl -s -X GET "http://localhost:4566/_aws/execute-api/$API_ID/$STAGE_NAME/items" 2>&1)

if echo "$TEST_RESPONSE" | grep -q "items\|count\|message"; then
  echo "✅ API está funcionando!"
  echo "$TEST_RESPONSE" | head -3
else
  echo "⚠️  API pode não estar totalmente funcional ainda."
  echo "Resposta: $TEST_RESPONSE"
  echo ""
  echo "Tente novamente em alguns segundos ou use:"
  echo "  curl http://localhost:4566/_aws/execute-api/$API_ID/$STAGE_NAME/items"
fi

echo ""
echo "📝 Endpoints disponíveis:"
echo "  GET    http://localhost:4566/_aws/execute-api/$API_ID/$STAGE_NAME/items"
echo "  POST   http://localhost:4566/_aws/execute-api/$API_ID/$STAGE_NAME/items"
echo "  GET    http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/items"

