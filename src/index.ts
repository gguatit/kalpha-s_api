export interface Env {
  DEAD_DROP: KVNamespace;
  API_KEY?: string;
}
 

const DOCS_HTML = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dead Drop API Docs</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="wrap">
    <header class="header">
      <div class="logo"><span class="mark"></span><div><h1>Dead Drop</h1><div class="subtitle">한 번만 읽을 수 있는 일회성 비밀 메시지 저장소</div></div></div>
      <div class="meta"><span class="badge">TTL 1시간</span></div>
    </header>

    <div class="layout">
      <aside class="panel">
        <nav>
          <ul>
            <li><a href="#endpoints">Endpoints</a></li>
            <li><a href="#examples">Examples</a></li>
            <li><a href="#responses">Responses</a></li>
            <li><a href="#ops">Operational</a></li>
          </ul>
        </nav>
      </aside>

      <main>
        <section class="panel" id="endpoints">
          <h2>Endpoints</h2>
          <p class="muted">간단히: POST <code>/store</code> → 저장(1시간), GET <code>/read/:id</code> → 한 번만 읽기</p>
          <h3>POST /store</h3>
          <p>요청: <code>Content-Type: application/json</code>, body: <code>{"message":"..."}</code></p>
          <pre id="post-example">curl -i -X POST https://api.kalpha.kr/store \
  -H "Content-Type: application/json" \
  -d '{"message":"내 비밀번호는 1234"}'</pre>
          <button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('post-example').innerText)">복사</button>

          <h3>GET /read/:id</h3>
          <p>발급된 ID로 한 번만 조회, 조회 즉시 삭제</p>
          <pre id="get-example">curl -i https://api.kalpha.kr/read/&lt;UUID&gt;</pre>
          <button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('get-example').innerText)">복사</button>
        </section>

        <section class="panel" id="examples">
          <h2>Examples</h2>
          <pre id="js-example">const res = await fetch('https://api.kalpha.kr/store', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'비밀'})});const j=await res.json();console.log(j);</pre>
          <button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('js-example').innerText)">복사</button>
          <h4>Local</h4>
          <pre id="local-example">curl -i -X POST http://127.0.0.1:8787/store -H "Content-Type: application/json" -d '{"message":"test"}'</pre>
          <button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('local-example').innerText)">복사</button>
        </section>

        <section class="panel" id="responses">
          <h2>Responses</h2>
          <p class="muted">응답은 간단하고 예측 가능합니다. 아래 예시에서는 본문(JSON)과 관련 응답 헤더를 함께 보여줍니다.</p>
          <h4>POST /store (성공)</h4>
          <pre>// HTTP 201
      {"id":"..."}

      # 응답 헤더 예시
      Location: https://api.kalpha.kr/read/&lt;id&gt;
      X-DeadDrop-Id: &lt;id&gt;</pre>

          <h4>GET /read/:id (성공)</h4>
          <pre>// HTTP 200
      {"message":"..."}</pre>

          <h4>오류</h4>
          <pre>// 400 잘못된 요청
      {"error":"missing message"}

      // 404 찾을 수 없거나 이미 읽힘
      {"error":"not found or already read"}

      // 401 인증 실패 (env.API_KEY 설정 시)
      {"error":"unauthorized"}

      // 413 메시지 길이 초과
      {"error":"message too long"}</pre>
        </section>

        <section class="panel" id="ops">
          <h2>Operational notes</h2>
          <ul>
            <li>운영환경에서는 인증(Bearer token 등)을 권장합니다.</li>
            <li>원자성이 필요하면 Durable Object 고려.</li>
            <li>레이트리밋/길이 제한 적용 권장.</li>
          </ul>
        </section>
      </main>
    </div>

    <footer>문의/개선 요청: repository 관리자에게 연락하세요.</footer>
  </div>
</body>
</html>`;
const DOCS_CSS = `:root{--bg:#0f172a;--card:#0b1220;--muted:#94a3b8;--accent:#06b6d4;--white:#ecfeff}
*{box-sizing:border-box}
html,body{height:100%}
.body-fix-note{}
.wrap{width:100%;max-width:1100px;margin:0 auto;padding:28px}
/* body background fixed to avoid color banding at the bottom when scrolling */
body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:36px 12px 24px;background-color:var(--bg);background:linear-gradient(180deg,#071029 0%, #021120 100%);background-attachment:fixed;color:var(--white);overflow-x:hidden;overflow-y:auto}
.header{display:flex;align-items:center;justify-content:space-between;gap:16px}
.logo{display:flex;align-items:center;gap:12px}
.logo .mark{width:44px;height:44px;background:linear-gradient(135deg,#06b6d4,#60a5fa);border-radius:8px;display:inline-block}
h1{margin:0;font-size:20px}
.subtitle{color:var(--muted);font-size:13px;margin-top:6px}
.layout{display:grid;grid-template-columns:270px 1fr;gap:20px;margin-top:22px}
.panel{background:rgba(255,255,255,0.04);padding:18px;border-radius:12px;margin:16px 0}
nav ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
nav a{color:var(--white);text-decoration:none;padding:8px 10px;border-radius:8px;display:block}
pre{background:#001018;padding:14px;border-radius:8px;color:#cfeefb;overflow:auto;font-size:13px;white-space:pre-wrap;word-break:break-word}
.muted{color:var(--muted)}
.copy{display:inline-block;margin-left:8px;padding:6px 10px;background:#064e64;color:#e6fffb;border-radius:8px;cursor:pointer;font-size:13px}
.badge{display:inline-block;background:#052f3a;padding:6px 8px;border-radius:8px;color:#a5f3fc;font-size:12px}
footer{margin-top:18px;color:var(--muted);font-size:13px}
@media (max-width:880px){.layout{grid-template-columns:1fr}.logo .mark{display:none}}`;

// Limits
const MAX_MESSAGE_LENGTH = 2000; // max characters allowed for stored messages

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS helper
    const defaultCorsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    if (request.method === 'POST' && pathname === '/store') {
      try {
        const contentType = request.headers.get('content-type') || '';
        let body: any;
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else {
          const text = await request.text();
          body = { message: text };
        }
        const message = body?.message;
        if (!message || typeof message !== 'string') {
          return jsonResponse({ error: 'missing message' }, 400);
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
          return jsonResponse({ error: 'message too long' }, 413);
        }

        const id = crypto.randomUUID();
        await env.DEAD_DROP.put(id, message, { expirationTtl: 3600 });

        // Return JSON body and include headers so `curl -i` shows the id immediately.
        const respBody = JSON.stringify({ id });
        const respHeaders = {
          'content-type': 'application/json',
          'Location': `${url.origin}/read/${id}`,
          'X-DeadDrop-Id': id,
          ...defaultCorsHeaders
        } as Record<string, string>;

        return new Response(respBody, { status: 201, headers: respHeaders });
      } catch (e) {
        return jsonResponse({ error: 'invalid body' }, 400);
      }
    }

    if (request.method === 'GET' && pathname.startsWith('/read/')) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (!id) return jsonResponse({ error: 'missing id' }, 400);

      const message = await env.DEAD_DROP.get(id);
      if (message === null) {
        return jsonResponse({ error: 'not found or already read' }, 404);
      }

      await env.DEAD_DROP.delete(id);
      return jsonResponse({ message }, 200);
    }

    // 문서 페이지: /docs
    if (request.method === 'GET' && pathname === '/docs') {
      return new Response(DOCS_HTML, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...defaultCorsHeaders } });
    }

    // CSS static serve
    if (request.method === 'GET' && pathname === '/styles.css') {
      return new Response(DOCS_CSS, { status: 200, headers: { 'content-type': 'text/css; charset=utf-8', ...defaultCorsHeaders } });
    }

    // 루트 접근 시 바로 문서 페이지 반환 (메인으로 사용)
    if (request.method === 'GET' && pathname === '/') {
      return new Response(DOCS_HTML, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...defaultCorsHeaders } });
    }

    return new Response('Not Found', { status: 404 });
  }
};
