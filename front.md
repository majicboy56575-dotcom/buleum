# 프론트엔드 현황 문서 (front.md)

최종 업데이트: 2026-05-18

## 1. 기술 스택

| 항목 | 버전 |
| :--- | :--- |
| React | 19.2.5 |
| React Router DOM | 7.14.2 |
| Axios | 1.15.2 |
| Vite | 8.0.10 |
| ESLint | 10.x |

## 2. 실제 프로젝트 구조

```text
frontend/
├── public/
│   ├── favicon.svg
│   ├── hero-image.png
│   └── icons.svg
├── src/
│   ├── api/
│   │   └── axios.js            # Axios 인스턴스 설정 (baseURL, 인터셉터)
│   ├── components/
│   │   └── layout/
│   │       ├── Header.jsx / Header.css
│   │       └── Footer.jsx / Footer.css
│   ├── pages/                  # 구현 완료된 페이지 컴포넌트
│   │   ├── Home.jsx / Home.css
│   │   ├── Items.jsx / Items.css
│   │   ├── ItemDetail.jsx / ItemDetail.css
│   │   ├── ItemWrite.jsx / ItemWrite.css
│   │   ├── Town.jsx / Town.css
│   │   ├── TownWrite.jsx
│   │   ├── Experts.jsx / Experts.css
│   │   ├── Chat.jsx / Chat.css
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Auth.css            # 로그인·회원가입 공용 스타일
│   │   ├── Profile.jsx / Profile.css
│   │   ├── LikedItems.jsx
│   │   ├── Requests.jsx / Requests.css
│   │   ├── Progress.jsx
│   │   ├── Notifications.jsx / Notifications.css
│   │   ├── PaymentPage.jsx / PaymentPage.css
│   │   ├── Payment.jsx / Payment.css
│   │   ├── Review.jsx / Review.css
│   │   ├── Verification.jsx / Verification.css
│   │   └── AdminDashboard.jsx / AdminDashboard.css
│   ├── styles/
│   │   ├── index.css           # 전역 스타일
│   │   └── variables.css       # CSS 변수 (색상, 간격 등)
│   ├── App.jsx                 # 라우팅 설정
│   └── main.jsx
├── dist/                       # 빌드 결과물
├── index.html
├── package.json
└── vite.config.js
```

## 3. 라우팅 구조 (App.jsx 기준)

| 경로 | 컴포넌트 | 설명 |
| :--- | :--- | :--- |
| `/` | Home | 메인 홈 |
| `/items` | Items | 부름 목록 |
| `/items/write` | ItemWrite | 부름 작성 |
| `/items/:id` | ItemDetail | 부름 상세 |
| `/town` | Town | 동네생활 목록 |
| `/town/write` | TownWrite | 동네생활 작성 |
| `/experts` | Experts | 전문가 목록 |
| `/chat` | Chat | 채팅방 목록 및 실시간 채팅 |
| `/login` | Login | 로그인 |
| `/signup` | Signup | 회원가입 |
| `/profile` | Profile | 마이페이지 |
| `/profile/liked` | LikedItems | 관심 목록 |
| `/requests` | Requests | 내가 요청한 부름 목록 |
| `/progress` | Progress | 내가 수행 중인 부름 목록 |
| `/notifications` | Notifications | 알림 목록 |
| `/payments/deposit/:buleumId` | PaymentPage | 안전결제 |
| `/review` | Review | 후기 작성 |
| `/verify` | Verification | 신원 인증 서류 제출 |
| `/admin` | AdminDashboard | 관리자 대시보드 |
| `*` | Home | 404 폴백 |

## 4. 구현된 주요 기능

### 4.1 인증
- 이메일/비밀번호 회원가입 및 로그인
- JWT 토큰 localStorage 저장 및 Axios 헤더 자동 첨부

### 4.2 부름(Buleum) 거래
- 부름 목록 조회 (검색어, 지역 필터)
- 부름 작성 (이미지 업로드 포함)
- 부름 상세 조회 및 관심(찜) 토글
- 상태 변경 (대기중 → 진행중 → 완료)
- 내 요청 목록 (`/requests`), 내 수행 목록 (`/progress`)

### 4.3 동네생활
- 게시글 목록 (카테고리 탭 필터링)
- 게시글 작성 (이미지 업로드 포함)

### 4.4 실시간 채팅
- 채팅방 목록 조회 (최근 메시지 표시)
- WebSocket 실시간 메시지 송수신 (`/ws/chat/{room_id}?token=...`)
- 이미지·동영상 파일 첨부 (최대 50MB)

### 4.5 전문가
- 전문가 목록 조회 (카테고리 필터링)
- 전문가와 직접 채팅 연결

### 4.6 마이페이지
- 프로필 정보 조회 및 수정 (닉네임, 동네, 프로필 이미지)
- 관심 목록 조회

### 4.7 알림
- 채팅·결제·후기 관련 알림 조회
- 알림 읽음 처리

### 4.8 안전결제
- 예치금 전송 (결제 방법 선택)
- 구매 확정 (지급 완료 처리)

### 4.9 후기 및 신원 인증
- 별점 및 후기 작성 → 상대방 매너온도 자동 반영
- 신분증/자격증 서류 제출

### 4.10 관리자 대시보드
- 통계 요약 (총 사용자, 총 부름글, 완료 건수, 전문가 수, 결제 수)
- 전체 사용자 조회 및 삭제
- 전체 부름글 조회 및 삭제

## 5. API 통신

- 기본 URL: `http://localhost:8000`
- 인증 헤더: `Authorization: Bearer <JWT_TOKEN>`
- 파일 업로드: `multipart/form-data`
- WebSocket: `ws://localhost:8000/ws/chat/{room_id}?token=<JWT_TOKEN>`

### 5.1 Axios 설정 (`src/api/axios.js`)

`axios.create()`로 baseURL을 `http://localhost:8000`으로 설정하고, 요청 인터셉터에서 `localStorage`에 저장된 JWT 토큰을 `Authorization` 헤더에 자동 첨부합니다.

## 6. 빌드 산출물

`npm run build` 실행 시 `frontend/dist/`에 빌드 결과물이 생성되며, GitHub Actions CI/CD를 통해 EC2 서버에서 자동으로 빌드됩니다.
