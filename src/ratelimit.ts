import type { Env } from './types';
import { jsonResponse } from './helpers';

const RATE_LIMIT_WINDOW = 60;        // seconds
const RATE_LIMIT_MAX_REQUESTS = 60;  // max requests per window

/**
 * KV 기반 IP Rate Limiter.
 * 윈도우(60초) 내 요청 횟수를 KV에 저장하고 초과 시 429 반환.
 * KV의 eventual consistency 특성상 완벽하지 않지만 기본 남용 방지 역할을 합니다.
 */
export async function checkRateLimit(
    request: Request,
    env: Env,
): Promise<Response | null> {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const key = `ratelimit:${ip}`;

    const current = await env.DEAD_DROP.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= RATE_LIMIT_MAX_REQUESTS) {
        return jsonResponse(
            { error: 'rate limit exceeded', retryAfter: RATE_LIMIT_WINDOW },
            429,
        );
    }

    // 카운터 증가 (첫 요청 시 TTL 설정)
    await env.DEAD_DROP.put(key, String(count + 1), {
        expirationTtl: RATE_LIMIT_WINDOW,
    });

    return null; // 통과
}
