import type { Env } from './types';
import { CORS_HEADERS } from './helpers';

/** Constant-time string comparison to prevent timing attacks */
function timingSafeEqual(a: string, b: string): boolean {
    const encoder = new TextEncoder();
    const aBuf = encoder.encode(a);
    const bBuf = encoder.encode(b);
    if (aBuf.byteLength !== bBuf.byteLength) return false;
    return (crypto.subtle as any).timingSafeEqual(aBuf, bBuf);
}

/**
 * Bearer 토큰 인증 검사.
 * API_KEY 미설정 시 인증을 건너뜁니다.
 * 인증 실패 시 401 Response 반환, 성공 시 null 반환.
 */
export function requireAuth(request: Request, env: Env, pathname: string): Response | null {
    if (!env.API_KEY) return null;
    if (!(pathname === '/store' || pathname.startsWith('/read/'))) return null;

    const auth = (request.headers.get('authorization') || '').trim();
    if (auth.toLowerCase().startsWith('bearer ')) {
        const token = auth.slice(7).trim();
        if (timingSafeEqual(token, env.API_KEY)) return null;
    }

    return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json', ...CORS_HEADERS },
    });
}
