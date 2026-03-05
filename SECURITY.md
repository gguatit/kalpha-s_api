# Security

## 처리된 보안 취약점

### 1. Timing Attack — `src/auth.ts`
- **분류**: 인증 우회 (CWE-208)
- **문제**: `crypto.subtle.timingSafeEqual()`은 Web Crypto API 표준에 존재하지 않는 메서드로, 런타임 TypeError 발생 시 인증 전체가 무력화되는 문제가 있었음. 또한 일반 문자열 비교로 fallback 될 경우 timing attack에 노출됨
- **수정**: XOR 루프 기반 constant-time 비교 함수로 직접 구현

---

### 2. SVG Injection (XSS) — `src/handlers/qr.ts`
- **분류**: XSS / Injection (OWASP A03)
- **문제**: `/qr` 엔드포인트의 `color`, `bg` 쿼리 파라미터를 검증 없이 SVG 속성에 직접 삽입. `image/svg+xml`로 서빙되므로 브라우저에서 임의 태그/스크립트 실행 가능
- **수정**: `sanitizeColor()` 함수 추가 — hex 형식(`#rgb` / `#rrggbb` / `#rrggbbaa`)만 허용, 그 외 입력은 기본값(`#000000` / `#ffffff`)으로 대체

---

### 3. SSRF (Server-Side Request Forgery) — `src/handlers/security.ts`
- **분류**: SSRF (OWASP A10)
- **문제**: `/security/headers?url=` 파라미터에 사설 IP, 루프백, 링크 로컬 주소 입력 시 내부 네트워크에 대한 요청이 가능했음 (localhost, 10.x, 192.168.x, 169.254.x 등)
- **수정**: `BLOCKED_HOSTS` 패턴 목록으로 내부망 주소 전면 차단, `ALLOWED_HOSTS` 허용 목록(`kalpha.mmv.kr`, `kalpha.kr` 및 서브도메인)은 차단 전에 우선 통과 처리

---

### 4. score / grade 필드 뒤바뀜 — `src/handlers/security.ts`
- **분류**: 로직 오류 (정보 무결성)
- **문제**: 최종 응답 객체에서 `score`(숫자)와 `grade`(문자열)가 서로 반대 필드에 할당되어 API 응답 의미가 뒤바뀌었음
- **수정**: `score: score`, `grade: grade` 로 올바르게 수정

---

### 5. Observability 설정 충돌 — `wrangler.toml`
- **분류**: 설정 오류 (보안 로그 미수집)
- **문제**: `[observability] enabled = false` 로 설정되어 하위 `[observability.logs]`의 `enabled = true`, `persist = true` 설정이 무효화됨 — 보안 이벤트 로그가 실제로 저장되지 않았음
- **수정**: `[observability] enabled = true` 로 변경하여 로그 영구 저장 활성화
