# CRUD Serverless com Notificações SNS

Este projeto implementa uma aplicação CRUD completa utilizando arquitetura serverless com **Serverless Framework** e **LocalStack**, integrando notificações via **Amazon SNS**.

## 📋 Descrição

Sistema CRUD completo com as seguintes características:

- ✅ API REST com operações CRUD para gerenciamento de itens
- ✅ Funções Lambda para cada operação (Create, Read, Update, Delete)
- ✅ Persistência de dados utilizando DynamoDB
- ✅ Notificação via SNS quando um item é criado ou atualizado
- ✅ Subscriber Lambda que recebe e processa as notificações SNS
- ✅ Ambiente local simulado com LocalStack

## 🛠️ Stack Tecnológica

| Tecnologia | Descrição |
|-----------|-----------|
| Serverless Framework | Framework para deploy de aplicações serverless |
| LocalStack | Emulador local dos serviços AWS |
| AWS Lambda | Funções serverless para lógica de negócio |
| API Gateway | Exposição dos endpoints REST |
| DynamoDB | Banco de dados NoSQL para persistência |
| Amazon SNS | Serviço de notificações em tópico |
| Node.js 18.x | Runtime das funções Lambda |

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18.x ou superior)
- **npm** ou **yarn**
- **Docker** (necessário para o LocalStack)
- **Serverless Framework** (será instalado como dependência do projeto)

## 🚀 Instalação

1. **Clone o repositório ou navegue até o diretório do projeto**

```bash
cd roteiro3
```

2. **Instale as dependências**

```bash
npm install
```

3. **Instale o Serverless Framework globalmente (opcional, mas recomendado)**

```bash
npm install -g serverless
```

4. **Certifique-se de que o Docker está rodando**

O LocalStack precisa do Docker para funcionar. Verifique se o Docker está instalado e em execução:

```bash
docker --version
```

## 🏃 Executando o Projeto

### 1. Iniciar o LocalStack

O LocalStack será iniciado automaticamente quando você fizer o deploy, mas você também pode iniciá-lo manualmente:

```bash
docker run -d -p 4566:4566 -p 4571:4571 localstack/localstack
```

### 2. Iniciar o LocalStack (se não estiver rodando)

O LocalStack precisa estar rodando antes do deploy. Se não estiver, inicie-o com:

```bash
docker run -d -p 4566:4566 -p 4571:4571 \
  -e SERVICES=lambda,dynamodb,sns,apigateway,cloudformation,logs,iam \
  -e LAMBDA_EXECUTOR=docker-reuse \
  -e LAMBDA_RUNTIME_ENVIRONMENT_TIMEOUT=180 \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack \
  localstack/localstack
```

### 3. Fazer o Deploy

Execute o deploy da aplicação no ambiente local:

```bash
npm run deploy
```

Este comando irá:
- Criar a tabela DynamoDB
- Criar o tópico SNS
- Configurar as funções Lambda
- Configurar o API Gateway
- Fazer o deploy do stage do API Gateway no LocalStack
- Configurar a subscription do SNS para o Lambda subscriber

**Nota:** O script `deploy-api-gateway.sh` é executado automaticamente após o deploy para criar o stage do API Gateway no LocalStack.

### 4. Obter a URL da API

Após o deploy, você verá a URL base da API no output. O LocalStack API Gateway oferece dois formatos de URL:

**Formato 1 (recomendado):**
```
http://localhost:4566/_aws/execute-api/{api-id}/local/items
```

**Formato 2 (alternativo):**
```
http://localhost:4566/restapis/{api-id}/local/_user_request_/items
```

O script `deploy-api-gateway.sh` exibirá o API ID e os endpoints disponíveis após o deploy.

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/items` | Criar novo item + notificação SNS |
| GET | `/items` | Listar todos os itens |
| GET | `/items/{id}` | Buscar item por ID |
| PUT | `/items/{id}` | Atualizar item existente |
| DELETE | `/items/{id}` | Remover item |

### Exemplos de Uso

#### Criar um item (POST /items)

**Primeiro, obtenha o API ID:**
```bash
serverless info --stage local | grep endpoint
```

**Ou use o formato direto do LocalStack:**
```bash
API_ID=$(serverless info --stage local 2>&1 | grep -o 'restapis/[^/]*' | head -1 | sed 's|restapis/||')
curl -X POST "http://localhost:4566/_aws/execute-api/$API_ID/local/items" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Exemplo",
    "description": "Descrição do produto",
    "price": 99.99
  }'
```

**Nota:** A primeira chamada pode demorar alguns segundos devido ao cold start do Lambda no LocalStack.

**Resposta:**
```json
{
  "message": "Item criado com sucesso",
  "item": {
    "id": "uuid-gerado",
    "name": "Produto Exemplo",
    "description": "Descrição do produto",
    "price": 99.99,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Listar todos os itens (GET /items)

```bash
curl http://localhost:4566/restapis/{api-id}/local/_user_request_/items
```

#### Buscar item por ID (GET /items/{id})

```bash
curl http://localhost:4566/restapis/{api-id}/local/_user_request_/items/{item-id}
```

#### Atualizar item (PUT /items/{id})

```bash
curl -X PUT http://localhost:4566/restapis/{api-id}/local/_user_request_/items/{item-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Atualizado",
    "price": 149.99
  }'
```

#### Remover item (DELETE /items/{id})

```bash
curl -X DELETE http://localhost:4566/restapis/{api-id}/local/_user_request_/items/{item-id}
```

## 🔔 Notificações SNS

O sistema envia notificações SNS nos seguintes eventos:

1. **ITEM_CREATED**: Quando um novo item é criado via POST /items
2. **ITEM_UPDATED**: Quando um item é atualizado via PUT /items/{id}

O subscriber Lambda (`snsSubscriber`) é automaticamente invocado quando uma mensagem é publicada no tópico SNS. Os logs das notificações podem ser visualizados nos logs do Lambda.

### Visualizando os Logs do Subscriber

Para ver os logs do subscriber processando as notificações:

```bash
# Listar as funções Lambda
aws --endpoint-url=http://localhost:4566 lambda list-functions

# Ver logs (se configurado)
# Os logs aparecerão no console quando o subscriber for invocado
```

## 🧪 Testando a Aplicação

### Teste Completo do Fluxo

**Primeiro, obtenha o API ID:**
```bash
API_ID=$(serverless info --stage local 2>&1 | grep -o 'restapis/[^/]*' | head -1 | sed 's|restapis/||')
echo "API ID: $API_ID"
```

1. **Criar um item:**
```bash
curl -X POST "http://localhost:4566/_aws/execute-api/$API_ID/local/items" \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "description": "Item de teste", "price": 50}'
```

**Nota:** A primeira chamada pode demorar alguns segundos devido ao cold start do Lambda.

2. **Listar todos os itens:**
```bash
curl "http://localhost:4566/_aws/execute-api/$API_ID/local/items"
```

3. **Buscar um item por ID:**
```bash
# Substitua {item-id} pelo ID retornado na criação
curl "http://localhost:4566/_aws/execute-api/$API_ID/local/items/{item-id}"
```

4. **Atualizar o item:**
```bash
curl -X PUT "http://localhost:4566/_aws/execute-api/$API_ID/local/items/{item-id}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste Atualizado", "price": 75}'
```

5. **Remover o item:**
```bash
curl -X DELETE "http://localhost:4566/_aws/execute-api/$API_ID/local/items/{item-id}"
```

6. **Verificar logs do subscriber:**
Os logs do subscriber aparecerão automaticamente quando as notificações SNS forem processadas. Você pode verificar os logs do LocalStack:

```bash
docker logs localstack | grep -i "sns\|subscriber"
```

### Script de Teste Automatizado

Você também pode usar o script `test-api.sh` para testar todos os endpoints:

```bash
./test-api.sh
```

**Nota:** O script `test-api.sh` pode precisar ser ajustado para usar o formato correto do LocalStack API Gateway.

## 📁 Estrutura do Projeto

```
roteiro3/
├── src/
│   └── handlers/
│       ├── createItem.js      # Lambda para criar item
│       ├── listItems.js       # Lambda para listar itens
│       ├── getItem.js         # Lambda para buscar item por ID
│       ├── updateItem.js      # Lambda para atualizar item
│       ├── deleteItem.js      # Lambda para remover item
│       └── snsSubscriber.js   # Lambda subscriber para SNS
├── serverless.yml             # Configuração do Serverless Framework
├── package.json               # Dependências do projeto
└── README.md                  # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente

As variáveis de ambiente são configuradas automaticamente no `serverless.yml`:

- `STAGE`: Ambiente de execução (local, dev, prod)
- `ITEMS_TABLE`: Nome da tabela DynamoDB
- `SNS_TOPIC_ARN`: ARN do tópico SNS

### Permissões IAM

O projeto configura automaticamente as permissões necessárias:

- DynamoDB: PutItem, GetItem, UpdateItem, DeleteItem, Scan, Query
- SNS: Publish

## 🚨 Considerações Importantes

### Cold Start do Lambda no LocalStack

O LocalStack usa containers Docker para executar as funções Lambda. A primeira chamada a cada função pode demorar alguns segundos (até 1-2 minutos em alguns casos) devido ao cold start. Isso é normal e esperado. Chamadas subsequentes serão muito mais rápidas.

### API Gateway do LocalStack

O projeto está configurado para usar o API Gateway do LocalStack. Após o deploy, o script `deploy-api-gateway.sh` é executado automaticamente para criar o stage do API Gateway. 

**Formato de URL recomendado:**
```
http://localhost:4566/_aws/execute-api/{api-id}/local/{path}
```

**Timeout do Lambda:**
O LocalStack está configurado com `LAMBDA_RUNTIME_ENVIRONMENT_TIMEOUT=180` segundos para evitar timeouts durante o cold start.

## 🧹 Limpeza

Para remover todos os recursos criados:

```bash
npm run remove
```

Ou:

```bash
serverless remove --stage local
```

**Nota:** Se você iniciou o LocalStack manualmente, você pode parar e remover o container:

```bash
docker stop localstack
docker rm localstack
```

## 📝 Validações Implementadas

### Criação de Item (POST)
- ✅ Campo `name` é obrigatório e deve ser string não vazia
- ✅ Campo `description` é opcional, mas se fornecido deve ser string
- ✅ Campo `price` é opcional, mas se fornecido deve ser número não negativo

### Atualização de Item (PUT)
- ✅ Todos os campos são opcionais
- ✅ Validações aplicadas apenas aos campos fornecidos
- ✅ Verifica se o item existe antes de atualizar

### Outras Operações
- ✅ GET e DELETE verificam se o item existe
- ✅ Retornam erros apropriados (404, 400, 500)

## 🐛 Troubleshooting

### LocalStack não inicia

Certifique-se de que o Docker está rodando:
```bash
docker ps
```

### Erro ao fazer deploy

Verifique se todas as dependências estão instaladas:
```bash
npm install
```

### Endpoints não funcionam

Verifique se o deploy foi concluído com sucesso e anote a URL da API do output.

### Notificações SNS não são recebidas

Verifique se:
1. O tópico SNS foi criado corretamente
2. A subscription foi configurada
3. A permissão do Lambda foi concedida

## 📚 Recursos Adicionais

- [Documentação do Serverless Framework](https://www.serverless.com/framework/docs)
- [Documentação do LocalStack](https://docs.localstack.cloud/)
- [Documentação AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Documentação DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Documentação SNS](https://docs.aws.amazon.com/sns/)

## 👨‍💻 Autor

Projeto desenvolvido para o Roteiro 3 - Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas  
PUC Minas – Engenharia de Software

---

**Bom trabalho!** 🚀

