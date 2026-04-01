import type { Env } from './types';
import OPENAPI from './openapi';
import { DOCS_HTML } from './docs';
// @ts-ignore
import INDEX_HTML from './ui/index.html';
// @ts-ignore
import STYLE_CSS from './ui/style.css';
import { requireAuth } from './auth';
import { checkRateLimit } from './ratelimit';
import { handleIpFull, handleIpSimple } from './handlers/ip';
import { handleQr } from './handlers/qr';
import { handleEncode, handleDecode } from './handlers/encode';
import { handleSecurityHeaders } from './handlers/security';
import { MAX_MESSAGE_LENGTH, UUID_REGEX, CORS_HEADERS, jsonResponse } from './helpers';
import { handleEdgeForge } from './handlers/edgeforge';

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

    // ─── Dead Drop API ───────────────────────────

    // POST /store — 메시지 저장
    if (request.method === 'POST' && pathname === '/store') {
      const contentType = (request.headers.get('content-type') || '').toLowerCase();

      let message = '';
      try {
        const raw = await request.text();
        const trimmed = raw.trim();

        if (contentType.includes('application/json')) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (typeof parsed === 'string') {
              message = parsed.trim();
            } else if (
              parsed &&
              typeof parsed === 'object' &&
              'message' in parsed &&
              typeof (parsed as { message?: unknown }).message === 'string'
            ) {
              message = ((parsed as { message: string }).message || '').trim();
            } else {
              return jsonResponse({ error: 'invalid body' }, 400);
            }
          } catch {
            // 일부 클라이언트가 JSON content-type으로 plain text를 보내는 경우를 허용합니다.
            message = trimmed;
          }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams(raw);
          message = (params.get('message') || '').trim();
          if (!message) {
            message = trimmed;
          }
        } else {
          message = trimmed;
        }
      } catch (e) {
        console.error('[POST /store] body parse error:', e);
        return jsonResponse({ error: 'invalid body' }, 400);
      }

      if (!message) {
        return jsonResponse({ error: 'missing message' }, 400);
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse({ error: 'message too long' }, 413);
      }

      try {
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
        console.error('[POST /store] storage error:', e);
        return jsonResponse({ error: 'internal error' }, 500);
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

    // ─── IP Info API ─────────────────────────────

    // GET /ip — 전체 IP 정보 (JSON)
    if (request.method === 'GET' && pathname === '/ip') {
      return handleIpFull(request);
    }

    // GET /ip/simple — IP 주소만 (텍스트)
    if (request.method === 'GET' && pathname === '/ip/simple') {
      return handleIpSimple(request);
    }

    // ─── QR Code API ─────────────────────────────

    // GET /qr — QR 코드 생성 (SVG 또는 JSON)
    if (request.method === 'GET' && pathname === '/qr') {
      return handleQr(request);
    }

    // ─── Encode/Decode API ─────────────────────────

    // GET /encode — 인코딩
    if (request.method === 'GET' && pathname === '/encode') {
      return handleEncode(request);
    }

    // GET /decode — 디코딩
    if (request.method === 'GET' && pathname === '/decode') {
      return handleDecode(request);
    }

    // ─── Security API ──────────────────────────────

    // GET /security/headers — 보안 헤더 점검
    if (request.method === 'GET' && pathname === '/security/headers') {
      return handleSecurityHeaders(request);
    }

    // ─── EdgeForge (BETA) ──────────────────────────

    // GET or POST /edgeforge — 가짜 응답 생성
    if ((request.method === 'GET' || request.method === 'POST') && pathname === '/edgeforge') {
      return handleEdgeForge(request);
    }

    // ─── Docs ────────────────────────────────────

    // GET /openapi.json
    if (request.method === 'GET' && pathname === '/openapi.json') {
      return new Response(JSON.stringify(OPENAPI), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS },
      });
    }

    // GET / or /docs — Swagger UI
    if (request.method === 'GET' && pathname === '/docs') {
      return new Response(DOCS_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', ...CORS_HEADERS },
      });
    }

    // GET / ??Landing Page
    if (request.method === 'GET' && pathname === '/') {
      return new Response(INDEX_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', ...CORS_HEADERS },
      });
    }

    // Static Assets for UI
    if (request.method === 'GET' && pathname === '/assets/style.css') {
      return new Response(STYLE_CSS, {
        status: 200,
        headers: { 'content-type': 'text/css; charset=utf-8', ...CORS_HEADERS },
      });
    }

    return jsonResponse({ error: 'not found' }, 404);
  },
};
