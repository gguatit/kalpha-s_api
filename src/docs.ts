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
      <li>데이터 저장소: Workers KV (`DEAD_DROP` 네임스페이스)</li>
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
  -d '{"message":"내 비밀번호는 1234"}'</code></pre>
    <button id="c1-btn" class="btn" onclick="copyCode('c1')">복사</button>

    <p>JavaScript (브라우저) 예시:</p>
    <pre id="js1"><code>const res = await fetch('https://api.kalpha.kr/store', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: '비밀'})
});
const data = await res.json();
console.log(data); // { id: '...', ttl_seconds: 3600 }</code></pre>
    <button id="js1-btn" class="btn" onclick="copyCode('js1')">복사</button>
  </section>

  <section>
    <h3>GET /read/:id</h3>
    <p>발급된 <code>id</code>로 한 번만 조회 가능합니다. 조회와 동시에 KV에서 삭제됩니다.</p>
    <p>성공 응답: <code>200 OK</code> — JSON: <code>{"message":"..."}</code></p>
    <p>실패 응답: <code>404 Not Found</code> — 이미 읽었거나 만료된 ID</p>

    <p>curl 예시:</p>
    <pre id="c2"><code>curl -i https://api.kalpha.kr/read/&lt;UUID&gt;</code></pre>
    <button id="c2-btn" class="btn" onclick="copyCode('c2')">복사</button>

    <p>JavaScript 예시:</p>
    <pre id="js2"><code>const res = await fetch('https://api.kalpha.kr/read/' + id);
if(res.ok){
  const obj = await res.json();
  console.log(obj.message);
} else {
  console.error('Not found or already read');
}</code></pre>
    <button id="js2-btn" class="btn" onclick="copyCode('js2')">복사</button>
  </section>

  <section>
    <h2>응답 예시</h2>
    <pre id="r1"><code>// POST /store 성공
{"id":"b2d6-...","ttl_seconds":3600}

// GET /read/:id 성공
{"message":"내 비밀번호는 1234"}

// 오류
{"error":"missing message"}
{"error":"not found or already read"}</code></pre>
    <button id="r1-btn" class="btn" onclick="copyCode('r1')">복사</button>
  </section>

  <section>
    <h2>실전 운영 권장사항</h2>
    <ul>
      <li><strong>전달 보안:</strong> 발급된 ID는 민감 정보입니다. 메시지를 전달할 때는 TLS 채널(예: HTTPS 링크, 암호화된 메시지) 사용을 권장합니다.</li>
      <li><strong>인증:</strong> 공개 엔드포인트이므로 운영 환경에서는 최소한의 인증(Bearer 토큰, API key)을 추가하세요.</li>
      <li><strong>원자성 고려:</strong> 현재 구현은 KV의 get → delete 순으로 동작합니다. 동시성 경합으로 동일 메시지가 두 번 읽힐 가능성이 있어 엄격한 원자성이 필요하면 Durable Object를 권장합니다.</li>
      <li><strong>길이/요청 제한:</strong> 메시지 길이 제한과 레이트 리밋을 적용해 남용을 방지하세요.</li>
    </ul>
  </section>

  <section>
    <h2>테스트 체크리스트</h2>
    <ol>
      <li>POST /store로 메시지 저장 → 201, id 획득</li>
      <li>GET /read/:id로 메시지 조회 → 200, 메시지 확인</li>
      <li>동일 id로 다시 조회 → 404</li>
      <li>옵션: CORS 정책 확인(브라우저에서 fetch 테스트)</li>
    </ol>
  </section>

  <footer style="margin-top:24px;font-size:13px;color:#666">문서 수정이나 예시 추가를 원하시면 알려주세요.</footer>
</body>
</html>`;
