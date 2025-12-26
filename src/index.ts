export interface Env {
  DEAD_DROP: KVNamespace;
  API_KEY?: string;
}
import { SETUP_SH } from './cli/setup_script';
import OPENAPI from './openapi';
 

const DOCS_HTML = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dead Drop API Docs</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  import { SETUP_SH } from './cli/setup_script';
  import OPENAPI from './openapi';

  // Root and /docs will return OpenAPI JSON to keep design+function expressed in the spec.
  const OPENAPI_JSON = JSON.stringify(OPENAPI);
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const jsonResponse = (obj: any, status = 200) => {
      return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
    };

    // If env.API_KEY is set, require Bearer token for API endpoints (/store, /read)
    const requireAuth = (request: Request, env: Env, pathname: string) => {
      if (!env.API_KEY) return null; // auth not enabled
      // only protect API endpoints
      if (!(pathname === '/store' || pathname.startsWith('/read/'))) return null;
      const auth = (request.headers.get('authorization') || '').trim();
      if (auth.toLowerCase().startsWith('bearer ')) {
        const token = auth.slice(7).trim();
        if (token === env.API_KEY) return null;
      }
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json', ...defaultCorsHeaders } });
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: defaultCorsHeaders });
    }

    // authentication (optional): if env.API_KEY is set, require Bearer token
    const authFail = requireAuth(request, env, pathname);
    if (authFail) return authFail;

    export interface Env {
      DEAD_DROP: KVNamespace;
      API_KEY?: string;
    }
    import { SETUP_SH } from './cli/setup_script';
    import OPENAPI from './openapi';

    const MAX_MESSAGE_LENGTH = 2000; // max characters allowed for stored messages

    const DOCS_HTML = `<!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dead Drop API — Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
        <style>
          body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
          header { background: #0b1220; color: #ecfeff; padding: 18px 24px; display:flex;align-items:center;justify-content:space-between }
          header h1 { margin:0; font-size:18px }
          header .install { font-size:13px; opacity:0.85 }
          #swagger-ui { margin: 0; }
          .note { padding: 8px 24px; background:#f8fafc; color:#0b1220; font-size:13px }
