# 프론트엔드 명세서 (front.md)

본 문서는 당근마켓(Daangn) 클론 코딩 웹 애플리케이션의 프론트엔드 개발을 위한 명세서입니다.

## 1. 기술 스택 (Technology Stack)
*   **Core:** React (v18+)
*   **Build Tool:** Vite
*   **Styling:** Vanilla CSS (모던 CSS 기능 활용, CSS Variables, Flexbox, Grid)
    *   *주의:* TailwindCSS는 사용하지 않으며, 프리미엄 디자인 구현을 위해 커스텀 스타일링을 적용합니다.
*   **State Management:** React Context API (전역 상태: 사용자 인증, 현재 위치 등)
*   **Routing:** React Router DOM (v6)
*   **HTTP Client:** Axios 또는 Fetch API
*   **Real-time:** WebSocket (채팅 기능용)

## 2. 프로젝트 구조 (Project Structure)
```text
frontend/
├── public/
│   └── assets/          # 정적 이미지 및 아이콘
├── src/
│   ├── components/      # 재사용 가능한 공통 컴포넌트
│   │   ├── common/      # Button, Input, Modal, Loader 등
│   │   ├── layout/      # Header, Footer, Sidebar 등
│   │   └── item/        # 상품 카드 등 도메인별 컴포넌트
│   ├── contexts/        # 전역 상태 관리 (AuthContext, LocationContext)
│   ├── hooks/           # 커스텀 훅 (useAuth, useSocket 등)
│   ├── pages/           # 페이지 컴포넌트
│   ├── services/        # API 통신 모듈 (api.js)
│   ├── styles/          # 전역 스타일 및 테마 (index.css, variables.css)
│   ├── utils/           # 유틸리티 함수 (날짜 변환, 가격 포맷 등)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## 3. 핵심 디자인 시스템 (Design System)
*   **주요 색상 (Brand Colors):**
    *   당근 오렌지: `#FF7E36`
    *   서브 오렌지 (Hover): `#E96516`
    *   배경색: `#FBF7F2` (Light), `#121212` (Dark - 선택 사항)
*   **타이포그래피:**
    *   기본 폰트: `Pretendard`, `Noto Sans KR`
*   **Rich Aesthetics 적용:**
    *   부드러운 그림자 (Soft Shadows) 및 둥근 모서리 (Border Radius: 8px~12px)
    *   인터랙티브 요소에 마이크로 애니메이션(Hover, Active 상태 변화) 적용

## 4. 주요 페이지 및 기능 (Pages & Features)

### 4.1. 메인 페이지 (Home Page) - `/`
*   **기능:**
    *   히어로 섹션: 서비스 소개 및 검색창
    *   인기 매물 리스트 (그리드 레이아웃)
    *   서비스 바로가기 (중고거래, 동네생활, 알바 등)

### 4.2. 중고거래 (Used Trading) - `/items`
*   **목록 페이지 (`/items`):**
    *   동네별, 카테고리별 필터링 기능
    *   무한 스크롤(Infinite Scroll) 또는 더보기 버튼을 통한 목록 조회
*   **상세 페이지 (`/items/:id`):**
    *   상품 이미지 슬라이더 (Carousel)
    *   판매자 정보 (매너온도, 닉네임)
    *   상품 상태 (판매중, 예약중, 판매완료) 및 가격
    *   관심 버튼 (찜하기) 및 '채팅하기' 버튼
*   **글쓰기/수정 페이지 (`/items/write`, `/items/edit/:id`):**
    *   다중 이미지 업로드 및 미리보기 (최대 10장)
    *   가격 제안 가능 여부 체크박스

### 4.3. 동네생활 (Neighborhood Life) - `/town`
*   **기능:**
    *   동네 소통 게시판 (질문, 맛집, 일상 등 카테고리)
    *   게시글 작성 및 댓글/답글 기능
    *   공감(좋아요) 및 조회수 표시

### 4.4. 실시간 채팅 (Chat) - `/chat`
*   **기능:**
    *   채팅방 목록: 최근 메시지 및 읽지 않은 메시지 수 표시
    *   채팅창: WebSocket을 통한 실시간 메시지 전송 및 수신
    *   거래 약속 잡기 기능 (선택 사항)

### 4.5. 마이페이지 (My Page) - `/profile`
*   **기능:**
    *   내 프로필 수정 (닉네임, 프로필 사진)
    *   판매 내역, 구매 내역, 관심 목록 조회

## 5. 위치 기반 서비스 (GPS)
*   사용자의 브라우저 Geolocation API를 활용하여 현재 위치 좌표 획득
*   백엔드 API를 통해 현재 위치 기반의 '동네' 설정 및 인증 처리
