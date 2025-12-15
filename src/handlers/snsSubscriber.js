/**
 * Lambda handler para receber notificações do SNS
 * Este subscriber é invocado automaticamente quando uma mensagem é publicada no tópico SNS
 */
exports.handler = async (event) => {
  console.log('Notificação SNS recebida:', JSON.stringify(event, null, 2));
  
  try {
    // Processar cada record do evento SNS
    for (const record of event.Records) {
      if (record.Sns) {
        const message = JSON.parse(record.Sns.Message);
        const subject = record.Sns.Subject;
        const timestamp = record.Sns.Timestamp;
        const topicArn = record.Sns.TopicArn;
        
        console.log('=== NOTIFICAÇÃO SNS ===');
        console.log('Tópico:', topicArn);
        console.log('Assunto:', subject);
        console.log('Timestamp:', timestamp);
        console.log('Mensagem:', JSON.stringify(message, null, 2));
        console.log('======================');
        
        // Aqui você pode adicionar lógica adicional, como:
        // - Enviar email
        // - Salvar em banco de dados
        // - Enviar para outro serviço
        // - Processar a notificação de alguma forma específica
        
        // Exemplo: Log estruturado
        const logEntry = {
          eventType: message.event,
          itemId: message.itemId,
          itemName: message.itemName,
          receivedAt: timestamp,
          processedAt: new Date().toISOString()
        };
        
        console.log('Log estruturado:', JSON.stringify(logEntry, null, 2));
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notificações processadas com sucesso',
        processedRecords: event.Records.length
      })
    };
    
  } catch (error) {
    console.error('Erro ao processar notificação SNS:', error);
    throw error; // Re-throw para que o SNS possa tentar novamente se configurado
  }
};

