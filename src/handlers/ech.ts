import { jsonResponse } from '../helpers';

interface DnsAnswer {
    name: string;
    type: number;
    TTL: number;
    data: string;
}

interface DnsResponse {
    Status: number;
    Answer?: DnsAnswer[];
    Authority?: DnsAnswer[];
    Additional?: DnsAnswer[];
}

interface EchRecord {
    priority: number;
    targetName: string;
    ech: string;
}

interface EchResult {
    echSupported: boolean;
    publicName: string | null;
    records: EchRecord[];
}

const DNS_OVER_HTTPS_URL = 'https://cloudflare-dns.com/dns-query';

function parseSvcbData(data: string): EchRecord | null {
    const parts = data.split(/\s+/);
    if (parts.length < 2) return null;

    const priority = parseInt(parts[0], 10);
    if (isNaN(priority)) return null;

    const targetName = parts[1];
    let echValue: string | null = null;

    for (let i = 2; i < parts.length; i++) {
        const field = parts[i].toLowerCase();
        if (field.startsWith('ech=')) {
            echValue = parts[i].substring(4);
            if (echValue.startsWith('"') && echValue.endsWith('"')) {
                echValue = echValue.slice(1, -1);
            }
            break;
        }
    }

    if (!echValue) return null;

    return { priority, targetName, ech: echValue };
}

async function queryDnsRecord(domain: string, type: string): Promise<DnsResponse> {
    const url = `${DNS_OVER_HTTPS_URL}?name=${encodeURIComponent(domain)}&type=${type}`;
    const response = await fetch(url, {
        headers: { 'Accept': 'application/dns-json' },
    });

    if (!response.ok) {
        throw new Error(`DNS query failed: ${response.status}`);
    }

    return response.json() as Promise<DnsResponse>;
}

async function checkEchForDomain(domain: string): Promise<EchResult> {
    const [httpsResult, svcbResult] = await Promise.allSettled([
        queryDnsRecord(domain, 'HTTPS'),
        queryDnsRecord(domain, 'SVCB'),
    ]);

    const echRecords: EchRecord[] = [];
    let publicName: string | null = null;

    const processAnswers = (result: PromiseSettledResult<DnsResponse>) => {
        if (result.status !== 'fulfilled') return;
        const dnsResp = result.value;
        if (!dnsResp.Answer) return;

        for (const answer of dnsResp.Answer) {
            const parsed = parseSvcbData(answer.data);
            if (parsed) {
                echRecords.push(parsed);
                if (parsed.targetName !== '.' && !publicName) {
                    publicName = parsed.targetName;
                }
            }
        }
    };

    processAnswers(httpsResult);
    processAnswers(svcbResult);

    const echSupported = echRecords.length > 0;
    if (echSupported && !publicName) {
        publicName = domain;
    }

    return { echSupported, publicName, records: echRecords };
}

export async function handleEchCheck(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain')?.trim().toLowerCase();

    if (!domain) {
        return jsonResponse({ error: 'missing domain parameter' }, 400);
    }

    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
        return jsonResponse({ error: 'invalid domain format' }, 400);
    }

    try {
        const result = await checkEchForDomain(domain);

        return jsonResponse({
            domain,
            echSupported: result.echSupported,
            publicName: result.publicName,
            records: result.records,
        });
    } catch (e) {
        console.error('[GET /security/ech] error:', e);
        return jsonResponse({ error: 'failed to query dns records' }, 502);
    }
}