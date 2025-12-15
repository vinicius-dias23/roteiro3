const { DynamoDB: dynamodb } = require('../config/aws');

/**
 * Lambda handler para remover um item
 * DELETE /items/{id}
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
    
    // Verificar se o item existe antes de deletar
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
    
    // Remover item do DynamoDB
    await dynamodb.delete({
      TableName: process.env.ITEMS_TABLE,
      Key: {
        id: itemId
      }
    }).promise();
    
    console.log('Item removido:', itemId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Item removido com sucesso',
        itemId: itemId
      })
    };
    
  } catch (error) {
    console.error('Erro ao remover item:', error);
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

