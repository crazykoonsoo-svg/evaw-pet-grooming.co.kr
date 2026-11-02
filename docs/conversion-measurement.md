# 상담 전환 측정 — 2026-11-02

## 집계 기준
- GA4 `generate_lead`: Web3Forms가 HTTP 성공 및 JSON success=true를 반환한 접수. form_type은 consultation 또는 nearby. 문의 내용/성명/전화번호/직접 입력 지역명을 이벤트에 넣지 않는다.
- `lead_submit_success`: 기존 퍼널 진단 이벤트. generate_lead와 합산하지 않는다.
- `form_submit`: 수동 발송 제거. GA4 향상된 측정에서 자동 발생할 수 있으므로 접수 성공 지표로 사용하지 않는다.
- `lead_form_open`, `lead_form_start`, `lead_form_step2`: 해당 퍼널을 지원하는 페이지의 열기/시작/단계 이동 지표.
- `phone_popup`, `kakao_inquiry`, `naver_inquiry`: 팝업/채널 클릭. 통화 연결이나 외부 채널의 실제 상담 접수 증거가 아니다.
- NAVER 구 cnv 방식: 신청 완료는 유형 4. 채널 클릭의 유형 1/2/3 호출 제거. 기존 뉴스/지역 안내 페이지의 NAVER 전환 제외 정책은 유지.

## 검증 범위
`node tests/conversion-tracking.cjs`: 261개 일반 상담 핸들러에 대해 성공, API 거절, HTTP 실패, 동시 제출을 네트워크 모의 응답으로 검사. 실제 접수나 전환 로그는 생성하지 않는다. 측정 라이브러리 오류가 접수 성공 UI를 실패로 바꾸지 않도록 방어.
Google Sheets 보조 저장은 기존 no-cors 전송이므로 저장 성공을 확인할 수 없다. 완료 이벤트는 Web3Forms 접수 기준이다.

## 계정에서 확인할 사항
1. GA4 주요 이벤트는 generate_lead를 기준으로 설정하고 기존 form_submit/lead_submit_success와 중복 합산하지 않는다. 계정 설정은 이 코드 변경으로 바뀌지 않는다.
2. DebugView/실시간에서 정상 접수 1건당 generate_lead 1회 확인. 실접수 테스트에는 사전 합의한 테스트 연락처 사용.
3. NAVER 광고 관리자에서 신청 완료(유형 4) 수집 및 광고 목표를 확인. 변경 전 구매/회원가입/장바구니로 분류된 클릭과 시계열을 직접 비교하지 않는다.
4. GA4 계정 조회 연결 도구가 subscription_required를 반환하여 실제 계정의 주요 이벤트 설정과 수집 수치는 미확인.

## 기준 문서
- https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- https://support.google.com/analytics/answer/9216061?hl=ko
- https://naver.github.io/conversion-tracking/pages/05_cnv_to_trans_guide/
