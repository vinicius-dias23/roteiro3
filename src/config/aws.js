/**
 * Configuração do AWS SDK para LocalStack
 * Este módulo configura o AWS SDK para usar o endpoint do LocalStack
 * e desabilita a validação de credenciais quando executando localmente
 */

const AWS = require('aws-sdk');

// Verificar se estamos em ambiente local (LocalStack)
const isLocal = process.env.STAGE === 'local' || process.env.IS_OFFLINE;

if (isLocal) {
  // Usar o endpoint fornecido pelo LocalStack ou o padrão
  // LOCALSTACK_HOSTNAME e EDGE_PORT são fornecidos pelo LocalStack dentro do container Lambda
  const localstackHost = process.env.LOCALSTACK_HOSTNAME || 'localhost';
  const edgePort = process.env.EDGE_PORT || '4566';
  const localstackEndpoint = process.env.AWS_ENDPOINT_URL || `http://${localstackHost}:${edgePort}`;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Credenciais fake para LocalStack (qualquer valor funciona)
  const credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  };
  
  // Configurar DynamoDB DocumentClient
  const dynamodbConfig = {
    region: region,
    endpoint: localstackEndpoint,
    ...credentials
  };
  
  // Configurar SNS (usa o mesmo endpoint do LocalStack)
  const snsConfig = {
    region: region,
    endpoint: localstackEndpoint,
    ...credentials
  };
  
  module.exports = {
    DynamoDB: new AWS.DynamoDB.DocumentClient(dynamodbConfig),
    SNS: new AWS.SNS(snsConfig),
    AWS
  };
} else {
  // Configuração para produção (AWS real)
  module.exports = {
    DynamoDB: new AWS.DynamoDB.DocumentClient(),
    SNS: new AWS.SNS(),
    AWS
  };
}

