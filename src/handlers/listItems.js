const AWS = require('aws-sdk');

// Configurar AWS SDK para LocalStack
const isLocal = process.env.STAGE === 'local' || process.env.IS_OFFLINE;
const localstackEndpoint = process.env.AWS_ENDPOINT_URL || 
  (process.env.LOCALSTACK_HOSTNAME ? 
    `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT || '4566'}` : 
    'http://localhost:4566');

if (isLocal) {
  AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test'
  });
}

const dynamodbConfig = isLocal ? {
  endpoint: localstackEndpoint,
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test'
} : {};

const dynamodb = new AWS.DynamoDB.DocumentClient(dynamodbConfig);

/**
 * Lambda handler para listar todos os itens
 * GET /items
 */
exports.handler = async (event) => {
  console.log('Evento recebido:', JSON.stringify(event, null, 2));
  
  try {
    // Buscar todos os itens no DynamoDB
    const result = await dynamodb.scan({
      TableName: process.env.ITEMS_TABLE
    }).promise();
    
    const items = result.Items || [];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Itens listados com sucesso',
        count: items.length,
        items: items
      })
    };
    
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message
      })
    };
  }
};

