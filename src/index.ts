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
import { handleEchCheck } from './handlers/ech';
import { MAX_MESSAGE_LENGTH, UUID_REGEX, getCorsHeaders, isOriginAllowed, jsonResponse, withCors } from './helpers';
import { handleEdgeForge } from './handlers/edgeforge';
import { handleTarpit, tarpitPaths } from './handlers/tarpit';

export type { Env };

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const respond = (response: Response): Response => withCors(request, env, response);

    // Preflight
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin');
      if (origin && !isOriginAllowed(origin, env)) {
        return respond(jsonResponse({ error: 'origin not allowed' }, 403));
      }
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
    }

    // Tarpit (Honeypot) - 악성 봇 요청을 먼저 낚아채서 30초 대기시킵니다.
    if (tarpitPaths.includes(pathname)) {
      return respond(handleTarpit(request));
    }

    // Auth
    const authFail = requireAuth(request, env, pathname);
    if (authFail) return respond(authFail);

    // Rate Limiting
    const rateLimited = await checkRateLimit(request, env);
    if (rateLimited) return respond(rateLimited);

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
              return respond(jsonResponse({ error: 'invalid body' }, 400));
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
        return respond(jsonResponse({ error: 'invalid body' }, 400));
      }

      if (!message) {
        return respond(jsonResponse({ error: 'missing message' }, 400));
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        return respond(jsonResponse({ error: 'message too long' }, 413));
      }

      try {
        const id = crypto.randomUUID();
        await env.DEAD_DROP.put(id, message, { expirationTtl: 3600 });

        const respHeaders = {
          'content-type': 'application/json',
          'Location': `${url.origin}/read/${id}`,
          'X-DeadDrop-Id': id,
        } as Record<string, string>;

        return respond(new Response(JSON.stringify({ id }), { status: 201, headers: respHeaders }));
      } catch (e) {
        console.error('[POST /store] storage error:', e);
        return respond(jsonResponse({ error: 'internal error' }, 500));
      }
    }

    // GET /read/:id — 메시지 읽기 & 삭제
    if (request.method === 'GET' && pathname.startsWith('/read/')) {
      try {
        const parts = pathname.split('/');
        const id = parts[parts.length - 1];
        if (!id) return respond(jsonResponse({ error: 'missing id' }, 400));
        if (!UUID_REGEX.test(id)) return respond(jsonResponse({ error: 'invalid id format' }, 400));

        const message = await env.DEAD_DROP.get(id);
        if (message === null) {
          return respond(jsonResponse({ error: 'not found or already read' }, 404));
        }

        await env.DEAD_DROP.delete(id);
        return respond(jsonResponse({ message }, 200));
      } catch (e) {
        console.error('[GET /read] error:', e);
        return respond(jsonResponse({ error: 'internal error' }, 500));
      }
    }

    // ─── IP Info API ─────────────────────────────

    // GET /ip — 전체 IP 정보 (JSON)
    if (request.method === 'GET' && pathname === '/ip') {
      return respond(handleIpFull(request));
    }

    // GET /ip/simple — IP 주소만 (텍스트)
    if (request.method === 'GET' && pathname === '/ip/simple') {
      return respond(handleIpSimple(request));
    }

    // ─── QR Code API ─────────────────────────────

    // GET /qr — QR 코드 생성 (SVG 또는 JSON)
    if (request.method === 'GET' && pathname === '/qr') {
      return respond(handleQr(request));
    }

    // ─── Encode/Decode API ─────────────────────────

    // GET /encode — 인코딩
    if (request.method === 'GET' && pathname === '/encode') {
      return respond(handleEncode(request));
    }

    // GET /decode — 디코딩
    if (request.method === 'GET' && pathname === '/decode') {
      return respond(handleDecode(request));
    }

    // ─── Security API ──────────────────────────────

    // GET /security/headers — 보안 헤더 점검
    if (request.method === 'GET' && pathname === '/security/headers') {
      return respond(await handleSecurityHeaders(request));
    }

    // GET /security/ech — ECH 지원 여부 점검
    if (request.method === 'GET' && pathname === '/security/ech') {
      return respond(await handleEchCheck(request));
    }

    // ─── EdgeForge (BETA) ──────────────────────────

    // GET or POST /edgeforge — 가짜 응답 생성
    if ((request.method === 'GET' || request.method === 'POST') && pathname === '/edgeforge') {
      return respond(await handleEdgeForge(request));
    }

    // ─── Docs ────────────────────────────────────

    // GET /openapi.json
    if (request.method === 'GET' && pathname === '/openapi.json') {
      return respond(new Response(JSON.stringify(OPENAPI), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }));
    }

    // GET / or /docs — Swagger UI
    if (request.method === 'GET' && pathname === '/docs') {
      return respond(new Response(DOCS_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }));
    }

    // GET / ??Landing Page
    if (request.method === 'GET' && pathname === '/') {
      return respond(new Response(INDEX_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }));
    }

    // Static Assets for UI
    if (request.method === 'GET' && pathname === '/assets/style.css') {
      return respond(new Response(STYLE_CSS, {
        status: 200,
        headers: { 'content-type': 'text/css; charset=utf-8' },
      }));
    }

    return respond(jsonResponse({ error: 'not found' }, 404));
  },
};
