export const tarpitPaths = [
  // Environment & Config
  '/.env', '/.env.example', '/.env.local', '/.env.prod', '/.env.staging', '/.env.backup', '/.env.save',
  '/config.json', '/database.yml', '/docker-compose.yml', '/nginx.conf',

  // WordPress & PHP
  '/wp-admin', '/wp-login.php', '/wp-config.php', '/wp-config.php.bak', '/wp-content/debug.log', '/xmlrpc.php',
  '/phpmyadmin', '/pma', '/phpMyAdmin', '/admin.php',

  // Git & Version Control
  '/.git/config', '/.git/HEAD', '/.gitignore', '/.svn/entries',

  // Admin panels & Dashboards
  '/admin', '/administrator', '/dashboard', '/manager', '/panel',

  // Spring Boot / Java
  '/actuator/env', '/actuator/health', '/actuator/metrics', '/actuator/httptrace',
  '/swagger-ui.html', '/v2/api-docs', '/v3/api-docs',

  // Backups & SQL dumps
  '/backup.zip', '/backup.sql', '/dump.sql', '/db.sql', '/database.sql', '/backup.tar.gz',
  '/api/.env'
];

export function handleTarpit(request: Request): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 첫 번째 청크: HTTP 연결 성공인 척 속이고 JSON 파서를 열기 위해 배열의 시작을 보냄
        controller.enqueue(encoder.encode('{\n  "status": "loading",\n  "data": [\n'));
        
        // 30초 동안 1초 간격으로 의미 없는 가짜 JSON 객체를 계속 전송
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const garbage = `    {"id": ${i}, "hash": "${crypto.randomUUID()}", "status": "pending_validation"},\n`;
          controller.enqueue(encoder.encode(garbage));
        }
        
        // 봇이 끝까지 기다렸다면 배열을 닫아줌
        controller.enqueue(encoder.encode('    {"end": true}\n  ]\n}'));
        controller.close();
      } catch (e) {
        // 클라이언트가 연결을 끊음 (스레드 고갈 및 지연 성공)
        console.error('Tarpit: Bot disconnected early');
      }
    },
    cancel() {
      console.log('Tarpit: Stream canceled');
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Connection': 'keep-alive',
      'X-Tarpit': 'Welcome to the void'
    }
  });
}
