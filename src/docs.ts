/** Swagger UI 기반 API 문서 HTML 페이지 (다크/라이트 모드 지원) */
export const DOCS_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kalpha's API — Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
      :root {
        --bg: #ffffff;
        --bg-secondary: #f8fafc;
        --text: #0b1220;
        --header-bg: #0b1220;
        --header-text: #ecfeff;
        --policy-bg: #fef3c7;
        --policy-text: #92400e;
        --policy-border: #fcd34d;
        --note-bg: #f8fafc;
        --note-text: #0b1220;
      }
      html.dark {
        --bg: #0f172a;
        --bg-secondary: #1e293b;
        --text: #e2e8f0;
        --header-bg: #020617;
        --header-text: #ecfeff;
        --policy-bg: #422006;
        --policy-text: #fbbf24;
        --policy-border: #92400e;
        --note-bg: #1e293b;
        --note-text: #94a3b8;
      }
      * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
      body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background: var(--bg); color: var(--text); }
      header { background: var(--header-bg); color: var(--header-text); padding: 18px 24px; display:flex;align-items:center;justify-content:space-between }
      header h1 { margin:0; font-size:18px }
      #swagger-ui { margin: 0; }
      .note { padding: 8px 24px; background: var(--note-bg); color: var(--note-text); font-size:13px }
      .policy { padding: 12px 24px; background: var(--policy-bg); color: var(--policy-text); font-size:13px; border-bottom:1px solid var(--policy-border) }
      .policy a { color: var(--policy-text); font-weight:600 }

      /* 토글 스위치 */
      .theme-toggle { background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; }
      .toggle-track {
        width: 44px; height: 24px; background: #334155;
        border-radius: 12px; position: relative; transition: background 0.3s;
      }
      html.dark .toggle-track { background: #475569; }
      .toggle-handle {
        width: 18px; height: 18px; border-radius: 50%;
        background: #fbbf24; position: absolute; top: 3px; left: 3px;
        transition: transform 0.3s, background 0.3s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      html.dark .toggle-handle { transform: translateX(20px); background: #818cf8; }

      /* 다크모드 Swagger UI 오버라이드 */
      html.dark .swagger-ui,
      html.dark .swagger-ui .wrapper { background: var(--bg); }
      html.dark .swagger-ui .topbar { display: none; }
      html.dark .swagger-ui .info .title,
      html.dark .swagger-ui .info p,
      html.dark .swagger-ui .info li,
      html.dark .swagger-ui .info a,
      html.dark .swagger-ui .scheme-container,
      html.dark .swagger-ui .opblock-tag,
      html.dark .swagger-ui .opblock-tag a,
      html.dark .swagger-ui .opblock-tag small,
      html.dark .swagger-ui .opblock-summary-description,
      html.dark .swagger-ui .opblock-description-wrapper,
      html.dark .swagger-ui .opblock-description-wrapper p,
      html.dark .swagger-ui .response-col_description__inner p,
      html.dark .swagger-ui .response-col_description__inner,
      html.dark .swagger-ui .parameter__name,
      html.dark .swagger-ui .parameter__type,
      html.dark .swagger-ui .parameter__in,
      html.dark .swagger-ui .response-col_status,
      html.dark .swagger-ui .response-col_links,
      html.dark .swagger-ui table thead tr td,
      html.dark .swagger-ui table thead tr th,
      html.dark .swagger-ui .model-title,
      html.dark .swagger-ui .model,
      html.dark .swagger-ui .model-toggle::after,
      html.dark .swagger-ui section.models h4,
      html.dark .swagger-ui .tab li,
      html.dark .swagger-ui .opblock-section-header h4,
      html.dark .swagger-ui label,
      html.dark .swagger-ui .btn { color: #e2e8f0; }
      html.dark .swagger-ui .scheme-container { background: var(--bg-secondary); box-shadow: none; }
      html.dark .swagger-ui .opblock-section-header { background: var(--bg-secondary); }
      html.dark .swagger-ui section.models { border: 1px solid #334155; }
      html.dark .swagger-ui section.models.is-open h4 { border-bottom: 1px solid #334155; }
      html.dark .swagger-ui .opblock .opblock-summary { border-color: #334155; }
      html.dark .swagger-ui input[type=text],
      html.dark .swagger-ui textarea,
      html.dark .swagger-ui select { background: #1e293b; color: #e2e8f0; border-color: #475569; }
      html.dark .swagger-ui .opblock .opblock-section-header { box-shadow: none; }
      html.dark .swagger-ui .responses-inner { background: var(--bg); }
      html.dark .swagger-ui .highlight-code,
      html.dark .swagger-ui .microlight { background: #1e293b !important; color: #e2e8f0 !important; }
      html.dark .swagger-ui .copy-to-clipboard { filter: invert(0.8); }
    </style>
  </head>
  <body>
    <header>
      <h1>Kalpha's API</h1>
      <button class="theme-toggle" id="themeToggle" aria-label="테마 전환">
        <div class="toggle-track"><div class="toggle-handle"></div></div>
      </button>
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
      var html = document.documentElement;
      var saved = localStorage.getItem('theme');
      function setTheme(dark) {
        html.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      }
      if (saved) { setTheme(saved === 'dark'); }
      else { setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches); }
      document.getElementById('themeToggle').addEventListener('click', function() {
        setTheme(!html.classList.contains('dark'));
      });
    </script>
  </body>
</html>`;
