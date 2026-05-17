# 전체 프로젝트 가이드 (guide.md)

본 문서는 당근마켓(Daangn) 클론 코딩 웹 애플리케이션의 개발 및 실행을 위한 종합 가이드라인입니다.

## 1. 프로젝트 개요 (Overview)
*   **목표:** 당근마켓의 핵심 기능(중고거래, 동네생활, 실시간 채팅, 위치 기반 서비스)을 구현한 완전한 기능의 웹 애플리케이션 개발.
*   **기술 스택:** React (Frontend) + FastAPI (Backend) + SQLite (Database)

## 2. 개발 환경 구축 (Environment Setup)

### 2.0. 원클릭 자동 실행 (추천)
프로젝트 루트 디렉토리에서 다음 명령어 중 하나를 실행하면 패키지 설치 및 서버가 동시에 실행됩니다.

*   **방법 A (npm 이용):** `npm run dev`
*   **방법 B (배치 파일 이용):** `start.bat` 파일 더블 클릭 또는 터미널에서 `./start.bat` 실행


### 2.1. 필수 요구사항
*   Node.js (v18 이상)
*   Python (v3.10 이상)
*   Git


### 2.2. 백엔드 설정 (Backend Setup)
1. `backend` 디렉토리로 이동합니다.
2. 가상환경을 생성하고 활성화합니다.
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. 필요한 패키지를 설치합니다.
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic passlib[bcrypt] python-jose[cryptography] python-multipart
   ```
4. 서버를 실행합니다.
   ```bash
   uvicorn main:app --reload
   ```

### 2.3. 프론트엔드 설정 (Frontend Setup)
1. `frontend` 디렉토리로 이동합니다.
2. 패키지를 설치합니다.
   ```bash
   npm install
   ```
3. 개발 서버를 실행합니다.
   ```bash
   npm run dev
   ```

## 3. 개발 단계별 로드맵 (Roadmap)

### Phase 1: 기반 마련 (1주차)
*   프로젝트 초기화 (React & FastAPI)
*   SQLite 데이터베이스 연동 및 기본 스키마 생성
*   기본 UI/UX 레이아웃 (Header, Footer, Navigation) 구현

### Phase 2: 사용자 및 위치 (2주차)
*   JWT 기반 회원가입/로그인 구현
*   Geolocation API를 활용한 동네 설정 및 인증 기능

### Phase 3: 핵심 비즈니스 로직 (3~4주차)
*   **중고거래:** 상품 등록(이미지 업로드), 조회, 수정, 삭제 기능
*   **동네생활:** 게시글 및 댓글 작성 기능
*   **찜하기:** 관심 상품 등록 기능

### Phase 4: 실시간 소통 (5주차)
*   WebSocket을 활용한 1:1 실시간 채팅 기능 구현
*   채팅방 목록 및 메시지 히스토리 관리

### Phase 5: 최적화 및 폴리싱 (6주차)
*   Rich Aesthetics 적용 (애니메이션, 디자인 완성도 향상)
*   버그 수정 및 성능 최적화

## 4. 품질 관리 (Quality Assurance)
*   **API 테스트:** FastAPI의 `/docs` (Swagger UI)를 활용하여 엔드포인트 동작 확인
*   **크로스 브라우징:** Chrome, Safari, Edge 등 주요 브라우저에서의 반응형 레이아웃 확인
