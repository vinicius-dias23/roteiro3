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

const snsConfig = isLocal ? {
  endpoint: localstackEndpoint,
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test'
} : {};

const dynamodb = new AWS.DynamoDB.DocumentClient(dynamodbConfig);
const sns = new AWS.SNS(snsConfig);

/**
 * Valida os dados de entrada para atualização de item
 */
function validateUpdateData(data) {
  const errors = [];
  
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Campo "name" deve ser uma string não vazia');
  }
  
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Campo "description" deve ser uma string');
  }
  
  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('Campo "price" deve ser um número não negativo');
  }
  
  return errors;
}

/**
 * Lambda handler para atualizar um item existente
 * PUT /items/{id}
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
    
    // Parse do body
    let body;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Body inválido. Esperado JSON válido.'
        })
      };
    }
    
    // Validação dos dados
    const validationErrors = validateUpdateData(body);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Dados inválidos',
          details: validationErrors
        })
      };
    }
    
    // Verificar se o item existe
    const existingItem = await dynamodb.get({
      TableName: process.env.ITEMS_TABLE,
      Key: {
        id: itemId
      }
    }).promise();
    
    if (!existingItem.Item) {
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
    
    // Preparar expressão de atualização
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    if (body.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = body.name.trim();
    }
    
    if (body.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = body.description.trim();
    }
    
    if (body.price !== undefined) {
      updateExpression.push('#price = :price');
      expressionAttributeNames['#price'] = 'price';
      expressionAttributeValues[':price'] = body.price;
    }
    
    // Sempre atualizar o campo updatedAt
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    // Atualizar item no DynamoDB
    const result = await dynamodb.update({
      TableName: process.env.ITEMS_TABLE,
      Key: {
        id: itemId
      },
      UpdateExpression: 'SET ' + updateExpression.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    // Publicar notificação no SNS
    const snsMessage = {
      event: 'ITEM_UPDATED',
      itemId: itemId,
      itemName: result.Attributes.name,
      timestamp: result.Attributes.updatedAt
    };
    
    // Construir ARN do tópico SNS (LocalStack pode não resolver a referência do CloudFormation)
    let topicArn = process.env.SNS_TOPIC_ARN;
    // Se estiver em ambiente local, sempre construir o ARN manualmente
    if (isLocal) {
      // Verificar se já é um ARN válido (começa com arn:aws:sns)
      if (!topicArn || !topicArn.startsWith('arn:aws:sns:') || topicArn.includes('Fn::Ref') || topicArn.includes('ItemsTopic')) {
        // Construir ARN manualmente para LocalStack
        const topicName = `roteiro3-crud-serverless-items-topic-${process.env.STAGE || 'local'}`;
        const region = process.env.AWS_REGION || 'us-east-1';
        topicArn = `arn:aws:sns:${region}:000000000000:${topicName}`;
      }
    }
    
    await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(snsMessage),
      Subject: 'Item atualizado'
    }).promise();
    
    console.log('Item atualizado e notificação SNS enviada:', itemId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Item atualizado com sucesso',
        item: result.Attributes
      })
    };
    
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
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

