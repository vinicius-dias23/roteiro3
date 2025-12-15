const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

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
 * Valida os dados de entrada para criação de item
 */
function validateItemData(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Campo "name" é obrigatório e deve ser uma string não vazia');
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.push('Campo "description" deve ser uma string');
  }
  
  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('Campo "price" deve ser um número não negativo');
  }
  
  return errors;
}

/**
 * Lambda handler para criar um novo item
 * POST /items
 */
exports.handler = async (event) => {
  console.log('Evento recebido:', JSON.stringify(event, null, 2));
  
  try {
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
    const validationErrors = validateItemData(body);
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
    
    // Criar item
    const item = {
      id: uuidv4(),
      name: body.name.trim(),
      description: body.description ? body.description.trim() : '',
      price: body.price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Salvar no DynamoDB
    await dynamodb.put({
      TableName: process.env.ITEMS_TABLE,
      Item: item
    }).promise();
    
    // Publicar notificação no SNS
    const snsMessage = {
      event: 'ITEM_CREATED',
      itemId: item.id,
      itemName: item.name,
      timestamp: item.createdAt
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
      Subject: 'Novo item criado'
    }).promise();
    
    console.log('Item criado e notificação SNS enviada:', item.id);
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Item criado com sucesso',
        item: item
      })
    };
    
  } catch (error) {
    console.error('Erro ao criar item:', error);
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

