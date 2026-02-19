# Kalpha's API

실용적인 공개 API 모음 — Cloudflare Workers 기반으로 빠르고 안정적입니다.

📄 **API 문서**: [https://api.kalpha.kr/docs](https://api.kalpha.kr/docs)

---

## 제공 API

| API | 설명 |
|-----|------|
| **Dead Drop** | 한 번만 읽을 수 있는 임시 비밀 메시지 저장소 |
| **IP Info** | 요청자의 IP 주소 및 지리/네트워크 정보 조회 |
| **QR Code** | QR 코드 생성 (SVG/JSON, WiFi·vCard·이메일 등 지원) |

---

## Dead Drop API

한 번 읽으면 즉시 삭제되는 일회용 비밀 메시지를 저장하고 공유합니다.

### 메시지 저장

```bash
# JSON 바디로 저장
curl -X POST https://api.kalpha.kr/store \
  -H "Content-Type: application/json" \
  -d '{"message":"비밀 메시지입니다"}'

# 또는 텍스트 바디로 저장
echo "secret" | curl -X POST https://api.kalpha.kr/store \
  -H "Content-Type: text/plain" --data-binary @-
```

**응답:**
```json
{ "id": "550e8400-e29b-41d4-a716-446655440000" }
```

### 메시지 읽기

```bash
curl https://api.kalpha.kr/read/<id>
```

**응답:**
```json
{ "message": "비밀 메시지입니다" }
```

> ⚠️ 메시지는 **한 번 읽으면 즉시 삭제**됩니다. 저장 후 1시간이 지나면 자동 만료됩니다.

### 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/store` | 메시지 저장 (JSON 또는 plain text) |
| `GET` | `/read/{id}` | 메시지 읽기 및 즉시 삭제 |

---

## IP Info API

요청자의 IP 주소와 함께 국가, 도시, ISP, 위경도, 타임존 등의 정보를 반환합니다. Cloudflare 엣지 네트워크가 제공하는 데이터를 사용하므로 외부 API 호출이 없고 매우 빠릅니다.

### 전체 IP 정보 조회

```bash
curl https://api.kalpha.kr/ip
```

**응답:**
```json
{
  "ip": "203.0.113.1",
  "country": "KR",
  "city": "Seoul",
  "region": "Seoul",
  "regionCode": "11",
  "latitude": 37.566,
  "longitude": 126.978,
  "timezone": "Asia/Seoul",
  "postalCode": "04524",
  "asn": 4766,
  "isp": "Korea Telecom",
  "continent": "AS",
  "httpProtocol": "HTTP/2",
  "tls": "TLSv1.3",
  "userAgent": "curl/8.0.0"
}
```

### IP 주소만 조회

터미널이나 스크립트에서 간편하게 사용:

```bash
curl https://api.kalpha.kr/ip/simple
# 출력: 203.0.113.1
```

### 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/ip` | 전체 IP 정보 (JSON) |
| `GET` | `/ip/simple` | IP 주소만 (텍스트) |

---

## QR Code API

텍스트, URL, WiFi, 연락처 등 다양한 데이터를 QR 코드로 변환합니다. SVG 이미지 또는 JSON 매트릭스로 출력합니다.

### 기본 사용

```bash
# 텍스트/URL → QR 코드 (SVG 이미지)
curl "https://api.kalpha.kr/qr?data=https://kalpha.kr" -o qr.svg

# 색상/크기 커스터마이즈
curl "https://api.kalpha.kr/qr?data=hello&color=%231e40af&bg=%23f0f9ff&size=500" -o qr.svg

# JSON 매트릭스 출력
curl "https://api.kalpha.kr/qr?data=hello&format=json"
```

### 구조화된 데이터 타입

```bash
# WiFi QR 코드 (스마트폰으로 스캔하면 자동 연결)
curl "https://api.kalpha.kr/qr?type=wifi&ssid=MyWiFi&password=1234&encryption=WPA" -o wifi.svg

# 연락처 (vCard)
curl "https://api.kalpha.kr/qr?type=vcard&name=Hong Gildong&phone=010-1234-5678&email=hong@example.com" -o contact.svg

# 이메일
curl "https://api.kalpha.kr/qr?type=email&to=dev@kalpha.kr&subject=Hello" -o email.svg

# 전화
curl "https://api.kalpha.kr/qr?type=phone&number=010-1234-5678" -o phone.svg

# SMS
curl "https://api.kalpha.kr/qr?type=sms&number=010-1234-5678&message=안녕하세요" -o sms.svg

# 위치 (위도/경도)
curl "https://api.kalpha.kr/qr?type=geo&lat=37.5660&lng=126.9784" -o location.svg
```

### 옵션

| 파라미터 | 기본값 | 설명 |
|-----------|--------|------|
| `data` | - | 인코딩할 텍스트 또는 URL |
| `type` | `text` | 데이터 타입 (text, wifi, email, phone, sms, geo, vcard) |
| `format` | `svg` | 출력 형식 (svg, json) |
| `size` | `300` | 이미지 크기 (50-1000px) |
| `color` | `#000000` | QR 코드 색상 |
| `bg` | `#ffffff` | 배경 색상 |
| `ecl` | `M` | 오류 정정 레벨 (L, M, Q, H) |
| `margin` | `2` | 여백 (0-10) |

### 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/qr` | QR 코드 생성 (SVG 또는 JSON) |

---

## 인증

배포 환경에서 `API_KEY`를 설정하면 `POST /store` 및 `GET /read/{id}` 요청에 Bearer 토큰 인증을 요구할 수 있습니다.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.kalpha.kr/store ...
```

> IP Info API(`/ip`, `/ip/simple`)는 인증 없이 사용 가능합니다.

---

## 기타 엔드포인트

| 경로 | 설명 |
|------|------|
| `GET /openapi.json` | OpenAPI 3.0 JSON 사양 |
| `GET /docs` 또는 `/` | Swagger UI 기반 API 문서 |

---

## 개발자 안내

### 프로젝트 구조

```
src/
├── index.ts          # 메인 라우터
├── types.ts          # Env 인터페이스
├── helpers.ts        # 상수, CORS, jsonResponse 헬퍼
├── auth.ts           # Bearer 토큰 인증
├── ratelimit.ts      # IP 기반 Rate Limiter
├── docs.ts           # Swagger UI HTML 템플릿
├── openapi.ts        # OpenAPI 스펙
└── handlers/
    └── ip.ts         # IP Info API 핸들러
```

### 로컬 개발

```bash
npm install
npm run dev          # wrangler dev 실행
```

### 배포

```bash
npm run deploy       # wrangler deploy
```

### 타입 체크

```bash
npm run typecheck    # tsc --noEmit
```

---

## Rate Limiting

모든 엔드포인트에 **IP 기반 Rate Limiting**이 적용됩니다 (60초당 60회).
초과 시 `429 Too Many Requests`를 반환합니다.

---

## 이용 정책

본 API를 서비스에 사용하시려면, 아래 내용을 **dev@kalpha.kr**로 보내주세요:

- **서비스명** — 어떤 서비스/프로젝트에서 사용하는지
- **사용 방식** — 어떤 엔드포인트를 어떤 용도로 사용하는지
- **예상 트래픽** — 대략적인 요청 빈도

개인 테스트 및 학습 목적 사용은 별도 연락 없이 가능합니다.

---

## 기여 및 문의

- 버그 리포트나 개선 제안은 이 저장소의 이슈로 보내주세요.
- 기술 문의: dev@kalpha.kr

## 라이선스

MIT License — [LICENSE](./LICENSE) 참조
