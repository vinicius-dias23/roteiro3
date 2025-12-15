#!/bin/bash

# Script de teste para a API CRUD Serverless
# Uso: ./test-api.sh <base-url>
# Exemplo: ./test-api.sh http://localhost:4566/restapis/abc123/local/_user_request_

BASE_URL=${1:-"http://localhost:4566/restapis/abc123/local/_user_request_"}

echo "🧪 Testando API CRUD Serverless"
echo "Base URL: $BASE_URL"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Criar um item
echo -e "${BLUE}1. Criando um novo item...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/items" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste",
    "description": "Descrição do produto de teste",
    "price": 99.99
  }')

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Extrair o ID do item criado
ITEM_ID=$(echo "$CREATE_RESPONSE" | jq -r '.item.id' 2>/dev/null)

if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
  echo -e "${YELLOW}⚠️  Não foi possível extrair o ID do item. Continuando com testes manuais...${NC}"
  echo ""
  echo "Para testar manualmente, use:"
  echo "  GET    $BASE_URL/items"
  echo "  GET    $BASE_URL/items/{id}"
  echo "  PUT    $BASE_URL/items/{id}"
  echo "  DELETE $BASE_URL/items/{id}"
  exit 0
fi

echo -e "${GREEN}✅ Item criado com ID: $ITEM_ID${NC}"
echo ""

# 2. Listar todos os itens
echo -e "${BLUE}2. Listando todos os itens...${NC}"
LIST_RESPONSE=$(curl -s "$BASE_URL/items")
echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

# 3. Buscar item por ID
echo -e "${BLUE}3. Buscando item por ID: $ITEM_ID...${NC}"
GET_RESPONSE=$(curl -s "$BASE_URL/items/$ITEM_ID")
echo "$GET_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_RESPONSE"
echo ""

# 4. Atualizar item
echo -e "${BLUE}4. Atualizando item: $ITEM_ID...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/items/$ITEM_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste Atualizado",
    "price": 149.99
  }')

echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
echo ""

# 5. Verificar atualização
echo -e "${BLUE}5. Verificando item atualizado...${NC}"
GET_UPDATED_RESPONSE=$(curl -s "$BASE_URL/items/$ITEM_ID")
echo "$GET_UPDATED_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_UPDATED_RESPONSE"
echo ""

# 6. Deletar item
echo -e "${BLUE}6. Removendo item: $ITEM_ID...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/items/$ITEM_ID")
echo "$DELETE_RESPONSE" | jq '.' 2>/dev/null || echo "$DELETE_RESPONSE"
echo ""

# 7. Verificar que foi removido
echo -e "${BLUE}7. Verificando que o item foi removido...${NC}"
GET_DELETED_RESPONSE=$(curl -s "$BASE_URL/items/$ITEM_ID")
echo "$GET_DELETED_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_DELETED_RESPONSE"
echo ""

echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "📝 Nota: Verifique os logs do Lambda subscriber para confirmar que as notificações SNS foram recebidas."

