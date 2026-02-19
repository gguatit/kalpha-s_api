import qrcode from 'qrcode-generator';
import { CORS_HEADERS, jsonResponse } from '../helpers';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface QrOptions {
    data: string;
    size: number;
    color: string;
    bg: string;
    ecl: ErrorCorrectionLevel;
    format: 'svg' | 'json';
    margin: number;
}

/** 구조화된 데이터를 QR 문자열로 변환 */
function buildStructuredData(type: string, params: URLSearchParams): string | null {
    switch (type) {
        case 'wifi': {
            const ssid = params.get('ssid');
            const password = params.get('password') || '';
            const encryption = params.get('encryption') || 'WPA'; // WPA, WEP, nopass
            const hidden = params.get('hidden') === 'true' ? 'H:true' : '';
            if (!ssid) return null;
            return `WIFI:T:${encryption};S:${ssid};P:${password};${hidden};`;
        }
        case 'email': {
            const to = params.get('to');
            const subject = params.get('subject') || '';
            const body = params.get('body') || '';
            if (!to) return null;
            return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
        case 'phone': {
            const number = params.get('number');
            if (!number) return null;
            return `tel:${number}`;
        }
        case 'sms': {
            const number = params.get('number');
            const message = params.get('message') || '';
            if (!number) return null;
            return `sms:${number}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
        }
        case 'geo': {
            const lat = params.get('lat');
            const lng = params.get('lng');
            if (!lat || !lng) return null;
            return `geo:${lat},${lng}`;
        }
        case 'vcard': {
            const name = params.get('name');
            const phone = params.get('phone') || '';
            const email = params.get('email') || '';
            const org = params.get('org') || '';
            if (!name) return null;
            return [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${name}`,
                phone ? `TEL:${phone}` : '',
                email ? `EMAIL:${email}` : '',
                org ? `ORG:${org}` : '',
                'END:VCARD',
            ].filter(Boolean).join('\n');
        }
        default:
            return null;
    }
}

/** QR 매트릭스를 SVG 문자열로 변환 */
function renderSvg(qr: any, opts: QrOptions): string {
    const count = qr.getModuleCount();
    const cellSize = Math.max(1, Math.floor(opts.size / (count + opts.margin * 2)));
    const totalSize = cellSize * (count + opts.margin * 2);

    let paths = '';
    for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
            if (qr.isDark(row, col)) {
                const x = (col + opts.margin) * cellSize;
                const y = (row + opts.margin) * cellSize;
                paths += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"/>`;
            }
        }
    }

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${opts.size}" height="${opts.size}">`,
        `<rect width="100%" height="100%" fill="${opts.bg}"/>`,
        `<g fill="${opts.color}">${paths}</g>`,
        `</svg>`,
    ].join('');
}

/** QR 매트릭스를 2D 배열로 변환 */
function renderMatrix(qr: any): number[][] {
    const count = qr.getModuleCount();
    const matrix: number[][] = [];
    for (let row = 0; row < count; row++) {
        const line: number[] = [];
        for (let col = 0; col < count; col++) {
            line.push(qr.isDark(row, col) ? 1 : 0);
        }
        matrix.push(line);
    }
    return matrix;
}

/** GET /qr — QR 코드 생성 */
export function handleQr(request: Request): Response {
    const url = new URL(request.url);
    const params = url.searchParams;

    // 구조화된 데이터 타입 처리
    const type = params.get('type');
    let data: string | null;

    if (type && type !== 'text') {
        data = buildStructuredData(type, params);
        if (!data) {
            return jsonResponse({
                error: `missing required parameters for type '${type}'`,
                hint: getTypeHint(type),
            }, 400);
        }
    } else {
        data = params.get('data');
    }

    if (!data) {
        return jsonResponse({
            error: 'missing data parameter',
            usage: 'GET /qr?data=hello',
            types: ['text', 'wifi', 'email', 'phone', 'sms', 'geo', 'vcard'],
        }, 400);
    }

    if (data.length > 2000) {
        return jsonResponse({ error: 'data too long (max 2000 characters)' }, 413);
    }

    // 옵션 파싱
    const ecl = (['L', 'M', 'Q', 'H'].includes(params.get('ecl') || '')
        ? params.get('ecl')!
        : 'M') as ErrorCorrectionLevel;
    const size = Math.min(1000, Math.max(50, parseInt(params.get('size') || '300', 10)));
    const color = params.get('color') || '#000000';
    const bg = params.get('bg') || '#ffffff';
    const format = params.get('format') === 'json' ? 'json' : 'svg';
    const margin = Math.min(10, Math.max(0, parseInt(params.get('margin') || '2', 10)));

    const opts: QrOptions = { data, size, color, bg, ecl, format, margin };

    try {
        const qr = qrcode(0, ecl);
        qr.addData(data);
        qr.make();

        if (format === 'json') {
            return jsonResponse({
                data: opts.data,
                ecl,
                size: qr.getModuleCount(),
                matrix: renderMatrix(qr),
            });
        }

        const svg = renderSvg(qr, opts);
        return new Response(svg, {
            status: 200,
            headers: {
                'content-type': 'image/svg+xml; charset=utf-8',
                'cache-control': 'public, max-age=86400',
                ...CORS_HEADERS,
            },
        });
    } catch (e) {
        console.error('[GET /qr] error:', e);
        return jsonResponse({ error: 'failed to generate QR code' }, 500);
    }
}

/** 타입별 필수 파라미터 힌트 */
function getTypeHint(type: string): Record<string, string> {
    const hints: Record<string, Record<string, string>> = {
        wifi: { required: 'ssid', optional: 'password, encryption(WPA|WEP|nopass), hidden(true|false)' },
        email: { required: 'to', optional: 'subject, body' },
        phone: { required: 'number' },
        sms: { required: 'number', optional: 'message' },
        geo: { required: 'lat, lng' },
        vcard: { required: 'name', optional: 'phone, email, org' },
    };
    return hints[type] || { info: 'unknown type' };
}
