import { DOCS_HTML } from './docs';

export interface Env {
  DEAD_DROP: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS helper
    const defaultCorsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const jsonResponse = (obj: any, status = 200) => {
      return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: defaultCorsHeaders });
    }

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

        const id = crypto.randomUUID();
        await env.DEAD_DROP.put(id, message, { expirationTtl: 3600 });

        return jsonResponse({ id, ttl_seconds: 3600 }, 201);
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

    // 문서 페이지: /docs
    if (request.method === 'GET' && pathname === '/docs') {
      return new Response(DOCS_HTML, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...defaultCorsHeaders } });
    }

    // 루트 접근 시 바로 문서 페이지 반환 (메인으로 사용)
    if (request.method === 'GET' && pathname === '/') {
      return new Response(DOCS_HTML, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...defaultCorsHeaders } });
    }

    return new Response('Not Found', { status: 404 });
  }
};
