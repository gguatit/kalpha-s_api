import { jsonResponse } from '../helpers';

interface CfProperties {
    country?: string;
    city?: string;
    tlsVersion?: string;
    tlsCipher?: string;
    httpProtocol?: string;
    clientIp?: string;
    colo?: string;
    [key: string]: unknown;
}

export function handleEchCheck(request: Request): Response {
    const cf = (request as any).cf as CfProperties | undefined;

    const tlsVersion = cf?.tlsVersion ?? null;
    const tlsCipher = cf?.tlsCipher ?? null;
    const clientIp = cf?.clientIp ?? null;
    const colo = cf?.colo ?? null;
    const httpProtocol = cf?.httpProtocol ?? null;

    const isTls13 = tlsVersion === 'TLSv1.3';

    const echIndicators: string[] = [];
    let echActive: boolean | null = null;

    if (cf) {
        const cfKeys = Object.keys(cf);
        for (const key of cfKeys) {
            const lower = key.toLowerCase();
            if (lower.includes('ech')) {
                echIndicators.push(`${key}: ${String(cf[key])}`);
            }
        }
    }

    if (echIndicators.length > 0) {
        const indicatorValues = echIndicators.map(i => {
            const val = i.split(': ')[1]?.toLowerCase();
            return val;
        });
        if (indicatorValues.some(v => v === 'true' || v === '1' || v === 'yes')) {
            echActive = true;
        } else if (indicatorValues.some(v => v === 'false' || v === '0' || v === 'no')) {
            echActive = false;
        }
    }

    let message: string;
    if (echActive === true) {
        message = '현재 연결에서 ECH(Encrypted Client Hello)가 활성화되어 있습니다. SNI가 암호화되어 전송되고 있습니다.';
    } else if (echActive === false) {
        if (isTls13) {
            message = 'TLS 1.3을 사용 중이나 ECH가 감지되지 않았습니다. 브라우저 또는 서버 측 ECH 설정을 확인하세요.';
        } else {
            message = 'ECH가 비활성화되어 있으며, TLS 버전도 1.3 미만입니다. ECH를 사용하려면 TLS 1.3이 필요합니다.';
        }
    } else {
        if (isTls13) {
            message = 'TLS 1.3 연결로 ECH 사용이 가능합니다. ECH 활성화 여부는 서버 측에서 직접 확인할 수 없어, 서비스 제공자의 ECH 설정 여부에 따라 결정됩니다.';
        } else {
            message = 'TLS 1.3 미만 연결입니다. ECH를 사용하려면 TLS 1.3 이상이 필요합니다.';
        }
    }

    return jsonResponse({
        echActive,
        echCapable: isTls13,
        tlsVersion,
        tlsCipher,
        httpProtocol,
        clientIp,
        colo,
        echIndicators: echIndicators.length > 0 ? echIndicators : null,
        message,
    });
}