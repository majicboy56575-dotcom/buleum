# 데이터베이스 설계 명세서 (db.md)

본 문서는 당근마켓(Daangn) 클론 코딩 웹 애플리케이션의 데이터베이스(SQLite) 설계를 위한 명세서입니다.

## 1. 개요 (Overview)
*   **DBMS:** SQLite
*   **특징:** 로컬 파일 기반의 경량 데이터베이스로, 설정이 간편하며 개발 및 프로토타이핑에 적합합니다.
*   **ORM 매핑:** SQLAlchemy를 사용하여 Python 클래스와 매핑합니다.

## 2. 테이블 상세 정의 (Table Definitions)

### 2.1. `users` (사용자 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | 로그인 아이디 (이메일) |
| `password_hash` | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| `nickname` | VARCHAR(50) | NOT NULL | 사용자 닉네임 |
| `profile_image`| VARCHAR(255) | NULL | 프로필 이미지 URL |
| `location_id` | INTEGER | FOREIGN KEY (`locations.id`) | 활동 동네 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 가입 일시 |

### 2.2. `locations` (동네/지역 정보 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `name` | VARCHAR(100) | NOT NULL | 동네 이름 (예: 역삼1동) |
| `latitude` | FLOAT | NOT NULL | 위도 |
| `longitude` | FLOAT | NOT NULL | 경도 |

### 2.3. `items` (중고거래 상품 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `seller_id` | INTEGER | FOREIGN KEY (`users.id`), NOT NULL | 판매자 ID |
| `location_id`| INTEGER | FOREIGN KEY (`locations.id`), NOT NULL | 거래 지역 |
| `title` | VARCHAR(255) | NOT NULL | 상품 제목 |
| `description` | TEXT | NOT NULL | 상품 설명 |
| `price` | INTEGER | NOT NULL | 가격 |
| `status` | VARCHAR(20) | DEFAULT '판매중' | 상태 (판매중/예약중/판매완료) |
| `views` | INTEGER | DEFAULT 0 | 조회수 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록 일시 |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정 일시 |

### 2.4. `item_images` (상품 이미지 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `item_id` | INTEGER | FOREIGN KEY (`items.id`), NOT NULL | 관련 상품 ID |
| `image_url` | VARCHAR(255) | NOT NULL | 이미지 저장 경로/URL |

### 2.5. `posts` (동네생활 게시글 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `author_id` | INTEGER | FOREIGN KEY (`users.id`), NOT NULL | 작성자 ID |
| `category` | VARCHAR(50) | NOT NULL | 카테고리 (일상, 질문 등) |
| `content` | TEXT | NOT NULL | 본문 내용 |
| `views` | INTEGER | DEFAULT 0 | 조회수 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 작성 일시 |

### 2.6. `comments` (게시글 댓글 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `post_id` | INTEGER | FOREIGN KEY (`posts.id`), NOT NULL | 관련 게시글 ID |
| `author_id` | INTEGER | FOREIGN KEY (`users.id`), NOT NULL | 작성자 ID |
| `content` | TEXT | NOT NULL | 댓글 내용 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 작성 일시 |

### 2.7. `chat_rooms` (채팅방 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `item_id` | INTEGER | FOREIGN KEY (`items.id`), NOT NULL | 관련 상품 ID |
| `buyer_id` | INTEGER | FOREIGN KEY (`users.id`), NOT NULL | 구매 희망자 ID |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |

### 2.8. `chat_messages` (채팅 메시지 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 식별자 |
| `room_id` | INTEGER | FOREIGN KEY (`chat_rooms.id`), NOT NULL | 관련 채팅방 ID |
| `sender_id` | INTEGER | FOREIGN KEY (`users.id`), NOT NULL | 발신자 ID |
| `message` | TEXT | NOT NULL | 메시지 내용 |
| `is_read` | BOOLEAN | DEFAULT FALSE | 읽음 여부 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 발신 일시 |

### 2.9. `likes` (상품 찜하기 테이블)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `user_id` | INTEGER | FOREIGN KEY (`users.id`), NOT NULL | 사용자 ID |
| `item_id` | INTEGER | FOREIGN KEY (`items.id`), NOT NULL | 상품 ID |
| PRIMARY KEY | `(user_id, item_id)` | 복합 기본키 | |
