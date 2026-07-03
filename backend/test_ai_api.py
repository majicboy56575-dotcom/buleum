"""부름 AI API 테스트 스크립트"""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = "http://localhost:8000/api/ai"
API_KEY = "bl_ai_k8x7m2p9q4w6n1v3y5t0r8s"

def api_call(method, path, data=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = Request(url, data=body, method=method)
    req.add_header("X-API-Key", API_KEY)
    if body:
        req.add_header("Content-Type", "application/json")
    try:
        r = urlopen(req)
        result = json.loads(r.read().decode("utf-8"))
        print(f"[{r.status}] {method} {path}")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return result
    except HTTPError as e:
        print(f"[{e.code}] {method} {path}")
        print(e.read().decode("utf-8"))
        return None

# === 1. API 키 없이 호출 (거부 확인) ===
print("=" * 50)
print("TEST 1: API 키 없이 호출 (거부되어야 함)")
print("=" * 50)
try:
    req_no_key = Request(f"{BASE}/users")
    r = urlopen(req_no_key)
    print(f"[FAIL] Status: {r.status}")
except HTTPError as e:
    print(f"[OK] Status: {e.code} (정상적으로 거부됨)")

# === 2. 잘못된 API 키로 호출 (거부 확인) ===
print()
print("=" * 50)
print("TEST 2: 잘못된 API 키 (거부되어야 함)")
print("=" * 50)
try:
    req_bad = Request(f"{BASE}/users")
    req_bad.add_header("X-API-Key", "wrong-key-12345")
    r = urlopen(req_bad)
    print(f"[FAIL] Status: {r.status}")
except HTTPError as e:
    print(f"[OK] Status: {e.code} (정상적으로 거부됨)")

# === 3. 가상 사용자 생성 ===
print()
print("=" * 50)
print("TEST 3: 가상 사용자 생성")
print("=" * 50)
user = api_call("POST", "/users", {
    "email": "test_sim_user@buleum.ai",
    "nickname": "테스트봇",
    "location": "서울 마포구"
})

# === 4. 가상 사용자 목록 조회 ===
print()
print("=" * 50)
print("TEST 4: 가상 사용자 목록 조회")
print("=" * 50)
api_call("GET", "/users")

# === 5. 가상 심부름 게시글 등록 ===
if user:
    print()
    print("=" * 50)
    print("TEST 5: 가상 심부름 게시글 등록")
    print("=" * 50)
    api_call("POST", "/items", {
        "user_id": user["id"],
        "title": "마포구 약국 약 수령 대행",
        "price": 15000,
        "description": "마포구 근처 약국에서 처방약 수령해주실 분 구합니다. 약국 위치와 처방전 사진 전달드립니다.",
        "location": "서울 마포구 합정동"
    })

# === 6. 미답변 채팅 대기열 조회 ===
print()
print("=" * 50)
print("TEST 6: 미답변 채팅 대기열 조회")
print("=" * 50)
api_call("GET", "/chats/pending")

print()
print("=" * 50)
print("ALL TESTS COMPLETED")
print("=" * 50)
