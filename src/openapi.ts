export const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: 'Dead Drop API',
    version: '0.2.0',
    description: '한 번만 읽을 수 있는 임시 비밀 메시지 저장소 API. 이 OpenAPI 문서는 디자인/운영 세부사항과 CLI 스펙을 포함하는 확장된 사양입니다.'
  },
  servers: [
    { url: 'https://api.kalpha.kr', description: 'Production' }
  ],
  /**
   * components: security, schemas
   * x-implementation / x-policy 등 사용자 정의 확장으로 디자인/운영 정보를 포함함
   */
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      StoreRequest: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      StoreResponse: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      ReadResponse: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      ErrorResponse: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] }
    },
    'x-implementation': {
      description: '런타임/구현 관련 메타',
      ttlSeconds: 3600,
      deleteOnRead: true,
      maxMessageLength: 2000,
      responseHeaders: ['Location', 'X-DeadDrop-Id']
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
          '201': {
            description: 'Created',
            headers: {
              Location: { description: 'URL to read the message', schema: { type: 'string' } },
              'X-DeadDrop-Id': { description: 'Short id', schema: { type: 'string' } }
            },
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StoreResponse' }, examples: { id: { value: { id: 'abc-123' } } } } }
          },
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
        description: 'Reads a message by id and immediately deletes it (single-use). 이 동작은 원자적으로 처리되어야 함. 만약 id가 존재하지 않거나 이미 읽힌 경우 404 반환.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReadResponse' }, examples: { msg: { value: { message: 'hello world' } } } } } },
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
  },
  // x- 확장 필드: 디자인·운영·CLI 스펙을 포함
  'x-design': {
    ui: {
      docsPage: '/docs',
      cssServedInline: true
    },
    policies: {
      defaultTTLSeconds: 3600,
      maxMessageLength: 2000,
      rateLimit: { requestsPerMinute: 60 }
    }
  },
  'x-cli': {
    name: 'dead',
    install: {
      oneLiner: 'curl -sL https://api.kalpha.kr/setup | bash',
      safeInstall: 'curl -sL https://api.kalpha.kr/setup -o setup.sh && less setup.sh && bash setup.sh'
    },
    commands: {
      store: {
        summary: 'Store message',
        usage: 'dead store "message"  # or echo "msg" | dead store',
        output: 'id only (plain)',
        examples: [ 'dead store "hello world"', 'echo "secret" | dead store' ]
      },
      read: {
        summary: 'Read message by id',
        usage: 'dead read <id>',
        output: 'message body only (plain)',
        examples: [ 'dead read abc-123' ]
      },
      help: { summary: 'Show help', usage: 'dead -h | dead --help' },
      version: { summary: 'Show version', usage: 'dead --version', value: '0.1.0' }
    },
    env: { DEAD_API_KEY: 'optional bearer token for protected deployments', API_URL: 'override API base URL' }
  }
};

export default OPENAPI;
