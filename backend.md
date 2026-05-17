# 부름(Buleum) 백엔드 개발 요청 명세서 (backend.md)

본 문서는 효도 대행 및 심부름 서비스 '부름(Buleum)'의 프론트엔드 UI에 정확히 매칭되는 백엔드 API 및 데이터베이스 개발 명세서입니다. 디자인(프론트엔드)에 구현되지 않은 불필요한 기능은 제외하고 최적화되었습니다.

## 1. 개발 환경 및 기술 스택
*   **Framework:** FastAPI
*   **Database:** SQLite (개발 환경 및 프로덕션 환경 모두 가볍고 빠른 SQLite 단일 사용)
*   **ORM:** SQLAlchemy
*   **Authentication:** JWT (JSON Web Token)
*   **Real-time Communication:** WebSockets (채팅용)
*   **File Handling:** Python-multipart (로컬 디렉토리에 이미지/파일 저장)

## 2. 데이터베이스 스키마 (SQLite 테이블 구조)

### 2.1. User (사용자)
*   `id` (PK)
*   `email` (Unique)
*   `password_hash`
*   `nickname` (Unique)
*   `location` (활동 동네, 예: 역삼동)
*   `manner_temperature` (매너온도, 기본 36.5)
*   `profile_image_url`
*   `is_verified` (신원 인증 여부, Boolean)

### 2.2. Buleum (부름 요청글)
*   `id` (PK)
*   `user_id` (FK -> User.id)
*   `title`
*   `price` (보수 금액)
*   `description` (요청 상세 내용)
*   `location` (부름이 필요한 장소)
*   `image_url` (첨부 이미지)
*   `status` (상태: 대기중, 진행중, 완료)
*   `likes` (관심 수)
*   `chat_count` (채팅 수)
*   `created_at`

### 2.3. TownPost (동네생활 게시글)
*   `id` (PK)
*   `user_id` (FK -> User.id)
*   `category` (예: 동네질문, 동네맛집, 일상, 동네소식)
*   `content`
*   `location`
*   `image_url` (첨부 이미지)
*   `created_at`

### 2.4. ChatRoom & ChatMessage (채팅)
*   **ChatRoom**: `id` (PK), `buleum_id` (FK, Nullable), `requester_id` (요청자 FK), `helper_id` (수행자 FK), `created_at`
*   **ChatMessage**: `id` (PK), `room_id` (FK), `sender_id` (FK), `content`, `is_read`, `created_at`

### 2.5. Expert (전문가 프로필)
*   `id` (PK)
*   `user_id` (FK -> User.id)
*   `category` (예: 요양보호사, 간병인 등)
*   `rating` (평점)
*   `review_count` (리뷰 수)
*   `description` (전문가 소개)

### 2.6. Notification (알림)
*   `id` (PK)
*   `user_id` (FK -> User.id)
*   `type` (알림 종류: chat, accept, comment, review 등)
*   `content` (알림 메시지)
*   `is_read` (Boolean)
*   `created_at`

### 2.7. Payment (안전결제 예치금)
*   `id` (PK)
*   `buleum_id` (FK)
*   `payer_id` (FK)
*   `amount`
*   `payment_method`
*   `status` (예치됨, 지급완료)

### 2.8. Review (후기 및 평가)
*   `id` (PK)
*   `reviewer_id` (FK)
*   `target_user_id` (FK)
*   `buleum_id` (FK)
*   `rating` (1~5 별점)
*   `content`

### 2.9. Verification (신원 인증 서류)
*   `id` (PK)
*   `user_id` (FK)
*   `type` (신분증, 요양보호사 자격증 등)
*   `file_url` (서류 이미지 경로)
*   `status` (심사중, 승인됨, 거절됨)

## 3. API 엔드포인트 명세 (UI 구현 완료된 기능 중심)

### 3.1. Auth & Profile (`/login`, `/signup`, `/profile`)
*   `POST /api/auth/register`: 회원가입
*   `POST /api/auth/login`: 로그인 (JWT 토큰 발급)
*   `GET /api/users/me`: 내 프로필 조회
*   `PUT /api/users/me`: 내 프로필 수정 (이미지, 닉네임, 동네)

### 3.2. Buleum (부름) (`/items`, `/items/write`, `/items/:id`, `/requests`, `/progress`)
*   `GET /api/items`: 부름 목록 전체/검색 조회 (필터: 검색어, 지역)
*   `POST /api/items`: 신규 부름 작성 (이미지 파일 업로드 지원)
*   `GET /api/items/{item_id}`: 부름 상세 내역 조회
*   `POST /api/items/{item_id}/like`: 부름 관심(좋아요) 토글
*   `GET /api/users/me/requests`: 내가 요청한 부름 목록 조회 (`/requests` 페이지용)
*   `GET /api/users/me/progress`: 내가 지원하여 진행중인 부름 목록 조회 (`/progress` 페이지용)
*   `PUT /api/items/{item_id}/status`: 부름 상태 변경 (진행중, 완료 등)

### 3.3. Town (동네생활) (`/town`, `/town/write`)
*   `GET /api/town/posts`: 동네생활 게시글 목록 조회 (카테고리 탭 필터링 포함)
*   `POST /api/town/posts`: 동네생활 게시글 작성
*(참고: 현재 프론트엔드에 상세페이지 및 댓글 UI가 없으므로 해당 백엔드 기능은 제외)*

### 3.4. Chat (`/chat`)
*   `GET /api/chats/rooms`: 내 채팅방 목록 및 최근 메시지 조회
*   `WebSocket /ws/chat/{room_id}`: 실시간 채팅 송수신

### 3.5. Experts (`/experts`)
*   `GET /api/experts`: 전문가 목록 조회 (카테고리 탭 필터링 포함)

### 3.6. Notifications (`/notifications`)
*   `GET /api/notifications`: 내 알림 목록 조회

### 3.7. Payment (`/payment`)
*   `POST /api/payments/deposit`: 안전결제 예치금 전송 및 저장

### 3.8. Review (`/review`)
*   `POST /api/reviews`: 상대방 평가 별점 및 후기 작성 (작성 시 타겟 유저의 매너온도 업데이트 트리거)

### 3.9. Verification (`/verify`)
*   `POST /api/verification`: 신원 인증용 자격증/신분증 서류 업로드 및 제출
