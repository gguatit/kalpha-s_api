# kalpha-s_api

Dead Drop — 1회용 암호화 비밀 메시지 저장소 (Cloudflare Workers + KV)

구현 요약
- POST `/store` : 비밀 메시지를 받아 UUID 발급, Workers KV에 저장 (TTL 1시간)
- GET `/read/:id` : 해당 ID로 메시지 반환 후 즉시 KV에서 삭제(한 번만 열람 가능)

로컬/배포 준비
1. Cloudflare 계정과 `wrangler`가 필요합니다.
2. KV 네임스페이스 생성:

```bash
wrangler kv:namespace create "DEAD_DROP"
```

3. 생성 후 출력된 `id`를 `wrangler.toml`의 `kv_namespaces` 항목에 복사합니다.

배포
```bash
npm install
# (선택) TypeScript 빌드
npx wrangler publish
```

예시
- 저장:

```bash
# Example (deployed):
curl -X POST https://api.kalpha.kr/store \
	-H "Content-Type: application/json" \
	-d '{"message":"내 비밀번호는 1234"}'

# Local dev (run `npm run dev` first)
curl -X POST http://127.0.0.1:8787/store \
	-H "Content-Type: application/json" \
	-d '{"message":"내 비밀번호는 1234"}'
```

- 읽기:

```bash
curl https://your-worker-kalpha/api/read/<UUID>
```
