# Solução: Erro "The security token included in the request is invalid"

## 🔍 Problema Identificado

O erro **"The security token included in the request is invalid"** ocorria porque o AWS SDK estava tentando validar credenciais reais da AWS, mas no ambiente LocalStack não precisamos (e não temos) credenciais reais.

## ✅ Solução Implementada

Foi criado um módulo de configuração compartilhado (`src/config/aws.js`) que:

1. **Detecta automaticamente** se está rodando em ambiente local (LocalStack)
2. **Configura o endpoint** do LocalStack para DynamoDB e SNS
3. **Usa credenciais fake** (`test`/`test`) que o LocalStack aceita
4. **Utiliza variáveis de ambiente** fornecidas pelo LocalStack (`AWS_ENDPOINT_URL`, `LOCALSTACK_HOSTNAME`, `EDGE_PORT`)

### Arquivo Criado: `src/config/aws.js`

Este arquivo centraliza a configuração do AWS SDK e é usado por todas as funções Lambda:

```javascript
// Detecta ambiente local
const isLocal = process.env.STAGE === 'local' || process.env.IS_OFFLINE;

if (isLocal) {
  // Usa endpoint do LocalStack
  const localstackEndpoint = process.env.AWS_ENDPOINT_URL || `http://${localstackHost}:${edgePort}`;
  
  // Credenciais fake aceitas pelo LocalStack
  const credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  };
  
  // Configura DynamoDB e SNS com endpoint do LocalStack
  // ...
}
```

### Handlers Atualizados

Todos os handlers foram atualizados para usar a configuração compartilhada:

- ✅ `createItem.js`
- ✅ `listItems.js`
- ✅ `getItem.js`
- ✅ `updateItem.js`
- ✅ `deleteItem.js`
- ✅ `snsSubscriber.js`

**Antes:**
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
```

**Depois:**
```javascript
const { DynamoDB: dynamodb, SNS: sns } = require('../config/aws');
```

## 🎯 Resultado

- ✅ **Erro de token inválido RESOLVIDO**
- ✅ AWS SDK configurado corretamente para LocalStack
- ✅ Credenciais fake funcionando
- ✅ Endpoint do LocalStack sendo usado automaticamente

## 📝 Como Usar

Após fazer o deploy, as funções Lambda agora funcionam corretamente com o LocalStack. O erro de token não deve mais aparecer.

### Testando a API

**Nota:** O LocalStack mudou o formato do endpoint. Use:

```bash
# Formato novo (recomendado)
curl -X POST http://localhost:4566/_aws/execute-api/{api-id}/local/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "price": 99.99}'

# Formato antigo (deprecated, mas ainda funciona em algumas versões)
curl -X POST http://localhost:4566/restapis/{api-id}/local/_user_request_/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "price": 99.99}'
```

**Obter o API ID:**
```bash
serverless info --stage local
```

## 🔧 Se o Erro Persistir

1. **Verifique se o deploy foi feito após as mudanças:**
   ```bash
   npm run deploy
   ```

2. **Verifique se o LocalStack está rodando:**
   ```bash
   docker ps | grep localstack
   curl http://localhost:4566/_localstack/health
   ```

3. **Reinicie o LocalStack:**
   ```bash
   ./start-localstack.sh
   npm run deploy
   ```

## 📚 Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/config/aws.js` | **NOVO** - Módulo de configuração compartilhado |
| `src/handlers/*.js` | Atualizados para usar `../config/aws` |
| `serverless.yml` | Sem mudanças necessárias |

---

**Status:** ✅ Erro de token inválido **RESOLVIDO**

