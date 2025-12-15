const { v4: uuidv4 } = require('uuid');
const { DynamoDB: dynamodb, SNS: sns } = require('../config/aws');
const { getTopicArn } = require('../utils/sns');

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
    
    await sns.publish({
      TopicArn: getTopicArn(),
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

