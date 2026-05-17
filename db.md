# 데이터베이스 스키마 문서 (db.md)

최종 업데이트: 2026-05-17

## 1. 개요

| 항목 | 내용 |
| :--- | :--- |
| DBMS | SQLite |
| 파일 경로 | `backend/buleum.db` |
| ORM | SQLAlchemy 2.0+ (Python 클래스 매핑) |
| 테이블 생성 | 서버 시작 시 `models.Base.metadata.create_all()` 자동 실행 |

## 2. 테이블 상세 정의

### 2.1. `users` (사용자)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `email` | VARCHAR | UNIQUE, NOT NULL, INDEX | 로그인 이메일 |
| `password_hash` | VARCHAR | NOT NULL | bcrypt 해시 |
| `nickname` | VARCHAR | UNIQUE, NOT NULL, INDEX | 사용자 닉네임 |
| `location` | VARCHAR | NULL | 활동 동네 (예: 역삼동) |
| `manner_temperature` | FLOAT | DEFAULT 36.5 | 매너온도 |
| `profile_image_url` | VARCHAR | NULL | 프로필 이미지 경로 |
| `is_verified` | BOOLEAN | DEFAULT FALSE | 신원 인증 여부 |
| `is_admin` | BOOLEAN | DEFAULT FALSE | 관리자 권한 여부 |
| `created_at` | DATETIME | DEFAULT NOW | 가입 일시 |

관계: `buleums`, `town_posts`, `expert_profile`(1:1), `notifications`

### 2.2. `buleums` (부름 요청글)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `user_id` | INTEGER | FK → users.id, NOT NULL | 작성자 |
| `title` | VARCHAR | NOT NULL | 제목 |
| `price` | INTEGER | NOT NULL | 보수 금액 (원) |
| `description` | TEXT | NOT NULL | 상세 내용 |
| `location` | VARCHAR | NOT NULL | 부름 위치 |
| `image_url` | VARCHAR | NULL | 첨부 이미지 경로 |
| `status` | VARCHAR | DEFAULT '대기중' | 상태: `대기중` / `진행중` / `완료` |
| `likes` | INTEGER | DEFAULT 0 | 관심(좋아요) 수 |
| `chat_count` | INTEGER | DEFAULT 0 | 채팅 수 |
| `created_at` | DATETIME | DEFAULT NOW | 작성 일시 |

관계: `payments` (cascade delete-orphan)

### 2.3. `town_posts` (동네생활 게시글)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `user_id` | INTEGER | FK → users.id, NOT NULL | 작성자 |
| `category` | VARCHAR | NOT NULL | 카테고리 (동네질문, 동네맛집, 일상, 동네소식 등) |
| `content` | TEXT | NOT NULL | 본문 내용 |
| `location` | VARCHAR | NOT NULL | 동네 |
| `image_url` | VARCHAR | NULL | 첨부 이미지 경로 |
| `created_at` | DATETIME | DEFAULT NOW | 작성 일시 |

### 2.4. `chat_rooms` (채팅방)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `buleum_id` | INTEGER | FK → buleums.id, NULL | 연결된 부름글 (없으면 전문가 직접 채팅) |
| `requester_id` | INTEGER | FK → users.id, NOT NULL | 요청자 (부름글 작성자 또는 전문가 연결 개시자) |
| `helper_id` | INTEGER | FK → users.id, NOT NULL | 수행자 (헬퍼) |
| `created_at` | DATETIME | DEFAULT NOW | 생성 일시 |

관계: `messages`

### 2.5. `chat_messages` (채팅 메시지)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `room_id` | INTEGER | FK → chat_rooms.id, NOT NULL | 채팅방 |
| `sender_id` | INTEGER | FK → users.id, NOT NULL | 발신자 |
| `content` | TEXT | NOT NULL | 메시지 내용 |
| `message_type` | VARCHAR | DEFAULT 'text' | 타입: `text` / `image` / `video` |
| `file_url` | VARCHAR | NULL | 미디어 파일 경로 |
| `is_read` | BOOLEAN | DEFAULT FALSE | 읽음 여부 |
| `created_at` | DATETIME | DEFAULT NOW | 발신 일시 |

### 2.6. `experts` (전문가 프로필)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `user_id` | INTEGER | FK → users.id, UNIQUE, NOT NULL | 연결된 사용자 (1:1) |
| `category` | VARCHAR | NOT NULL | 전문 분야 (예: 요양보호사, 간병인) |
| `rating` | FLOAT | DEFAULT 0.0 | 평균 평점 |
| `review_count` | INTEGER | DEFAULT 0 | 후기 수 |
| `description` | TEXT | NULL | 전문가 소개 |

### 2.7. `notifications` (알림)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `user_id` | INTEGER | FK → users.id, NOT NULL | 수신 사용자 |
| `type` | VARCHAR | NOT NULL | 알림 종류: `chat` / `accept` / `comment` / `review` |
| `related_id` | INTEGER | NULL | 관련 리소스 ID (채팅방 ID, 부름글 ID 등) |
| `content` | TEXT | NOT NULL | 알림 메시지 |
| `is_read` | BOOLEAN | DEFAULT FALSE | 읽음 여부 |
| `created_at` | DATETIME | DEFAULT NOW | 생성 일시 |

### 2.8. `payments` (안전결제)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `buleum_id` | INTEGER | FK → buleums.id, NULL | 관련 부름글 (삭제 시 NULL로 분리) |
| `payer_id` | INTEGER | FK → users.id, NOT NULL | 결제자 |
| `amount` | INTEGER | NOT NULL | 금액 (원) |
| `payment_method` | VARCHAR | NOT NULL | 결제 수단 |
| `status` | VARCHAR | DEFAULT '예치됨' | 상태: `예치됨` / `지급완료` |
| `created_at` | DATETIME | DEFAULT NOW | 결제 일시 |

### 2.9. `reviews` (후기 및 평가)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `reviewer_id` | INTEGER | FK → users.id, NOT NULL | 작성자 |
| `target_user_id` | INTEGER | FK → users.id, NOT NULL | 평가 대상 사용자 |
| `buleum_id` | INTEGER | FK → buleums.id, NULL | 관련 부름글 |
| `rating` | INTEGER | NOT NULL | 별점 (1~5) |
| `content` | TEXT | NULL | 후기 내용 |
| `created_at` | DATETIME | DEFAULT NOW | 작성 일시 |

후기 작성 시 `target_user.manner_temperature += (rating - 3) * 0.1` 자동 반영

### 2.10. `verifications` (신원 인증 서류)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `user_id` | INTEGER | FK → users.id, NOT NULL | 신청 사용자 |
| `type` | VARCHAR | NOT NULL | 서류 종류 (신분증, 요양보호사 자격증 등) |
| `file_url` | VARCHAR | NOT NULL | 서류 이미지 경로 |
| `status` | VARCHAR | DEFAULT '심사중' | 상태: `심사중` / `승인됨` / `거절됨` |
| `created_at` | DATETIME | DEFAULT NOW | 제출 일시 |

### 2.11. `user_item_likes` (부름글 관심 기록)

| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `user_id` | INTEGER | FK → users.id, NOT NULL | 사용자 |
| `buleum_id` | INTEGER | FK → buleums.id, NOT NULL | 부름글 |
| `created_at` | DATETIME | DEFAULT NOW | 관심 등록 일시 |

## 3. 테이블 관계 다이어그램

```
users ──┬── buleums ──── payments
        ├── town_posts   └── user_item_likes
        ├── experts (1:1)
        ├── notifications
        ├── reviews (reviewer / target)
        └── verifications

buleums ─── chat_rooms ─── chat_messages
```
