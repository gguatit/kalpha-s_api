/** Swagger UI 기반 API 문서 HTML 페이지 */
export const DOCS_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kalpha's API — Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
      header { background: #0b1220; color: #ecfeff; padding: 18px 24px; display:flex;align-items:center;justify-content:space-between }
      header h1 { margin:0; font-size:18px }
      #swagger-ui { margin: 0; }
      .note { padding: 8px 24px; background:#f8fafc; color:#0b1220; font-size:13px }
      .policy { padding: 12px 24px; background:#fef3c7; color:#92400e; font-size:13px; border-bottom:1px solid #fcd34d }
      .policy a { color:#92400e; font-weight:600 }
    </style>
  </head>
  <body>
    <header>
      <h1>Kalpha's API</h1>
    </header>
    <div class="policy">📋 <strong>이용 안내</strong>: 본 API를 서비스에 사용하시려면 <a href="mailto:dev@kalpha.kr">dev@kalpha.kr</a>으로 서비스명과 사용 방식을 알려주세요.</div>
    <div class="note">이 문서는 서버에서 제공하는 <strong>/openapi.json</strong>을 사용합니다. 인증(Bearer)을 사용하는 배포에서는 상단 Authorize 버튼을 사용하세요.</div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        tryItOutEnabled: true,
        docExpansion: 'none',
        deepLinking: true
      });
    </script>
  </body>
</html>`;
