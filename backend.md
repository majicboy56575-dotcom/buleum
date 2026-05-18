# 백엔드 현황 문서 (backend.md)

최종 업데이트: 2026-05-18

## 1. 기술 스택

| 항목 | 버전/설정 |
| :--- | :--- |
| Framework | FastAPI |
| Database | SQLite (`backend/buleum.db`) |
| ORM | SQLAlchemy 2.0+ |
| 인증 | JWT (HS256, 유효기간 7일) |
| 실시간 통신 | WebSocket |
| 파일 업로드 | python-multipart (로컬 저장) |
| 비밀번호 해싱 | bcrypt |

## 2. 프로젝트 구조

```text
backend/
├── main.py            # FastAPI 앱 진입점, WebSocket 엔드포인트
├── database.py        # SQLite 연결 설정 (buleum.db)
├── models.py          # SQLAlchemy ORM 모델 정의
├── schemas.py         # Pydantic 스키마 (요청/응답)
├── auth.py            # JWT 발급/검증, bcrypt 해싱
├── requirements.txt   # 패키지 목록
├── routers/
│   ├── users.py       # 인증, 프로필, 내 요청/수행 목록
│   ├── items.py       # 부름글 CRUD, 좋아요, 파일 업로드
│   ├── town.py        # 동네생활 게시글
│   ├── chat.py        # 채팅방 REST + 미디어 업로드
│   ├── others.py      # 전문가, 알림, 결제, 후기, 신원 인증
│   └── admin.py       # 관리자 전용 통계/사용자/게시글 관리
└── uploads/           # 업로드된 파일 저장 디렉토리
    └── chat/          # 채팅 이미지·동영상
```

## 3. 인증 설정 (auth.py)

- **알고리즘:** HS256
- **토큰 유효기간:** 7일 (60 × 24 × 7 분)
- **SECRET_KEY:** `supersecretkey_buleum_project` (프로덕션 시 환경변수로 교체 필요)
- **OAuth2 tokenUrl:** `/api/auth/login`

## 4. API 엔드포인트 전체 목록

### 4.1 인증 및 사용자 (`routers/users.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| POST | `/api/auth/register` | | 회원가입 |
| POST | `/api/auth/login` | | 로그인 (JWT 발급) |
| GET | `/api/users/me` | O | 내 프로필 조회 |
| PUT | `/api/users/me` | O | 내 프로필 수정 (닉네임, 동네, 프로필 이미지 URL) |
| GET | `/api/users/me/requests` | O | 내가 작성한 부름글 목록 |
| GET | `/api/users/me/progress` | O | 내가 헬퍼로 참여 중인 부름글 목록 |

### 4.2 부름(Buleum) 게시글 (`routers/items.py`, prefix: `/api/items`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| GET | `/api/items` | | 목록 조회 (쿼리: `search`, `location`) |
| POST | `/api/items` | O | 부름글 작성 (multipart/form-data, 이미지 포함) |
| GET | `/api/items/{item_id}` | | 부름글 상세 조회 |
| PUT | `/api/items/{item_id}` | O | 부름글 수정 (작성자 본인만) |
| DELETE | `/api/items/{item_id}` | O | 부름글 삭제 (채팅방 유지, 결제 분리 보존) |
| PUT | `/api/items/{item_id}/status` | O | 상태 변경 (`대기중` / `진행중` / `완료`) |
| POST | `/api/items/{item_id}/like` | O | 관심(좋아요) 토글 |
| GET | `/api/items/liked` | O | 내가 관심 표시한 부름글 목록 |

### 4.3 동네생활 (`routers/town.py`, prefix: `/api/town`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| GET | `/api/town/posts` | | 게시글 목록 조회 (쿼리: `category`) |
| POST | `/api/town/posts` | O | 게시글 작성 (multipart/form-data, 이미지 포함) |

### 4.4 채팅 (`routers/chat.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| POST | `/api/chats/rooms` | O | 채팅방 생성 또는 기존 방 반환 |
| GET | `/api/chats/rooms` | O | 내 채팅방 목록 조회 (최근 메시지 포함) |
| GET | `/api/chats/rooms/{room_id}/messages` | O | 채팅방 메시지 히스토리 조회 |
| POST | `/api/chats/rooms/{room_id}/upload` | O | 이미지·동영상 업로드 (최대 50MB) |
| WS | `/ws/chat/{room_id}?token=<JWT>` | O | 실시간 채팅 (메시지 저장 + 브로드캐스트) |

채팅방 생성 요청 body:
- 부름글 채팅: `{ "buleum_id": <id> }` → 현재 유저가 헬퍼, 부름글 작성자가 요청자
- 전문가 직접 채팅: `{ "helper_id": <user_id> }` → 현재 유저가 요청자

WebSocket 메시지 형식:
```json
{ "content": "메시지 내용", "message_type": "text" }
{ "content": "", "message_type": "image", "file_url": "/uploads/chat/..." }
```

### 4.5 기타 (`routers/others.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| GET | `/api/test` | | API 정상 동작 확인 |

### 4.6 전문가 (`routers/others.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| GET | `/api/experts` | | 전문가 목록 조회 (닉네임, 프로필 이미지 포함) |

### 4.7 알림 (`routers/others.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| GET | `/api/notifications` | O | 내 알림 목록 (최신순) |
| PATCH | `/api/notifications/{id}/read` | O | 알림 읽음 처리 |

알림 타입: `chat`, `accept`, `comment`, `review`

### 4.8 결제 (`routers/others.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| POST | `/api/payments/deposit` | O | 안전결제 예치금 등록 → 부름 상태 `진행중` 변경 |
| POST | `/api/payments/{payment_id}/confirm` | O | 구매 확정 → 상태 `지급완료`, 부름 상태 `완료` 변경 |
| GET | `/api/payments/buleum/{buleum_id}` | O | 특정 부름글의 결제 정보 조회 |

### 4.9 후기 (`routers/others.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| POST | `/api/reviews` | O | 후기 작성 → 대상자 매너온도 자동 업데이트 |

매너온도 변경 공식: `manner_temperature += (rating - 3) * 0.1`

### 4.10 신원 인증 (`routers/others.py`)

| 메서드 | 경로 | 인증 필요 | 설명 |
| :--- | :--- | :---: | :--- |
| POST | `/api/verification` | O | 신원 인증 서류 제출 (심사중 → 승인됨/거절됨) |

### 4.11 관리자 (`routers/admin.py`, prefix: `/api/admin`)

| 메서드 | 경로 | 설명 |
| :--- | :--- | :--- |
| GET | `/api/admin/stats` | 대시보드 통계 (사용자/부름글/완료/전문가/결제 수) |
| GET | `/api/admin/users` | 전체 사용자 목록 |
| DELETE | `/api/admin/users/{user_id}` | 사용자 삭제 (관리자 계정 삭제 불가) |
| GET | `/api/admin/items` | 전체 부름글 목록 |
| DELETE | `/api/admin/items/{item_id}` | 부름글 삭제 |

모든 관리자 엔드포인트는 `is_admin=True` 사용자만 접근 가능합니다.

## 5. 파일 업로드

- 일반 이미지: `backend/uploads/<uuid>_<filename>` → URL: `/uploads/<filename>`
- 채팅 미디어: `backend/uploads/chat/<uuid>.<ext>` → URL: `/uploads/chat/<filename>`
- 허용 이미지 타입: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- 허용 동영상 타입: `video/mp4`, `video/quicktime`, `video/webm`
- 최대 파일 크기: 50MB (채팅 미디어)

## 6. 초기 관리자 계정

서버 시작 시 자동 생성됩니다 (없을 경우):
- **이메일:** `admin@gmail.com`
- **비밀번호:** `pass123`
- **is_admin:** `True`

## 7. API 문서

서버 실행 후 아래 URL에서 Swagger UI 확인 가능:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`
