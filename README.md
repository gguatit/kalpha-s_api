# kalpha-s_api

Dead Drop — 1회용 암호화 비밀 메시지 저장소 (Cloudflare Workers + KV)

구현 요약
- POST `/store` : 비밀 메시지를 받아 UUID 발급, Workers KV에 저장 (TTL 1시간)
- GET `/read/:id` : 해당 ID로 메시지 반환 후 즉시 KV에서 삭제(한 번만 열람 가능)

추가 보강 (현재 코드 기준)
- 응답 헤더: `POST /store`는 생성된 `id`를 JSON 본문 외에 `Location`과 `X-DeadDrop-Id` 응답 헤더로도 제공합니다. `curl -i`로 호출하면 헤더에서 id를 바로 확인할 수 있습니다.
- 선택적 인증: 배포 환경에 `API_KEY`(Worker 환경 변수 또는 비밀) 를 설정하면 `Authorization: Bearer <API_KEY>` 헤더가 없으면 `/store` 및 `/read/:id` 접근이 차단됩니다(기본은 인증 없음).
- 메시지 길이 제한: 저장되는 메시지는 기본 최대 2000자(`MAX_MESSAGE_LENGTH`)로 제한됩니다.

주의 및 권장사항
- 현재 저장소는 Workers KV를 사용하며 `get` 후 `delete` 방식으로 읽기-삭제를 수행합니다. 이 방식은 완전한 원자성을 보장하지 않으므로 동시 읽기 상황에서 두 번 이상 읽힐 가능성이 있습니다. 원자성이 필요하면 Durable Object로 전환을 권장합니다.
- 공개 API로 둘 경우 스팸·남용 위험이 있으니 인증, 레이트리밋, 길이 제한을 적용하세요.
- 민감한 메시지를 운영자가 볼 수 없게 하려면 클라이언트 측에서 종단간 암호화(E2EE)를 적용해 암호문만 저장하시기 바랍니다.

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
- 저장 (응답 헤더에 id 포함):

```bash
# Example (deployed):
curl -i -X POST https://api.kalpha.kr/store \
	-H "Content-Type: application/json" \
	-d '{"message":"내 비밀번호는 1234"}'

# Local dev (run `npm run dev` first)
curl -i -X POST http://127.0.0.1:8787/store \
	-H "Content-Type: application/json" \
	-d '{"message":"내 비밀번호는 1234"}'
```

- 읽기 (한 번만 가능):

```bash
curl -i https://api.kalpha.kr/read/<UUID>
```

-- 인증이 활성화된 경우 (배포에 `API_KEY` 설정)

```bash
curl -i -X POST https://api.kalpha.kr/store \
	-H "Authorization: Bearer $API_KEY" \
	-H "Content-Type: application/json" \
	-d '{"message":"비밀메시지"}'
```
