export const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: "Kalpha's API",
    version: '0.3.0',
    description: "Kalpha's API — 실용적인 공개 API 모음. Dead Drop(일회성 비밀 메시지) 및 IP 정보 조회 등을 제공합니다.\n\n📋 이용 안내: 본 API를 서비스에 사용하시려면 dev@kalpha.kr로 서비스명과 사용 방식을 알려주세요.",
  },
  servers: [
    { url: 'https://api.kalpha.kr', description: 'Production' },
  ],
  tags: [
    { name: 'Dead Drop', description: '한 번만 읽을 수 있는 임시 비밀 메시지 저장소' },
    { name: 'IP Info', description: '요청자의 IP 주소 및 지리 정보 조회' },
    { name: 'QR Code', description: 'QR 코드 생성 (SVG/JSON, WiFi·vCard·이메일 등 지원)' },
    { name: 'Encode/Decode', description: '다양한 형식의 인코딩/디코딩 (Base64, URL, HTML, Hex 등)' },
    { name: 'Security', description: '보안 관련 유틸리티 (헤더 점검 등)' },
    { name: 'EdgeForge (BETA)', description: '가짜(Mock) JSON 응답 생성기' },
    { name: 'Tarpit', description: '악성 봇 지연용 허니팟 API' },
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
      EncodeResponse: {
        type: 'object',
        properties: {
          input: { type: 'string', example: 'hello' },
          format: { type: 'string', example: 'base64' },
          result: { type: 'string', example: 'aGVsbG8=' },
        },
        required: ['input', 'format', 'result'],
      },
      DecodeResponse: {
        type: 'object',
        properties: {
          input: { type: 'string', example: 'aGVsbG8=' },
          format: { type: 'string', example: 'base64' },
          result: { type: 'string', example: 'hello' },
        },
        required: ['input', 'format', 'result'],
      },
      SecurityHeaderResponse: {
        type: 'object',
        properties: {
          url: { type: 'string', example: 'https://example.com' },
          pageType: { type: 'string', enum: ['normal', 'bot_protection', 'error'], example: 'normal' },
          statusCode: { type: 'integer', example: 200 },
          score: { type: 'string', example: 'A+' },
          grade: { type: 'integer', example: 95 },
          headers: {
            type: 'object',
            properties: {
              'Content-Security-Policy': { type: 'string', nullable: true },
              'Strict-Transport-Security': { type: 'string', nullable: true },
              'X-Frame-Options': { type: 'string', nullable: true },
              'X-Content-Type-Options': { type: 'string', nullable: true },
              'Referrer-Policy': { type: 'string', nullable: true },
              'Permissions-Policy': { type: 'string', nullable: true },
              'Cross-Origin-Embedder-Policy': { type: 'string', nullable: true },
              'Cross-Origin-Opener-Policy': { type: 'string', nullable: true },
              'Cross-Origin-Resource-Policy': { type: 'string', nullable: true },
              'Server': { type: 'string', nullable: true },
              'X-Powered-By': { type: 'string', nullable: true },
            },
          },
          analysis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                header: { type: 'string' },
                status: { type: 'string', enum: ['excellent', 'good', 'warning', 'danger', 'info'] },
                message: { type: 'string' },
              },
            },
          },
        },
        required: ['url', 'score', 'grade', 'headers', 'analysis'],
      },
      EchCheckResponse: {
        type: 'object',
        properties: {
          echActive: { type: 'boolean', nullable: true, description: 'Whether ECH is active on the connection (null if undetectable)' },
          echCapable: { type: 'boolean', example: true, description: 'Whether the connection supports ECH (requires TLS 1.3)' },
          tlsVersion: { type: 'string', example: 'TLSv1.3', nullable: true },
          tlsCipher: { type: 'string', example: 'TLS_AES_128_GCM_SHA256', nullable: true },
          httpProtocol: { type: 'string', example: 'HTTP/2', nullable: true },
          clientIp: { type: 'string', example: '203.0.113.1', nullable: true },
          colo: { type: 'string', example: 'ICN', nullable: true, description: 'Cloudflare datacenter code' },
          echIndicators: { type: 'array', items: { type: 'string' }, nullable: true, description: 'Raw ECH-related cf properties if found' },
          message: { type: 'string', example: 'TLS 1.3 연결로 ECH 사용이 가능합니다.' },
        },
        required: ['echActive', 'echCapable', 'tlsVersion', 'message'],
      },
      TarpitResponse: {
        type: 'string',
        description: '악성 봇의 연결을 끊지 않고 1초마다 무의미한 JSON 스트림 데이터를 계속 보냅니다.'
      }
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
    // ── QR Code ──
    '/qr': {
      get: {
        tags: ['QR Code'],
        summary: 'Generate a QR code',
        description: 'Generates a QR code as SVG image or JSON matrix. Supports structured data types: WiFi, vCard, email, phone, SMS, geo coordinates.',
        parameters: [
          { name: 'data', in: 'query', description: 'Text or URL to encode (required unless using a structured type)', schema: { type: 'string' } },
          { name: 'type', in: 'query', description: 'Structured data type', schema: { type: 'string', enum: ['text', 'wifi', 'email', 'phone', 'sms', 'geo', 'vcard'] } },
          { name: 'format', in: 'query', description: 'Output format (default: svg)', schema: { type: 'string', enum: ['svg', 'json'], default: 'svg' } },
          { name: 'size', in: 'query', description: 'Image size in pixels (50-1000, default: 300)', schema: { type: 'integer', default: 300 } },
          { name: 'color', in: 'query', description: 'QR code color (default: #000000)', schema: { type: 'string', default: '#000000' } },
          { name: 'bg', in: 'query', description: 'Background color (default: #ffffff)', schema: { type: 'string', default: '#ffffff' } },
          { name: 'ecl', in: 'query', description: 'Error correction level', schema: { type: 'string', enum: ['L', 'M', 'Q', 'H'], default: 'M' } },
          { name: 'margin', in: 'query', description: 'Quiet zone margin in modules (0-10, default: 2)', schema: { type: 'integer', default: 2 } },
          { name: 'ssid', in: 'query', description: 'WiFi SSID (type=wifi)', schema: { type: 'string' } },
          { name: 'password', in: 'query', description: 'WiFi password (type=wifi)', schema: { type: 'string' } },
          { name: 'name', in: 'query', description: 'Contact name (type=vcard)', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'QR code generated',
            content: {
              'image/svg+xml': { schema: { type: 'string' } },
              'application/json': { schema: { type: 'object' } },
            },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    // ── Encode/Decode ──
    '/encode': {
      get: {
        tags: ['Encode/Decode'],
        summary: 'Encode text',
        description: 'Encodes the given text using the specified format. Supported formats: base64, base64url, url, html, hex, unicode, rot13.',
        parameters: [
          { name: 'text', in: 'query', required: true, description: 'Text to encode', schema: { type: 'string' } },
          { name: 'format', in: 'query', required: true, description: 'Encoding format', schema: { type: 'string', enum: ['base64', 'base64url', 'url', 'html', 'hex', 'unicode', 'rot13'] } },
        ],
        responses: {
          '200': {
            description: 'Encoded result',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/EncodeResponse' } } },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '413': { description: 'Payload Too Large', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/decode': {
      get: {
        tags: ['Encode/Decode'],
        summary: 'Decode data',
        description: 'Decodes the given data using the specified format. Supported formats: base64, base64url, url, html, hex, unicode, rot13.',
        parameters: [
          { name: 'data', in: 'query', required: true, description: 'Data to decode', schema: { type: 'string' } },
          { name: 'format', in: 'query', required: true, description: 'Decoding format', schema: { type: 'string', enum: ['base64', 'base64url', 'url', 'html', 'hex', 'unicode', 'rot13'] } },
        ],
        responses: {
          '200': {
            description: 'Decoded result',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DecodeResponse' } } },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '413': { description: 'Payload Too Large', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    // ── Security ──
    '/security/headers': {
      get: {
        tags: ['Security'],
        summary: 'Analyze security headers of a URL',
        description: 'Fetches the target URL and analyzes various security-related HTTP headers to calculate a safety score.',
        parameters: [
          { name: 'url', in: 'query', required: true, description: 'Target URL to analyze (must include http/https)', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Security analysis result',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SecurityHeaderResponse' } } },
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/security/ech': {
      get: {
        tags: ['Security'],
        summary: 'Check if your client connection uses ECH',
        description: 'Inspects the TLS connection from the requesting client to determine whether ECH (Encrypted Client Hello) is active, and whether the connection is capable of supporting ECH (requires TLS 1.3). No parameters needed — simply request this endpoint to check your own connection.',
        responses: {
          '200': {
            description: 'ECH check result',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/EchCheckResponse' } } },
          },
        },
      },
    },
    // ── EdgeForge (BETA) ──
    '/edgeforge': {
      get: {
        tags: ['EdgeForge (BETA)'],
        summary: 'Generate a mock JSON response',
        description: 'Returns a customizable JSON response for testing purposes. You can specify the HTTP status, delay, and JSON payload.',
        parameters: [
          { name: 'status', in: 'query', description: 'HTTP status code to return (default: 200)', schema: { type: 'integer', default: 200 } },
          { name: 'delay', in: 'query', description: 'Network delay in milliseconds (max: 10000)', schema: { type: 'integer', default: 0 } },
          { name: 'body', in: 'query', description: 'Custom JSON payload to return', schema: { type: 'string' } },
        ],
        responses: {
          'default': {
            description: 'Mocked response with the requested parameters',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
      post: {
        tags: ['EdgeForge (BETA)'],
        summary: 'Generate a mock JSON response',
        description: 'Alternative method to generate a customizable JSON response (same as GET).',
        parameters: [
          { name: 'status', in: 'query', description: 'HTTP status code to return (default: 200)', schema: { type: 'integer', default: 200 } },
          { name: 'delay', in: 'query', description: 'Network delay in milliseconds (max: 10000)', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          'default': {
            description: 'Mocked response with the requested parameters',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    // ── Tarpit ──
    '/.env': {
      get: {
        tags: ['Tarpit'],
        summary: 'API Tarpit (Honeypot)',
        description: '악성 봇과 스캐너를 묶어두기 위한 엔드포인트입니다. `/.env` 외에도 `/wp-admin`, `/.git/config` 등 자주 스캔되는 60여 개의 취약점 경로에 접속할 경우 작동하며 30초 동안 1초 간격으로 무의미한 데이터를 흘려보냅니다.',
        responses: {
          '200': {
            description: 'Endless dummy JSON stream',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TarpitResponse' } } },
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
