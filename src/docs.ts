export const DOCS_HTML = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dead Drop API Docs</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,Helvetica;margin:24px;color:#111;line-height:1.5}
    pre{background:#f7fafc;padding:12px;border-radius:8px;overflow:auto}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .btn{display:inline-block;margin-left:8px;padding:6px 10px;border-radius:6px;background:#2563eb;color:#fff;text-decoration:none;font-size:13px}
    .note{background:#fffbeb;border:1px solid #fef3c7;padding:10px;border-radius:6px}
  </style>
  <script>
    function copyCode(id){
      const el = document.getElementById(id);
      if(!el) return;
      navigator.clipboard.writeText(el.innerText).then(()=>{
        const btn = document.getElementById(id+"-btn");
        if(btn){btn.innerText='복사됨'; setTimeout(()=>btn.innerText='복사',1200)}
      });
    }
  </script>
</head>
<body>
  <h1>Dead Drop — API 문서</h1>
  <p>한 번만 읽을 수 있는 일회성 비밀 메시지 저장 서비스입니다. 메시지는 Cloudflare Workers KV에 암호화 없이 저장되며, <strong>한 번 읽으면 즉시 삭제</strong>되어 복구 불가능합니다.</p>

  <section>
    <h2>요약</h2>
    <ul>
      <li>저장 TTL: <strong>3600초(1시간)</strong></li>
      <li>데이터 저장소: Workers KV (<code>DEAD_DROP</code> 네임스페이스)</li>
      <li>주요 엔드포인트: <code>POST /store</code>, <code>GET /read/:id</code></li>
    </ul>
  </section>

  <section>
    <h2>엔드포인트</h2>
    <h3>POST /store</h3>
    <p>요청 바디(내용-type: <code>application/json</code>)에 <code>{"message": "..."}</code>를 보내세요.</p>
    <p>성공 응답: <code>201 Created</code> — JSON: <code>{"id":"<UUID>","ttl_seconds":3600}</code></p>
    <div class="note">주의: 메시지는 생성 후 최대 1시간 동안 보관됩니다. 이 시간 이후에는 복구 불가능합니다.</div>

    <p>curl 예시:</p>
    <pre id="c1"><code>curl -i -X POST https://api.kalpha.kr/store \
  -H "Content-Type: application/json" \
  -d '{"message":"내 비밀번호는 1234"}'

# 로컬 테스트(로컬에서 개발 서버 실행시)
export const DOCS_HTML = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dead Drop API Docs</title>
  <style>
    :root{--bg:#0f172a;--card:#0b1220;--muted:#94a3b8;--accent:#06b6d4;--white:#ecfeff}
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;background:linear-gradient(180deg,#071029 0%, #021120 100%);color:var(--white)}
    .wrap{max-width:1100px;margin:36px auto;padding:28px}
    .header{display:flex;align-items:center;justify-content:space-between;gap:16px}
    .logo{display:flex;align-items:center;gap:12px}
    .logo .mark{width:44px;height:44px;background:linear-gradient(135deg,#06b6d4,#60a5fa);border-radius:8px;display:inline-block}
    h1{margin:0;font-size:20px}
    .subtitle{color:var(--muted);font-size:13px;margin-top:6px}
    .layout{display:grid;grid-template-columns:270px 1fr;gap:20px;margin-top:22px}
    .panel{background:rgba(255,255,255,0.04);padding:18px;border-radius:12px}
    nav ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
    nav a{color:var(--white);text-decoration:none;padding:8px 10px;border-radius:8px;display:block}
    nav a.active, nav a:hover{background:rgba(255,255,255,0.04)}
    .section h2{margin-top:0}
    pre{background:#001018;padding:14px;border-radius:8px;color:#cfeefb;overflow:auto;font-size:13px}
    code{font-family:ui-monospace,Menlo,monospace}
    .muted{color:var(--muted)}
    .copy{display:inline-block;margin-left:8px;padding:6px 10px;background:#064e64;color:#e6fffb;border-radius:8px;cursor:pointer;font-size:13px}
    .badge{display:inline-block;background:#052f3a;padding:6px 8px;border-radius:8px;color:#a5f3fc;font-size:12px}
    footer{margin-top:18px;color:var(--muted);font-size:13px}
    @media (max-width:880px){.layout{grid-template-columns:1fr;}.logo .mark{display:none}}
  </style>
  <script>
    function copyText(id){
      const t=document.getElementById(id); if(!t) return; navigator.clipboard.writeText(t.innerText).then(()=>{const b=document.getElementById(id+'-btn'); if(b){b.innerText='복사됨'; setTimeout(()=>b.innerText='복사',1200)}})
    }
    function navTo(h){document.getElementById(h).scrollIntoView({behavior:'smooth'});}
  </script>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">
        <span class="mark"></span>
        <div>
          <h1>Dead Drop</h1>
          <div class="subtitle">한 번만 읽을 수 있는 일회성 비밀 메시지 저장소</div>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:center"><span class="badge">TTL 1시간</span><a href="/docs" style="color:#aaffff;text-decoration:none">문서</a></div>
    </div>

    <div class="layout">
      <aside class="panel">
        <nav>
          <ul>
            <li><a href="javascript:navTo('endpoints')">Endpoints</a></li>
            <li><a href="javascript:navTo('examples')">Examples</a></li>
            <li><a href="javascript:navTo('responses')">Responses</a></li>
            <li><a href="javascript:navTo('ops')">Operational</a></li>
          </ul>
        </nav>
      </aside>

      <main>
        <div class="panel section" id="endpoints">
          <h2>Endpoints</h2>
          <p class="muted">간단히: POST <code>/store</code> → 저장(1시간), GET <code>/read/:id</code> → 한 번만 읽기</p>

          <h3>POST /store</h3>
          <p>요청: <code>Content-Type: application/json</code>, body: <code>{"message":"..."}</code></p>
          <pre id="post-example">curl -i -X POST https://api.kalpha.kr/store \
  -H "Content-Type: application/json" \
  -d '{"message":"내 비밀번호는 1234"}'</pre>
          <button id="post-example-btn" class="copy" onclick="copyText('post-example')">복사</button>
          <div style="height:12px"></div>

          <h3>GET /read/:id</h3>
          <p>발급된 ID로 한 번만 조회, 조회 즉시 삭제</p>
          <pre id="get-example">curl -i https://api.kalpha.kr/read/&lt;UUID&gt;</pre>
          <button id="get-example-btn" class="copy" onclick="copyText('get-example')">복사</button>
        </div>

        <div class="panel section" id="examples" style="margin-top:18px">
          <h2>Examples</h2>
          <h4>JavaScript (browser)</h4>
          <pre id="js-example">const res = await fetch('https://api.kalpha.kr/store', {
  method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({message:'비밀'})
});
const j = await res.json(); console.log(j);</pre>
          <button id="js-example-btn" class="copy" onclick="copyText('js-example')">복사</button>

          <h4 style="margin-top:12px">Local dev</h4>
          <pre id="local-example"># run: npm run dev
curl -i -X POST http://127.0.0.1:8787/store -H "Content-Type: application/json" -d '{"message":"test"}'</pre>
          <button id="local-example-btn" class="copy" onclick="copyText('local-example')">복사</button>
        </div>

        <div class="panel section" id="responses" style="margin-top:18px">
          <h2>Responses</h2>
          <pre id="resp-example">// POST /store (201)
{"id":"...","ttl_seconds":3600}

// GET /read/:id (200)
{"message":"..."}

// Errors (400/404)
{"error":"missing message"}
{"error":"not found or already read"}</pre>
          <button id="resp-example-btn" class="copy" onclick="copyText('resp-example')">복사</button>
        </div>

        <div class="panel section" id="ops" style="margin-top:18px">
          <h2>Operational notes</h2>
          <ul class="muted">
            <li>이 서비스는 기본 인증을 제공하지 않습니다. 운영 시에는 API key/Bearer 토큰을 권장합니다.</li>
            <li>원자성: 현재는 KV get → delete 순서입니다. 엄격한 원자성이 필요하면 Durable Object 사용을 고려하세요.</li>
            <li>레이트리밋/길이 제한을 적용해 남용을 방지하세요.</li>
          </ul>
        </div>

        <footer><small class="muted">문의/개선 요청: repository 관리자에게 연락하세요.</small></footer>
      </main>
    </div>
  </div>
</body>
</html>`;
