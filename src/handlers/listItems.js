const { DynamoDB: dynamodb } = require('../config/aws');

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

