# 프로젝트 설치 및 실행 가이드 (guide.md)

최종 업데이트: 2026-05-18

## 1. 프로젝트 개요

**부름(Buleum)** — 효도 대행 및 심부름 서비스 플랫폼

| 항목 | 내용 |
| :--- | :--- |
| 프론트엔드 | React 19 + Vite 8 (포트 5173) |
| 백엔드 | FastAPI + Python 3.9+ (포트 8000) |
| 데이터베이스 | SQLite (`backend/buleum.db`) |
| 실시간 | WebSocket |

## 2. 필수 요구 사항

| 도구 | 권장 버전 |
| :--- | :--- |
| Node.js | 18 이상 |
| Python | 3.9 이상 |
| Git | 최신 버전 |

## 3. 설치 및 실행

### 방법 A. Windows 원클릭 실행 (권장)

프로젝트 루트에서 `start.bat`을 실행합니다.

```bat
start.bat
```

자동으로 처리되는 작업:
1. 백엔드 `venv` 가상환경 생성 및 패키지 설치
2. 프론트엔드 `node_modules` 설치
3. 백엔드 서버 (포트 8000) 실행
4. 프론트엔드 서버 (포트 5173) 실행
5. 브라우저 자동 열기 (`http://localhost:5173`)

### 방법 B. npm 동시 실행

루트 디렉토리에서 실행합니다.

```bash
# 최초 실행 시 패키지 설치
npm install
npm run install:frontend

# Windows 환경에서 백엔드 의존성 설치
npm run install:backend

# 프론트엔드 + 백엔드 동시 실행
npm run dev
```

> `concurrently`를 사용해 두 서버를 동시에 시작합니다.
> Windows 환경에서는 `venv\Scripts\uvicorn`을 사용하므로 Linux/macOS에서는 방법 C를 권장합니다.

### 방법 C. 수동 개별 실행 (Linux / macOS)

**백엔드 실행:**

```bash
cd backend

# 최초 실행 시
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 이후 실행
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**프론트엔드 실행 (새 터미널):**

```bash
cd frontend

# 최초 실행 시
npm install

# 이후 실행
npm run dev
```

## 4. 접속 URL

| 서비스 | URL |
| :--- | :--- |
| 프론트엔드 | `http://localhost:5173` |
| 백엔드 API | `http://localhost:8000` |
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |

## 5. 초기 관리자 계정

서버 첫 시작 시 자동 생성됩니다.

| 항목 | 값 |
| :--- | :--- |
| 이메일 | `admin@gmail.com` |
| 비밀번호 | `pass123` |
| 관리자 페이지 | `http://localhost:5173/admin` |

## 6. 주요 패키지 목록

### 백엔드 (`backend/requirements.txt`)

```
fastapi>=0.100.0
uvicorn>=0.22.0
sqlalchemy>=2.0.0
pydantic[email]>=2.0.0
bcrypt>=4.0.1
python-jose[cryptography]>=3.3.0
python-multipart>=0.0.6
email-validator>=2.0.0
websockets>=11.0
```

### 프론트엔드 (`frontend/package.json`)

```json
{
  "dependencies": {
    "axios": "^1.15.2",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2"
  }
}
```

## 7. 파일 업로드 경로

업로드된 파일은 `backend/uploads/`에 저장됩니다.

```
backend/uploads/
├── <uuid>_<filename>     # 부름글 이미지
└── chat/
    └── <uuid>.<ext>      # 채팅 이미지·동영상
```

서버가 `/uploads` 경로로 정적 파일을 서빙합니다.

## 8. 환경별 주의 사항

- **CORS:** 현재 `allow_origins=["*"]` 설정으로 모든 출처 허용 (개발 환경 전용)
- **JWT SECRET_KEY:** `supersecretkey_buleum_project` → 프로덕션 배포 시 환경변수로 교체 필요
- **SQLite:** 단일 파일 DB로 동시 쓰기 부하에 취약 — 대규모 서비스 전환 시 PostgreSQL 마이그레이션 고려
- **파일 저장:** 로컬 디스크 저장 방식 — 클라우드 배포 시 S3 등 외부 스토리지 연동 필요

## 9. GitHub Actions CI/CD 자동 배포

`.github/workflows/deploy.yml`에 정의된 워크플로우가 `main` 브랜치에 푸시될 때마다 EC2 서버에 자동으로 배포됩니다.

### 배포 흐름

```
git push → main 브랜치 감지 → EC2 SSH 접속 → git pull → npm install → npm run build
```

### 필수 GitHub Secrets

| 시크릿 키 | 설명 |
| :--- | :--- |
| `EC2_HOST` | EC2 인스턴스의 퍼블릭 IP 또는 도메인 |
| `EC2_SSH_KEY` | EC2 접속용 SSH 프라이빗 키 (PEM 전체 내용) |

### 배포 시 실행되는 작업

1. EC2 서버에 SSH 접속 (`appleboy/ssh-action@v1.0.3`)
2. `/home/ec2-user/buleum`에서 `git pull origin main`
3. `frontend/` 디렉토리에서 `npm install` 및 `npm run build`
4. 빌드 산출물(`frontend/dist/`)은 백엔드 `/uploads` 정적 서빙과 별도로 운용

> **주의:** 백엔드 재시작은 자동화되어 있지 않습니다. 백엔드 코드 변경 시 EC2에서 수동으로 uvicorn 프로세스를 재시작해야 합니다.

## 10. 구현 완료 기능 요약

| 기능 | 상태 |
| :--- | :--- |
| 회원가입 / 로그인 (JWT) | 완료 |
| 부름글 CRUD + 이미지 업로드 | 완료 |
| 부름글 관심(좋아요) 토글 | 완료 |
| 동네생활 게시글 작성 | 완료 |
| 실시간 채팅 (WebSocket) | 완료 |
| 채팅 이미지·동영상 첨부 (50MB) | 완료 |
| 전문가 목록 및 직접 채팅 연결 | 완료 |
| 알림 (채팅·결제·후기) | 완료 |
| 안전결제 (예치 → 구매 확정) | 완료 |
| 후기 작성 + 매너온도 자동 반영 | 완료 |
| 신원 인증 서류 제출 | 완료 |
| 관리자 대시보드 | 완료 |
| GitHub Actions CI/CD 자동 배포 | 완료 |
