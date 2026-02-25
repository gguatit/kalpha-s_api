import { jsonResponse, CORS_HEADERS } from '../helpers';

interface HeaderAnalysis {
    header: string;
    status: 'excellent' | 'good' | 'warning' | 'danger' | 'info';
    message: string;
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

    try {
        // 1. Fetch and follow redirects (up to a reasonable limit)
        // We want to see the final destination's headers for a proper security analysis
        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': "Kalpha's Security Inspector/1.0",
            },
            redirect: 'follow', // Change to follow redirects
        });

        const headers = response.headers;
        const analysis: HeaderAnalysis[] = [];
        let score = 100;

        // Helper to check header
        const check = (
            name: string,
            weight: number,
            presentMsg: string,
            absentMsg: string,
            isAntiHeader = false
        ) => {
            const value = headers.get(name);
            if (value) {
                if (isAntiHeader) {
                    score -= weight;
                    analysis.push({ header: name, status: 'warning', message: presentMsg });
                } else {
                    analysis.push({ header: name, status: 'excellent', message: presentMsg });
                }
            } else {
                if (!isAntiHeader) {
                    score -= weight;
                    analysis.push({ header: name, status: 'danger', message: absentMsg });
                } else {
                    analysis.push({ header: name, status: 'excellent', message: absentMsg });
                }
            }
        };

        // ─── Phase 1: Critical Security Headers ───
        check('Content-Security-Policy', 25, 'CSP가 활성화되어 있습니다.', 'CSP가 없어 XSS 공격에 취약할 수 있습니다.');
        check('Strict-Transport-Security', 20, 'HSTS가 설정되어 안전한 HTTPS 연결을 강제합니다.', 'HSTS가 없어 프로토콜 다운그레이드 공격 위험이 있습니다.');

        // ─── Phase 2: Browser Behavior Control ───
        check('X-Frame-Options', 15, 'Clickjacking 보호가 활성화되어 있습니다.', 'X-Frame-Options가 없어 Clickjacking 위험이 있습니다.');
        check('X-Content-Type-Options', 10, 'MIME Sniffing 보호가 활성화되어 있습니다.', 'MIME Sniffing 보호가 없습니다.');
        check('Referrer-Policy', 5, 'Referrer 유출 정책이 설정되어 있습니다.', '기본 Referrer 정책을 사용 중입니다.');
        check('Permissions-Policy', 5, '브라우저 기능 권한이 제한되어 있습니다.', 'Permissions-Policy가 설정되지 않았습니다.');

        // ─── Phase 3: Cross-Origin Policies ───
        check('Cross-Origin-Embedder-Policy', 5, 'COEP가 설정되어 있습니다.', 'COEP가 설정되지 않았습니다.');
        check('Cross-Origin-Opener-Policy', 5, 'COOP가 설정되어 있습니다.', 'COOP가 설정되지 않았습니다.');
        check('Cross-Origin-Resource-Policy', 5, 'CORP가 설정되어 있습니다.', 'CORP가 설정되지 않았습니다.');

        // ─── Phase 4: Info Disclosure (Anti-headers) ───
        check('Server', 5, '서버 정보가 노출되고 있습니다.', '서버 정보가 숨겨져 있어 안전합니다.', true);
        check('X-Powered-By', 5, '기술 스택 정보가 노출되고 있습니다.', '기술 스택 정보가 숨겨져 있어 안전합니다.', true);

        // Final Grade
        score = Math.max(0, score);
        let grade = 'F';
        if (score >= 90) grade = 'A+';
        else if (score >= 80) grade = 'A';
        else if (score >= 70) grade = 'B';
        else if (score >= 60) grade = 'C';
        else if (score >= 40) grade = 'D';

        const result = {
            url: response.url || targetUrl.toString(),
            score: grade,
            grade: score,
            headers: Object.fromEntries(headers.entries()),
            analysis: analysis,
        };

        return jsonResponse(result, 200);
    } catch (e: any) {
        console.error('[handleSecurityHeaders] fetch error:', e);
        return jsonResponse({ error: 'failed to fetch target url', details: e.message }, 502);
    }
}
