export const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: "Kalpha's API",
    version: '0.3.0',
    description: "Kalpha's API — 실용적인 공개 API 모음. Dead Drop(일회성 비밀 메시지) 및 IP 정보 조회 등을 제공합니다.",
  },
  servers: [
    { url: 'https://api.kalpha.kr', description: 'Production' },
  ],
  tags: [
    { name: 'Dead Drop', description: '한 번만 읽을 수 있는 임시 비밀 메시지 저장소' },
    { name: 'IP Info', description: '요청자의 IP 주소 및 지리 정보 조회' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'opaque' },
    },
    schemas: {
      StoreRequest: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
      StoreResponse: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      ReadResponse: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      IpFullResponse: {
        type: 'object',
        properties: {
          ip: { type: 'string', example: '203.0.113.1' },
          country: { type: 'string', example: 'KR', nullable: true },
          city: { type: 'string', example: 'Seoul', nullable: true },
          region: { type: 'string', example: 'Seoul', nullable: true },
          regionCode: { type: 'string', example: '11', nullable: true },
          latitude: { type: 'number', example: 37.566, nullable: true },
          longitude: { type: 'number', example: 126.978, nullable: true },
          timezone: { type: 'string', example: 'Asia/Seoul', nullable: true },
          postalCode: { type: 'string', example: '04524', nullable: true },
          asn: { type: 'integer', example: 4766, nullable: true },
          isp: { type: 'string', example: 'Korea Telecom', nullable: true },
          continent: { type: 'string', example: 'AS', nullable: true },
          httpProtocol: { type: 'string', example: 'HTTP/2', nullable: true },
          tls: { type: 'string', example: 'TLSv1.3', nullable: true },
          userAgent: { type: 'string', nullable: true },
        },
      },
    },
    'x-implementation': {
      description: '런타임/구현 관련 메타',
      ttlSeconds: 3600,
      deleteOnRead: true,
      maxMessageLength: 2000,
      responseHeaders: ['Location', 'X-DeadDrop-Id'],
    },
  },
  paths: {
    // ── Dead Drop ──
    '/store': {
      post: {
        tags: ['Dead Drop'],
        summary: 'Store a secret message',
        description: 'Stores a message and returns a single-use id. Accepts JSON `{message}` or plain text body.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/StoreRequest' } },
            'text/plain': { schema: { type: 'string' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            headers: {
              Location: { description: 'URL to read the message', schema: { type: 'string' } },
              'X-DeadDrop-Id': { description: 'Short id', schema: { type: 'string' } },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StoreResponse' },
                examples: { id: { value: { id: 'abc-123' } } },
              },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '413': { description: 'Payload Too Large', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/read/{id}': {
      get: {
        tags: ['Dead Drop'],
        summary: 'Read and consume a message',
        description: 'Reads a message by id and immediately deletes it (single-use). Returns 404 if the id does not exist or was already read.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadResponse' },
                examples: { msg: { value: { message: 'hello world' } } },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Not Found or already read', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    // ── IP Info ──
    '/ip': {
      get: {
        tags: ['IP Info'],
        summary: 'Get full IP information',
        description: 'Returns the requester\'s IP address along with geolocation, ISP, timezone, and connection details. All data is provided by Cloudflare edge network — no external API calls.',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IpFullResponse' },
              },
            },
          },
        },
      },
    },
    '/ip/simple': {
      get: {
        tags: ['IP Info'],
        summary: 'Get IP address only',
        description: 'Returns the requester\'s IP address as plain text. Useful for scripts and CLI tools (e.g. `curl https://api.kalpha.kr/ip/simple`).',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'text/plain': {
                schema: { type: 'string', example: '203.0.113.1' },
              },
            },
          },
        },
      },
    },
  },
  'x-design': {
    ui: { docsPage: '/docs', cssServedInline: true },
    policies: {
      defaultTTLSeconds: 3600,
      maxMessageLength: 2000,
      rateLimit: { requestsPerMinute: 60 },
    },
  },
};

export default OPENAPI;
