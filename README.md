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

**⚠️ IMPORTANTE:** O LocalStack precisa de acesso ao Docker socket para executar funções Lambda. Use o script fornecido:

```bash
./start-localstack.sh
```

Este script inicia o LocalStack com as configurações corretas, incluindo:
- Acesso ao Docker socket para executar Lambdas
- Serviços necessários habilitados (Lambda, DynamoDB, SNS, API Gateway)
- Volume montado para o código

**Alternativa manual:**

Se preferir iniciar manualmente, use:

```bash
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -p 4571:4571 \
  -e SERVICES=lambda,dynamodb,sns,apigateway,cloudformation,logs,iam \
  -e LAMBDA_EXECUTOR=docker-reuse \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack
```

**Nota:** O LocalStack NÃO será iniciado automaticamente pelo plugin devido à necessidade de acesso ao Docker socket.

### 2. Fazer o Deploy

Execute o deploy da aplicação no ambiente local:

```bash
npm run deploy
```

Ou usando o Serverless diretamente:

```bash
serverless deploy --stage local
```

Este comando irá:
- Criar a tabela DynamoDB
- Criar o tópico SNS
- Configurar as funções Lambda
- Configurar o API Gateway
- Configurar a subscription do SNS para o Lambda subscriber

### 3. Obter a URL da API

Após o deploy, você verá a URL base da API no output. Ela será algo como:

```
https://localhost:4566/restapis/{api-id}/local/_user_request_/items
```

Para facilitar, você pode usar o endpoint do LocalStack diretamente:

```
http://localhost:4566/restapis/{api-id}/local/_user_request_
```

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

```bash
curl -X POST http://localhost:4566/restapis/{api-id}/local/_user_request_/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Exemplo",
    "description": "Descrição do produto",
    "price": 99.99
  }'
```

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

1. **Criar um item:**
```bash
curl -X POST http://localhost:4566/restapis/{api-id}/local/_user_request_/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "description": "Item de teste", "price": 50}'
```

2. **Verificar se o item foi criado:**
```bash
curl http://localhost:4566/restapis/{api-id}/local/_user_request_/items
```

3. **Atualizar o item:**
```bash
curl -X PUT http://localhost:4566/restapis/{api-id}/local/_user_request_/items/{item-id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste Atualizado", "price": 75}'
```

4. **Verificar logs do subscriber:**
Os logs do subscriber aparecerão automaticamente quando as notificações SNS forem processadas.

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

## 🧹 Limpeza

Para remover todos os recursos criados:

```bash
npm run remove
```

Ou:

```bash
serverless remove --stage local
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

### Erro: "Docker not available" ou "Error while creating lambda: Docker not available"

Este erro ocorre quando o LocalStack não consegue acessar o Docker para executar funções Lambda.

**Solução:**

1. **Parar o LocalStack atual:**
```bash
docker stop $(docker ps -q --filter ancestor=localstack/localstack)
docker rm $(docker ps -aq --filter ancestor=localstack/localstack)
```

2. **Iniciar o LocalStack com acesso ao Docker socket:**
```bash
./start-localstack.sh
```

Ou manualmente:
```bash
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -p 4571:4571 \
  -e SERVICES=lambda,dynamodb,sns,apigateway,cloudformation,logs,iam \
  -e LAMBDA_EXECUTOR=docker-reuse \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack
```

3. **Aguardar alguns segundos e tentar o deploy novamente:**
```bash
npm run deploy
```

**Verificar se o Docker está rodando:**
```bash
docker ps
```

**Verificar se o LocalStack está saudável:**
```bash
curl http://localhost:4566/_localstack/health
```

### Erro: "Stack is in the 'REVIEW_IN_PROGRESS' state"

Este erro ocorre quando um deploy anterior não foi concluído ou está travado. Para resolver:

**Solução 1: Remover o stack e tentar novamente**
```bash
npm run remove
# Ou
serverless remove --stage local
```

Aguarde alguns segundos e tente o deploy novamente:
```bash
npm run deploy
```

**Solução 2: Limpar o LocalStack completamente**

Se a solução 1 não funcionar, reinicie o LocalStack:

1. Parar o container do LocalStack:
```bash
docker ps | grep localstack
docker stop <container-id>
```

2. Remover o container:
```bash
docker rm <container-id>
```

3. Iniciar o LocalStack novamente:
```bash
docker run -d -p 4566:4566 -p 4571:4571 localstack/localstack
```

4. Aguardar alguns segundos e fazer o deploy:
```bash
npm run deploy
```

**Solução 3: Verificar e limpar stacks órfãos**

Listar stacks no LocalStack:
```bash
aws --endpoint-url=http://localhost:4566 cloudformation list-stacks --region us-east-1
```

Se necessário, você pode limpar todos os recursos do LocalStack reiniciando o container.

### LocalStack não inicia

Certifique-se de que o Docker está rodando:
```bash
docker ps
```

Se o LocalStack não estiver rodando, use o script fornecido:
```bash
./start-localstack.sh
```

Ou inicie manualmente com acesso ao Docker socket (necessário para Lambda):
```bash
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -p 4571:4571 \
  -e SERVICES=lambda,dynamodb,sns,apigateway,cloudformation,logs,iam \
  -e LAMBDA_EXECUTOR=docker-reuse \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack
```

### Erro ao fazer deploy

Verifique se todas as dependências estão instaladas:
```bash
npm install
```

Certifique-se de que o LocalStack está rodando e acessível:
```bash
curl http://localhost:4566/_localstack/health
```

### Endpoints não funcionam

Verifique se o deploy foi concluído com sucesso e anote a URL da API do output.

### Erro: "The security token included in the request is invalid"

Este erro ocorre quando o AWS SDK tenta validar credenciais reais da AWS no LocalStack.

**Solução:** ✅ **JÁ RESOLVIDO**

Foi criado um módulo de configuração (`src/config/aws.js`) que:
- Detecta automaticamente ambiente local
- Configura endpoint do LocalStack
- Usa credenciais fake aceitas pelo LocalStack

**Se o erro persistir:**
1. Certifique-se de que fez deploy após as correções:
   ```bash
   npm run deploy
   ```
2. Verifique se os handlers estão usando a configuração correta (já atualizados)

Para mais detalhes, consulte: `SOLUCAO_TOKEN_INVALIDO.md`

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

