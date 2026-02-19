import type { Env } from './types';
import OPENAPI from './openapi';
import { DOCS_HTML } from './docs';
import { requireAuth } from './auth';
import { checkRateLimit } from './ratelimit';
import { MAX_MESSAGE_LENGTH, UUID_REGEX, CORS_HEADERS, jsonResponse } from './helpers';

export type { Env };

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Auth
    const authFail = requireAuth(request, env, pathname);
    if (authFail) return authFail;

    // Rate Limiting
    const rateLimited = await checkRateLimit(request, env);
    if (rateLimited) return rateLimited;

    // POST /store — 메시지 저장
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
        const message = typeof body?.message === 'string' ? body.message.trim() : '';
        if (!message) {
          return jsonResponse({ error: 'missing message' }, 400);
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
          return jsonResponse({ error: 'message too long' }, 413);
        }

        const id = crypto.randomUUID();
        await env.DEAD_DROP.put(id, message, { expirationTtl: 3600 });

        const respHeaders = {
          'content-type': 'application/json',
          'Location': `${url.origin}/read/${id}`,
          'X-DeadDrop-Id': id,
          ...CORS_HEADERS,
        } as Record<string, string>;

        return new Response(JSON.stringify({ id }), { status: 201, headers: respHeaders });
      } catch (e) {
        console.error('[POST /store] error:', e);
        return jsonResponse({ error: 'invalid body' }, 400);
      }
    }

    // GET /read/:id — 메시지 읽기 & 삭제
    if (request.method === 'GET' && pathname.startsWith('/read/')) {
      try {
        const parts = pathname.split('/');
        const id = parts[parts.length - 1];
        if (!id) return jsonResponse({ error: 'missing id' }, 400);
        if (!UUID_REGEX.test(id)) return jsonResponse({ error: 'invalid id format' }, 400);

        const message = await env.DEAD_DROP.get(id);
        if (message === null) {
          return jsonResponse({ error: 'not found or already read' }, 404);
        }

        await env.DEAD_DROP.delete(id);
        return jsonResponse({ message }, 200);
      } catch (e) {
        console.error('[GET /read] error:', e);
        return jsonResponse({ error: 'internal error' }, 500);
      }
    }

    // GET /openapi.json
    if (request.method === 'GET' && pathname === '/openapi.json') {
      return new Response(JSON.stringify(OPENAPI), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS },
      });
    }

    // GET / or /docs — Swagger UI
    if (request.method === 'GET' && (pathname === '/' || pathname === '/docs')) {
      return new Response(DOCS_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', ...CORS_HEADERS },
      });
    }

    return jsonResponse({ error: 'not found' }, 404);
  },
};
