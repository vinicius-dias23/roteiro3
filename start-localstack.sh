#!/bin/bash

# Script para iniciar o LocalStack com as configurações corretas para Lambda

echo "🚀 Iniciando LocalStack com suporte a Lambda..."

# Parar e remover container existente se houver
EXISTING=$(docker ps -a | grep localstack | awk '{print $1}')
if [ ! -z "$EXISTING" ]; then
  echo "Parando container LocalStack existente..."
  docker stop $EXISTING 2>/dev/null
  docker rm $EXISTING 2>/dev/null
fi

# Iniciar LocalStack com acesso ao Docker socket
# Isso permite que o LocalStack execute funções Lambda
# LAMBDA_EXECUTOR=docker-reuse evita o uso de ECR
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -p 4571:4571 \
  -e SERVICES=lambda,dynamodb,sns,apigateway,cloudformation,logs,iam \
  -e DEBUG=1 \
  -e LAMBDA_EXECUTOR=docker-reuse \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack

echo "✅ LocalStack iniciado!"
echo ""
echo "Aguardando LocalStack ficar pronto..."
sleep 5

# Verificar se está saudável
echo "Verificando saúde do LocalStack..."
HEALTH=$(curl -s http://localhost:4566/_localstack/health)

if echo "$HEALTH" | grep -q "lambda"; then
  echo "✅ LocalStack está pronto!"
else
  echo "⚠️  LocalStack pode ainda estar inicializando. Aguarde alguns segundos."
fi

echo ""
echo "Agora você pode executar: npm run deploy"

