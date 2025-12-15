/**
 * Utilitário para obter o ARN do tópico SNS
 * No LocalStack, constrói o ARN a partir do nome do tópico
 */

function getTopicArn() {
  const isLocal = process.env.STAGE === 'local' || process.env.IS_OFFLINE;
  
  if (isLocal) {
    // No LocalStack, construir o ARN a partir do nome do tópico
    const topicName = process.env.SNS_TOPIC_NAME || process.env.SNS_TOPIC_ARN;
    const region = process.env.AWS_REGION || 'us-east-1';
    const accountId = '000000000000'; // Account ID padrão do LocalStack
    
    // Formato do ARN no LocalStack: arn:aws:sns:region:account-id:topic-name
    return `arn:aws:sns:${region}:${accountId}:${topicName}`;
  } else {
    // Em produção, usar o ARN fornecido diretamente
    return process.env.SNS_TOPIC_ARN;
  }
}

module.exports = {
  getTopicArn
};

