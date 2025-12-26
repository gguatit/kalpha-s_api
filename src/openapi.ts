export const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: 'Dead Drop API',
    version: '0.1.0',
    description: '한 번만 읽는 임시 비밀 메시지 저장소 API. CLI `dead`와 연동됩니다.'
  },
  servers: [
    { url: 'https://api.kalpha.kr', description: 'Production' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      StoreRequest: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message']
      },
      StoreResponse: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      ReadResponse: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      ErrorResponse: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] }
    }
  },
  paths: {
    '/store': {
      post: {
        summary: 'Store a secret message',
        description: 'Stores a message and returns a single-use id. Accepts JSON `{message}` or plain text body.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/StoreRequest' } },
            'text/plain': { schema: { type: 'string' } }
          }
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/StoreResponse' } } } },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '413': { description: 'Payload Too Large', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },
    '/read/{id}': {
      get: {
        summary: 'Read and consume a message',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReadResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Not Found or already read', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },
    '/setup': {
      get: {
        summary: 'Download installer script',
        description: 'Returns the shell installer used by `curl -sL /setup | bash`.',
        responses: { '200': { description: 'Shell script', content: { 'text/x-sh': { schema: { type: 'string' } } } } }
      }
    }
  }
};

export default OPENAPI;
