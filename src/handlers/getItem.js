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
 * Lambda handler para buscar um item por ID
 * GET /items/{id}
 */
exports.handler = async (event) => {
  console.log('Evento recebido:', JSON.stringify(event, null, 2));
  
  try {
    const itemId = event.pathParameters?.id;
    
    if (!itemId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'ID do item é obrigatório'
        })
      };
    }
    
    // Buscar item no DynamoDB
    const result = await dynamodb.get({
      TableName: process.env.ITEMS_TABLE,
      Key: {
        id: itemId
      }
    }).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Item não encontrado'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Item encontrado',
        item: result.Item
      })
    };
    
  } catch (error) {
    console.error('Erro ao buscar item:', error);
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

