# PUC Minas – Engenharia de Software

## Roteiro 3: Aplicações Serverless com LocalStack

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Professores:** Artur Mol, Cleiton Tavares e Cristiano Neto

---

## 1. Introdução

Nesta terceira etapa do trabalho, o aluno deverá escolher **UMA** das duas opções apresentadas. Ambas utilizam o LocalStack para simular serviços AWS em ambiente local.

> **ATENÇÃO:** O aluno deve escolher **APENAS UMA** das opções.

---

## OPÇÃO A: CRUD Serverless com Notificações SNS

📊 **Valor:** 31 pontos

### A.1 Objetivo

Desenvolver uma aplicação CRUD (*Create, Read, Update, Delete*) utilizando arquitetura serverless com o **Serverless Framework** e **LocalStack**, integrando notificações via **Amazon SNS** para eventos do sistema.

### A.2 Descrição

Implementar um sistema CRUD completo com as seguintes características:

- API REST com operações CRUD para gerenciamento de recursos
- Funções Lambda para cada operação (Create, Read, Update, Delete)
- Persistência de dados utilizando DynamoDB
- Notificação via SNS em pelo menos um evento do CRUD
- Ambiente local simulado com LocalStack

### A.3 Stack Tecnológica

| Tecnologia | Descrição |
|-----------|-----------|
| Serverless Framework | Framework para deploy de aplicações serverless |
| LocalStack | Emulador local dos serviços AWS |
| AWS Lambda | Funções serverless para lógica de negócio |
| API Gateway | Exposição dos endpoints REST |
| DynamoDB | Banco de dados NoSQL para persistência |
| Amazon SNS | Serviço de notificações em tópico |

### A.4 Funcionalidades Obrigatórias

1. **CRUD Completo:** Implementar as 4 operações básicas via endpoints REST
2. **Notificação SNS:** Publicar mensagem em um tópico SNS quando um recurso for criado ou atualizado
3. **Subscriber:** Implementar pelo menos um subscriber que receba as notificações do tópico
4. **Validação:** Validar dados de entrada nas operações de criação e atualização

### A.5 Endpoints da API

| Método | Endpoint | Descrição |
|------|---------|-----------|
| POST | /items | Criar novo item + notificação SNS |
| GET | /items | Listar todos os itens |
| GET | /items/{id} | Buscar item por ID |
| PUT | /items/{id} | Atualizar item existente |
| DELETE | /items/{id} | Remover item |

### A.6 Entregáveis

1. Arquivo `serverless.yml` com configuração completa
2. Funções Lambda implementadas para cada operação CRUD
3. Configuração do tópico SNS e subscriber
4. `README.md` com instruções de execução
5. Evidências de testes (screenshots ou logs) demonstrando o funcionamento

---

## 2. Critérios de Avaliação

| Critério | Peso |
|--------|------|
| Implementação correta das funcionalidades principais | 40% |
| Integração com serviços AWS | 30% |
| Organização do código e boas práticas | 15% |
| Documentação (README e comentários) | 15% |

---

## 3. Observações Gerais

- O domínio do CRUD (tarefas, produtos, usuários etc.) fica a seu critério
- Utilizar LocalStack para simular os serviços AWS localmente

**Bom trabalho!**

