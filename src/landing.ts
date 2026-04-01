export const LANDING_HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Services</title>
  <style>
    :root {
      --bg-color: #f5f5f5;
      --text-color: #111111;
      --acc-color: #333333;
      --border-color: #dcdcdc;
      --white: #ffffff;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
    }
    header {
      background-color: var(--white);
      padding: 2rem;
      border-bottom: 1px solid var(--border-color);
      text-align: center;
    }
    header h1 {
      margin: 0 0 1rem 0;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    header p {
      margin: 0;
      color: #666;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
    .section {
      background-color: var(--white);
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    .section h2 {
      margin-top: 0;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: var(--acc-color);
      color: var(--white);
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: background-color 0.2s ease;
      border: none;
      cursor: pointer;
    }
    .btn:hover {
      background-color: #000000;
    }
    .btn-secondary {
      background-color: var(--white);
      color: var(--acc-color);
      border: 1px solid var(--acc-color);
    }
    .btn-secondary:hover {
      background-color: #f0f0f0;
      color: #000000;
    }
    .api-endpoint {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
      padding: 1.5rem;
      background-color: #fafafa;
      border: 1px solid #eeeeee;
      border-radius: 4px;
    }
    .api-endpoint h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    .code-block {
      background-color: #222;
      color: #f8f8f8;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: monospace;
      margin: 0;
    }
    .form-group {
      display: flex;
      gap: 1rem;
    }
    input[type="text"] {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    @media (max-width: 600px) {
      .form-group {
        flex-direction: column;
      }
    }
    pre.resultBox {
      margin-top: 1rem;
      display: none;
    }
  </style>
</head>
<body>

  <header>
    <h1>API Services</h1>
    <p>A collection of robust APIs including Dead Drops, IP Geolocation, QR generation, Format Conversion, and more.</p>
    <div style="margin-top: 1.5rem;">
      <a href="/docs" class="btn">View API Documentation</a>
    </div>
  </header>

  <div class="container">
    <div class="section">
      <h2>Introduction</h2>
      <p>Welcome to our API service platform. This project provides multiple utility endpoints engineered for high performance on Cloudflare Workers. You can monitor your requests, secure data via one-time Dead Drops, retrieve IP information, and generate QR codes easily.</p>
      <p>Explore the interactive demos below or visit the detailed documentation to see all available methods, capabilities, and request formats.</p>
    </div>

    <div class="section">
      <h2>Live Demos</h2>
      
      <!-- IP API Demo -->
      <div class="api-endpoint">
        <h3>IP Information (GET /ip/simple)</h3>
        <p>Retrieve your current public IP address in plain text.</p>
        <button class="btn btn-secondary" onclick="testApi('/ip/simple', 'ipResult')">Run Test</button>
        <pre id="ipResult" class="code-block resultBox"></pre>
      </div>

      <!-- QR Demo -->
      <div class="api-endpoint">
        <h3>Generate QR Code (GET /qr)</h3>
        <p>Create a QR code in SVG format for a specified input string.</p>
        <div class="form-group">
          <input type="text" id="qrInput" value="https://example.com" placeholder="Enter text or URL">
          <button class="btn" onclick="testQR()">Generate</button>
        </div>
        <div id="qrResult" style="margin-top: 1rem; display: none; padding: 1rem; background: #fff; border: 1px solid var(--border-color); text-align: center;"></div>
      </div>

      <!-- Encode Demo -->
      <div class="api-endpoint">
        <h3>Base64 Encode (GET /encode)</h3>
        <p>Encode a string to Base64 format.</p>
        <div class="form-group">
          <input type="text" id="encodeInput" value="Hello World" placeholder="Enter text to encode">
          <button class="btn" onclick="testEncode()">Encode</button>
        </div>
        <pre id="encodeResult" class="code-block resultBox"></pre>
      </div>

    </div>
  </div>

  <script>
    async function testApi(url, resultId) {
      const resBox = document.getElementById(resultId);
      resBox.style.display = 'block';
      resBox.textContent = 'Loading...';
      try {
        const response = await fetch(url);
        const text = await response.text();
        
        try {
          const json = JSON.parse(text);
          resBox.textContent = JSON.stringify(json, null, 2);
        } catch {
          resBox.textContent = text;
        }
      } catch (err) {
        resBox.textContent = 'Error: ' + err.message;
      }
    }

    async function testQR() {
      const input = document.getElementById('qrInput').value;
      const resBox = document.getElementById('qrResult');
      resBox.style.display = 'block';
      resBox.innerHTML = 'Loading...';
      try {
        const url = '/qr?data=' + encodeURIComponent(input);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch QR');
        const svg = await response.text();
        resBox.innerHTML = svg;
      } catch (err) {
        resBox.textContent = 'Error: ' + err.message;
      }
    }

    async function testEncode() {
      const input = document.getElementById('encodeInput').value;
      const url = '/encode?data=' + encodeURIComponent(input);
      testApi(url, 'encodeResult');
    }
  </script>
</body>
</html>
`;
