export interface Env {
  DEAD_DROP: KVNamespace;
  API_KEY?: string;
}
import { SETUP_SH } from './cli/setup_script';
import OPENAPI from './openapi';
 

const DOCS_HTML = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dead Drop API Docs</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  import { SETUP_SH } from './cli/setup_script';
  import OPENAPI from './openapi';

  // Root and /docs will return OpenAPI JSON to keep design+function expressed in the spec.
  const OPENAPI_JSON = JSON.stringify(OPENAPI);
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const jsonResponse = (obj: any, status = 200) => {
      return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
    };

    // If env.API_KEY is set, require Bearer token for API endpoints (/store, /read)
    const requireAuth = (request: Request, env: Env, pathname: string) => {
      if (!env.API_KEY) return null; // auth not enabled
      // only protect API endpoints
      if (!(pathname === '/store' || pathname.startsWith('/read/'))) return null;
      const auth = (request.headers.get('authorization') || '').trim();
      if (auth.toLowerCase().startsWith('bearer ')) {
        const token = auth.slice(7).trim();
        if (token === env.API_KEY) return null;
      }
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: defaultCorsHeaders });
    }

    // authentication (optional): if env.API_KEY is set, require Bearer token
    const authFail = requireAuth(request, env, pathname);
    if (authFail) return authFail;

    export interface Env {
      DEAD_DROP: KVNamespace;
      API_KEY?: string;
    }
    import { SETUP_SH } from './cli/setup_script';
    import OPENAPI from './openapi';

    const MAX_MESSAGE_LENGTH = 2000; // max characters allowed for stored messages

    const DOCS_HTML = `<!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dead Drop API — Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
        <style>
          body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
          header { background: #0b1220; color: #ecfeff; padding: 18px 24px; display:flex;align-items:center;justify-content:space-between }
          header h1 { margin:0; font-size:18px }
          header .install { font-size:13px; opacity:0.85 }
          #swagger-ui { margin: 0; }
          .note { padding: 8px 24px; background:#f8fafc; color:#0b1220; font-size:13px }
        </style>
      </head>
      <body>
        <header>
          <h1>Dead Drop API</h1>
          <div class="install">Install: <code>curl -sL https://api.kalpha.kr/setup | bash</code></div>
        </header>
        <div class="note">이 문서는 서버에서 제공하는 <strong>/openapi.json</strong>을 사용합니다. 인증(Bearer)을 사용하는 배포에서는 상단 Authorize 버튼을 사용하세요.</div>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script>
          window.ui = SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
            layout: 'BaseLayout',
            tryItOutEnabled: true,
            docExpansion: 'none',
            deepLinking: true
          });
        </script>
      </body>
    </html>`;

    export default {
      async fetch(request: Request, env: Env) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        const defaultCorsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };

        const jsonResponse = (obj: any, status = 200) => {
          return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
        };

        const requireAuth = (request: Request, env: Env, pathname: string) => {
          if (!env.API_KEY) return null;
          if (!(pathname === '/store' || pathname.startsWith('/read/'))) return null;
          const auth = (request.headers.get('authorization') || '').trim();
          if (auth.toLowerCase().startsWith('bearer ')) {
            const token = auth.slice(7).trim();
            if (token === env.API_KEY) return null;
          }
          return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
        };

        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: defaultCorsHeaders });
        }

        const authFail = requireAuth(request, env, pathname);
        if (authFail) return authFail;

        if (request.method === 'POST' && pathname === '/store') {
          try {
            const contentType = request.headers.get('content-type') || '';
            let body: any;
            if (contentType.includes('application/json')) {
              body = await request.json();
            } else {
              const text = await request.text();
              body = { message: text };
            }
            const message = body?.message;
            if (!message || typeof message !== 'string') {
              return jsonResponse({ error: 'missing message' }, 400);
            }
            if (message.length > MAX_MESSAGE_LENGTH) {
              return jsonResponse({ error: 'message too long' }, 413);
            }

            const id = crypto.randomUUID();
            await env.DEAD_DROP.put(id, message, { expirationTtl: 3600 });

            const respBody = JSON.stringify({ id });
            const respHeaders = {
              'content-type': 'application/json',
              'Location': `${url.origin}/read/${id}`,
              'X-DeadDrop-Id': id,
              ...defaultCorsHeaders
            } as Record<string, string>;

            return new Response(respBody, { status: 201, headers: respHeaders });
          } catch (e) {
            return jsonResponse({ error: 'invalid body' }, 400);
          }
        }

        if (request.method === 'GET' && pathname.startsWith('/read/')) {
          const parts = pathname.split('/');
          const id = parts[parts.length - 1];
          if (!id) return jsonResponse({ error: 'missing id' }, 400);

          const message = await env.DEAD_DROP.get(id);
          if (message === null) {
            return jsonResponse({ error: 'not found or already read' }, 404);
          }

          await env.DEAD_DROP.delete(id);
          return jsonResponse({ message }, 200);
        }

        // Serve installer script
        if (request.method === 'GET' && pathname === '/setup') {
          return new Response(SETUP_SH, { status: 200, headers: { 'content-type': 'text/x-sh; charset=utf-8', ...defaultCorsHeaders } });
        }

        // Serve OpenAPI JSON
        if (request.method === 'GET' && pathname === '/openapi.json') {
          return new Response(JSON.stringify(OPENAPI), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', ...defaultCorsHeaders } });
        }

        // Serve interactive docs (Swagger UI) at /docs and root
        if (request.method === 'GET' && (pathname === '/' || pathname === '/docs')) {
          return new Response(DOCS_HTML, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...defaultCorsHeaders } });
        }

        return new Response('Not Found', { status: 404 });
      }
    };
