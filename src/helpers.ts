import type { Env } from './types';

export const MAX_MESSAGE_LENGTH = 2000;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_ALLOWED_ORIGINS = ['https://kalpha.mmv.kr'] as const;

export const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function normalizeOrigin(origin: string): string | null {
    try {
        const url = new URL(origin.trim());
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        return url.origin;
    } catch {
        return null;
    }
}

function getConfiguredAllowedOrigins(env: Env): Set<string> {
    const allowed = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
    const extraOrigins = (env.CORS_ALLOWED_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean);

    for (const item of extraOrigins) {
        const normalized = normalizeOrigin(item);
        if (normalized) allowed.add(normalized);
    }

    return allowed;
}

export function isOriginAllowed(origin: string | null, env: Env): boolean {
    if (!origin) return true; // Origin 헤더가 없는 non-browser 요청은 허용
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;
    return getConfiguredAllowedOrigins(env).has(normalized);
}

export function getCorsHeaders(request: Request, env: Env): Record<string, string> {
    const headers: Record<string, string> = { ...CORS_HEADERS };
    const origin = request.headers.get('origin');
    const normalized = origin ? normalizeOrigin(origin) : null;

    if (normalized && isOriginAllowed(normalized, env)) {
        headers['Access-Control-Allow-Origin'] = normalized;
        headers['Vary'] = 'Origin';
    }

    return headers;
}

export function withCors(request: Request, env: Env, response: Response): Response {
    const headers = new Headers(response.headers);
    const corsHeaders = getCorsHeaders(request, env);
    for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/** JSON 응답 헬퍼 — CORS 헤더 자동 포함 */
export function jsonResponse(obj: unknown, status = 200): Response {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS },
    });
}
