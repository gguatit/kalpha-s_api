# Dead Drop API (kalpha-s_api)

이 저장소는 한 번만 읽을 수 있는 임시 비밀 메시지 저장소 API인 "Dead Drop"의 서버 및 개발용 코드입니다.

요약
- 단일 사용자가 저장한 메시지를 한 번만 읽을 수 있도록 생성된 ID로 접근하여 즉시 삭제합니다.
- OpenAPI 사양(`src/openapi.ts`)을 제공하며 `/docs`(Swagger UI)를 통해 문서를 확인할 수 있습니다.

빠른 시작

1. 메시지 저장 예:

```bash
# JSON 바디로 저장
curl -X POST https://api.kalpha.kr/store -H "Content-Type: application/json" -d '{"message":"hello"}'

# 또는 텍스트 바디로 저장
echo "secret" | curl -X POST https://api.kalpha.kr/store -H "Content-Type: text/plain" --data-binary @-
```

2. 메시지 읽기 예:

```bash
curl https://api.kalpha.kr/read/<id>
```

주요 엔드포인트
- `POST /store` : 메시지 저장 (요청 본문: JSON `{message}` 또는 plain text). 응답으로 `id` 및 `Location` 헤더 제공.
- `GET /read/{id}` : 저장한 메시지 읽기 및 즉시 삭제 (single-use).
- `GET /openapi.json` : OpenAPI JSON 사양 제공.
- `GET /docs` 또는 `/` : Swagger UI 기반 문서 페이지 제공.

인증
- 배포 환경에서 `API_KEY`를 설정하면 `POST /store` 및 `GET /read/{id}` 요청에 Bearer 토큰 인증을 요구할 수 있습니다.

개발자 안내
- 코드 진입점: `src/index.ts`
- OpenAPI 구성: `src/openapi.ts`

기여 및 문의
- 버그 리포트나 개선 제안은 이 저장소의 이슈로 보내주세요.
- 기술 문의: dev@kalpha.kr

라이선스
- 별도 표기 없으면 내부 프로젝트 규정에 따릅니다. 필요 시 라이선스 파일을 추가하세요.
