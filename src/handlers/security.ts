import { jsonResponse, CORS_HEADERS } from '../helpers';

interface HeaderAnalysis {
    header: string;
    status: 'excellent' | 'good' | 'warning' | 'danger' | 'info';
    message: string;
}

// SSRF 방어: 차단할 호스트명/IP 패턴
const BLOCKED_HOSTS = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,       // 127.0.0.0/8
    /^10\.\d+\.\d+\.\d+$/,        // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,  // 172.16.0.0/12
    /^192\.168\.\d+\.\d+$/,       // 192.168.0.0/16
    /^169\.254\.\d+\.\d+$/,       // 링크 로컬 (AWS metadata 등)
    /^::1$/,                       // IPv6 루프백
    /^0\.0\.0\.0$/,
    /^fd[0-9a-f]{2}:/i,            // IPv6 ULA
];

// SSRF 방어: 허용된 도메인 (subdomain 포함)
const ALLOWED_HOSTS = [
    /(?:^|\.)kalpha\.mmv\.kr$/i,
    /(?:^|\.)kalpha\.kr$/i,
];

function isSsrfBlocked(hostname: string): boolean {
    // 허용 목록에 있으면 무조건 통과
    if (ALLOWED_HOSTS.some((r) => r.test(hostname))) return false;
    // 차단 패턴에 해당하면 거부
    if (BLOCKED_HOSTS.some((r) => r.test(hostname))) return true;
    return false;
}

export async function handleSecurityHeaders(request: Request) {
    const urlParam = new URL(request.url).searchParams.get('url');

    if (!urlParam) {
        return jsonResponse({ error: 'missing url parameter' }, 400);
    }

    let targetUrl: URL;
    let rawUrl = urlParam.trim();

    // Add protocol if missing
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl;
    }

    try {
        targetUrl = new URL(rawUrl);
        if (!['http:', 'https:'].includes(targetUrl.protocol)) {
            throw new Error('invalid protocol');
        }
    } catch (e) {
        return jsonResponse({ error: 'invalid url format' }, 400);
    }

    if (isSsrfBlocked(targetUrl.hostname)) {
        return jsonResponse({ error: 'target url is not allowed' }, 403);
    }

    try {
        // 1. Fetch — 리다이렉트를 수동으로 따라가며 각 단계에서 SSRF 검사
        let currentUrl = targetUrl;
        let response = await fetch(currentUrl.toString(), {
            method: 'GET',
            headers: { 'User-Agent': "Kalpha's Security Inspector/1.0" },
            redirect: 'manual',
        });

        for (let hop = 0; hop < 5 && response.status >= 300 && response.status < 400; hop++) {
            const location = response.headers.get('location');
            if (!location) break;
            let nextUrl: URL;
            try {
                nextUrl = new URL(location, currentUrl.toString());
            } catch {
                return jsonResponse({ error: 'invalid redirect location' }, 502);
            }
            if (!['http:', 'https:'].includes(nextUrl.protocol) || isSsrfBlocked(nextUrl.hostname)) {
                return jsonResponse({ error: 'target url is not allowed' }, 403);
            }
            currentUrl = nextUrl;
            response = await fetch(currentUrl.toString(), {
                method: 'GET',
                headers: { 'User-Agent': "Kalpha's Security Inspector/1.0" },
                redirect: 'manual',
            });
        }

        const headers = response.headers;
        const analysis: HeaderAnalysis[] = [];
        let score = 100;
        const statusCode = response.status;

        // 2. Detect Page Type
        let pageType: 'normal' | 'bot_protection' | 'error' = 'normal';
        const cfMitigated = headers.get('cf-mitigated');
        const serverHeader = headers.get('server') || '';

        if (statusCode >= 400 && statusCode < 600) {
            pageType = 'error';
        }
        if (cfMitigated === 'challenge' || (statusCode === 403 && serverHeader.toLowerCase().includes('cloudflare'))) {
            pageType = 'bot_protection';
        }

        // Helper to check header with nuanced scoring
        const check = (
            name: string,
            weight: number,
            presentMsg: string,
            absentMsg: string,
            options: {
                isAntiHeader?: boolean;
                reportOnlyName?: string;
                reportOnlyScore?: number;
                checkValue?: (val: string) => { scoreAdj: number; msg: string; status: HeaderAnalysis['status'] } | null;
            } = {}
        ) => {
            const value = headers.get(name);
            const reportOnlyValue = options.reportOnlyName ? headers.get(options.reportOnlyName) : null;

            if (value) {
                if (options.isAntiHeader) {
                    // Specific check for common/safe server headers
                    if (name.toLowerCase() === 'server' && (value.toLowerCase().includes('cloudflare') || value.toLowerCase() === 'server')) {
                        score -= Math.floor(weight / 2);
                        analysis.push({ header: name, status: 'info', message: `${presentMsg} (일반적인 정보 노출입니다.)` });
                    } else {
                        score -= weight;
                        analysis.push({ header: name, status: 'warning', message: presentMsg });
                    }
                } else {
                    const valueCheck = options.checkValue ? options.checkValue(value) : null;
                    if (valueCheck) {
                        score += valueCheck.scoreAdj; // scoreAdj will usually be negative for bad configs
                        analysis.push({ header: name, status: valueCheck.status, message: valueCheck.msg });
                    } else {
                        analysis.push({ header: name, status: 'excellent', message: presentMsg });
                    }
                }
            } else if (reportOnlyValue) {
                // Report-Only found
                const partialScore = options.reportOnlyScore || Math.floor(weight / 2);
                score -= (weight - partialScore);
                analysis.push({ header: name, status: 'good', message: `${name}가 Report-Only 모드로 설정되어 있습니다. (테스트 중)` });
            } else {
                if (!options.isAntiHeader) {
                    score -= weight;
                    analysis.push({ header: name, status: 'danger', message: absentMsg });
                } else {
                    analysis.push({ header: name, status: 'excellent', message: absentMsg });
                }
            }
        };

        // ─── Phase 1: Critical Security Headers ───
        check('Content-Security-Policy', 25, 'CSP가 활성화되어 있습니다.', 'CSP가 없어 XSS 공격에 취약할 수 있습니다.', {
            reportOnlyName: 'Content-Security-Policy-Report-Only',
            reportOnlyScore: 15,
            checkValue: (val) => {
                if (val.includes("'unsafe-inline'") || val.includes("'unsafe-eval'")) {
                    return { scoreAdj: -10, status: 'warning', msg: "CSP에 'unsafe-inline' 또는 'unsafe-eval'이 포함되어 있어 보안이 약화되었습니다." };
                }
                return null;
            }
        });
        check('Strict-Transport-Security', 20, 'HSTS가 설정되어 안전한 HTTPS 연결을 강제합니다.', 'HSTS가 없어 프로토콜 다운그레이드 공격 위험이 있습니다.', {
            checkValue: (val) => {
                const match = val.match(/max-age=(\d+)/);
                if (match && parseInt(match[1]) < 15552000) {
                    return { scoreAdj: -5, status: 'warning', msg: 'HSTS max-age가 너무 짧습니다 (6개월 이상 권장).' };
                }
                return null;
            }
        });

        // ─── Phase 2: Cookies & CORS ───
        const cookieHeaders = (response.headers as any).getSetCookie ? (response.headers as any).getSetCookie() : [headers.get('set-cookie')].filter(Boolean);
        if (cookieHeaders.length > 0) {
            let cookieBad = false;
            for (const cookie of cookieHeaders) {
                const c = cookie.toLowerCase();
                if (!c.includes('httponly') || !c.includes('secure') || !c.includes('samesite')) {
                    cookieBad = true;
                    break;
                }
            }
            if (cookieBad) {
                score -= 10;
                analysis.push({ header: 'Set-Cookie', status: 'warning', message: '일부 쿠키에 HttpOnly, Secure 또는 SameSite 속성이 누락되었습니다.' });
            } else {
                analysis.push({ header: 'Set-Cookie', status: 'excellent', message: '모든 쿠키가 보안 속성을 준수하고 있습니다.' });
            }
        }

        const corsOrigin = headers.get('Access-Control-Allow-Origin');
        if (corsOrigin) {
            if (corsOrigin === '*') {
                score -= 5;
                analysis.push({ header: 'CORS', status: 'warning', message: 'CORS 허용 범위가 모든 도메인(*)으로 설정되어 있습니다.' });
            } else {
                analysis.push({ header: 'CORS', status: 'excellent', message: 'CORS 허용 범위가 특정 도메인으로 제한되어 있습니다.' });
            }
        }

        // ─── Phase 3: Browser Behavior & Privacy ───
        check('X-Frame-Options', 15, 'Clickjacking 보호가 활성화되어 있습니다.', 'X-Frame-Options가 없어 Clickjacking 위험이 있습니다.');
        check('X-Content-Type-Options', 10, 'MIME Sniffing 보호가 활성화되어 있습니다.', 'MIME Sniffing 보호가 없습니다.');
        check('Referrer-Policy', 5, 'Referrer 유출 정책이 설정되어 있습니다.', '기본 Referrer 정책을 사용 중입니다.');
        check('Permissions-Policy', 2, '브라우저 기능 권한이 제한되어 있습니다.', 'Permissions-Policy가 설정되지 않았습니다.');
        check('X-XSS-Protection', 2, '브라우저 XSS 필터가 활성화되어 있습니다.', 'X-XSS-Protection 설정이 없습니다.');
        check('X-DNS-Prefetch-Control', 2, 'DNS 사전 조회가 제어되고 있습니다.', 'DNS 사전 조회가 기본값으로 설정되어 있습니다.');

        // ─── Phase 4: Cross-Origin Policies ───
        check('Cross-Origin-Embedder-Policy', 2, 'COEP가 설정되어 있습니다.', 'COEP가 설정되지 않았습니다.');
        check('Cross-Origin-Opener-Policy', 2, 'COOP가 설정되어 있습니다.', 'COOP가 설정되지 않았습니다.');
        check('Cross-Origin-Resource-Policy', 2, 'CORP가 설정되어 있습니다.', 'CORP가 설정되지 않았습니다.');

        // ─── Phase 5: Info Disclosure ───
        check('Server', 5, '서버 정보가 노출되고 있습니다.', '서버 정보가 숨겨져 있어 안전합니다.', { isAntiHeader: true });
        check('X-Powered-By', 5, '기술 스택 정보가 노출되고 있습니다.', '기술 스택 정보가 숨겨져 있어 안전합니다.', { isAntiHeader: true });

        // Final Grade Calculation
        score = Math.max(0, score);
        let grade = 'F';
        if (score >= 90) grade = 'A+';
        else if (score >= 80) grade = 'A';
        else if (score >= 70) grade = 'B';
        else if (score >= 60) grade = 'C';
        else if (score >= 40) grade = 'D';

        const result = {
            url: currentUrl.toString(),
            pageType,
            statusCode,
            score,
            grade,
            headers: Object.fromEntries(headers.entries()),
            analysis: analysis,
        };

        return jsonResponse(result, 200);
    } catch (e: any) {
        console.error('[handleSecurityHeaders] fetch error:', e);
        return jsonResponse({ error: 'failed to fetch target url' }, 502);
    }
}
