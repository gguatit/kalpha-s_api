import { CORS_HEADERS, jsonResponse } from '../helpers';

interface CfProperties {
    country?: string;
    city?: string;
    region?: string;
    regionCode?: string;
    latitude?: string;
    longitude?: string;
    timezone?: string;
    postalCode?: string;
    asn?: number;
    asOrganization?: string;
    continent?: string;
    httpProtocol?: string;
    tlsVersion?: string;
    clientIp?: string;
}

/** 요청에서 클라이언트 IP 주소를 추출 */
function getClientIp(request: Request, cf?: CfProperties): string {
    return request.headers.get('cf-connecting-ip')
        || request.headers.get('x-real-ip')
        || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || cf?.clientIp
        || 'unknown';
}

/** GET /ip — 요청자의 전체 IP 정보를 JSON으로 반환 */
export function handleIpFull(request: Request): Response {
    const cf = (request as any).cf as CfProperties | undefined;
    const ip = getClientIp(request, cf);

    return jsonResponse({
        ip,
        country: cf?.country ?? null,
        city: cf?.city ?? null,
        region: cf?.region ?? null,
        regionCode: cf?.regionCode ?? null,
        latitude: cf?.latitude ? parseFloat(cf.latitude) : null,
        longitude: cf?.longitude ? parseFloat(cf.longitude) : null,
        timezone: cf?.timezone ?? null,
        postalCode: cf?.postalCode ?? null,
        asn: cf?.asn ?? null,
        isp: cf?.asOrganization ?? null,
        continent: cf?.continent ?? null,
        httpProtocol: cf?.httpProtocol ?? null,
        tls: cf?.tlsVersion ?? null,
        userAgent: request.headers.get('user-agent') ?? null,
    });
}

/** GET /ip/simple — IP 주소만 텍스트로 반환 (curl 친화적) */
export function handleIpSimple(request: Request): Response {
    const cf = (request as any).cf as CfProperties | undefined;
    const ip = getClientIp(request, cf);

    return new Response(ip + '\n', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8', ...CORS_HEADERS },
    });
}
