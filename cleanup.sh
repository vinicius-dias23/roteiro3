#!/bin/bash

# Script para limpar o estado do LocalStack e remover o stack

echo "🧹 Limpando estado do projeto..."

# Cores
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 1. Remover o stack do Serverless
echo -e "${YELLOW}1. Removendo stack do Serverless Framework...${NC}"
serverless remove --stage local 2>/dev/null || echo "Nenhum stack encontrado ou já foi removido."

# 2. Verificar se o LocalStack está rodando
echo -e "${YELLOW}2. Verificando LocalStack...${NC}"
LOCALSTACK_CONTAINER=$(docker ps -a | grep localstack | awk '{print $1}')

if [ -z "$LOCALSTACK_CONTAINER" ]; then
  echo "LocalStack não está rodando."
else
  echo "LocalStack encontrado: $LOCALSTACK_CONTAINER"
  
  # Perguntar se deseja reiniciar o LocalStack
  read -p "Deseja reiniciar o LocalStack? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}3. Parando LocalStack...${NC}"
    docker stop $LOCALSTACK_CONTAINER 2>/dev/null
    
    echo -e "${YELLOW}4. Removendo container do LocalStack...${NC}"
    docker rm $LOCALSTACK_CONTAINER 2>/dev/null
    
    echo -e "${YELLOW}5. Iniciando LocalStack novamente...${NC}"
    docker run -d -p 4566:4566 -p 4571:4571 --name localstack localstack/localstack
    
    echo -e "${GREEN}✅ LocalStack reiniciado!${NC}"
    echo "Aguarde alguns segundos antes de fazer o deploy."
  fi
fi

echo ""
echo -e "${GREEN}✅ Limpeza concluída!${NC}"
echo ""
echo "Agora você pode executar: npm run deploy"

