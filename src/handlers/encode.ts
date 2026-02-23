import { jsonResponse } from '../helpers';

const FORMATS = ['base64', 'base64url', 'url', 'html', 'hex', 'unicode', 'rot13'] as const;
type Format = (typeof FORMATS)[number];

const MAX_INPUT_LENGTH = 10_000;

// ── HTML 엔티티 맵 ─────────────────────────────

const HTML_ENCODE_MAP: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;',
};

const HTML_DECODE_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(HTML_ENCODE_MAP).map(([k, v]) => [v, k]),
);

// ── 인코딩 함수 ────────────────────────────────

function encodeBase64(text: string): string {
    return btoa(
        Array.from(new TextEncoder().encode(text))
            .map((b) => String.fromCharCode(b))
            .join(''),
    );
}

function encodeBase64Url(text: string): string {
    return encodeBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeUrl(text: string): string {
    return encodeURIComponent(text);
}

function encodeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (ch) => HTML_ENCODE_MAP[ch] ?? ch);
}

function encodeHex(text: string): string {
    return Array.from(new TextEncoder().encode(text))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function encodeUnicode(text: string): string {
    return Array.from(text)
        .map((ch) => {
            const cp = ch.codePointAt(0)!;
            if (cp > 0xffff) return `\\u{${cp.toString(16)}}`;
            return `\\u${cp.toString(16).padStart(4, '0')}`;
        })
        .join('');
}

function rot13(text: string): string {
    return text.replace(/[A-Za-z]/g, (ch) => {
        const base = ch <= 'Z' ? 65 : 97;
        return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
    });
}

function encode(text: string, format: Format): string {
    switch (format) {
        case 'base64': return encodeBase64(text);
        case 'base64url': return encodeBase64Url(text);
        case 'url': return encodeUrl(text);
        case 'html': return encodeHtml(text);
        case 'hex': return encodeHex(text);
        case 'unicode': return encodeUnicode(text);
        case 'rot13': return rot13(text);
    }
}

// ── 디코딩 함수 ────────────────────────────────

function decodeBase64(data: string): string {
    const bin = atob(data);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function decodeBase64Url(data: string): string {
    let b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    return decodeBase64(b64);
}

function decodeUrl(data: string): string {
    return decodeURIComponent(data);
}

function decodeHtml(data: string): string {
    return data.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => HTML_DECODE_MAP[entity] ?? entity);
}

function decodeHex(data: string): string {
    const clean = data.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
        throw new Error('invalid hex string');
    }
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return new TextDecoder().decode(bytes);
}

function decodeUnicode(data: string): string {
    return data.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, cp1, cp2) => {
        return String.fromCodePoint(parseInt(cp1 || cp2, 16));
    });
}

function decode(data: string, format: Format): string {
    switch (format) {
        case 'base64': return decodeBase64(data);
        case 'base64url': return decodeBase64Url(data);
        case 'url': return decodeUrl(data);
        case 'html': return decodeHtml(data);
        case 'hex': return decodeHex(data);
        case 'unicode': return decodeUnicode(data);
        case 'rot13': return rot13(data); // ROT13은 대칭
    }
}

// ── 핸들러 ─────────────────────────────────────

function parseFormat(raw: string | null): Format | null {
    if (!raw) return null;
    const lower = raw.toLowerCase() as Format;
    return FORMATS.includes(lower) ? lower : null;
}

/** GET /encode — 인코딩 */
export function handleEncode(request: Request): Response {
    const params = new URL(request.url).searchParams;
    const text = params.get('text');
    const formatRaw = params.get('format');

    if (!text) {
        return jsonResponse({
            error: 'missing text parameter',
            usage: 'GET /encode?text=hello&format=base64',
            formats: [...FORMATS],
        }, 400);
    }

    if (text.length > MAX_INPUT_LENGTH) {
        return jsonResponse({ error: `text too long (max ${MAX_INPUT_LENGTH} characters)` }, 413);
    }

    const format = parseFormat(formatRaw);
    if (!format) {
        return jsonResponse({
            error: `invalid or missing format: '${formatRaw ?? ''}'`,
            formats: [...FORMATS],
        }, 400);
    }

    try {
        const result = encode(text, format);
        return jsonResponse({ input: text, format, result });
    } catch (e) {
        console.error('[GET /encode] error:', e);
        return jsonResponse({ error: 'encoding failed', format }, 500);
    }
}

/** GET /decode — 디코딩 */
export function handleDecode(request: Request): Response {
    const params = new URL(request.url).searchParams;
    const data = params.get('data');
    const formatRaw = params.get('format');

    if (!data) {
        return jsonResponse({
            error: 'missing data parameter',
            usage: 'GET /decode?data=aGVsbG8=&format=base64',
            formats: [...FORMATS],
        }, 400);
    }

    if (data.length > MAX_INPUT_LENGTH) {
        return jsonResponse({ error: `data too long (max ${MAX_INPUT_LENGTH} characters)` }, 413);
    }

    const format = parseFormat(formatRaw);
    if (!format) {
        return jsonResponse({
            error: `invalid or missing format: '${formatRaw ?? ''}'`,
            formats: [...FORMATS],
        }, 400);
    }

    try {
        const result = decode(data, format);
        return jsonResponse({ input: data, format, result });
    } catch (e: any) {
        const msg = e?.message || 'decoding failed';
        return jsonResponse({ error: msg, format }, 400);
    }
}
