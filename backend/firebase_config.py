"""
Firebase Admin SDK 초기화 및 인증 유틸리티
"""
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os

def initialize_firebase():
    """Firebase Admin SDK를 초기화합니다."""
    if firebase_admin._apps:
        return  # 이미 초기화됨
    
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not cred_path:
        raise RuntimeError("FIREBASE_CREDENTIALS_PATH 환경변수가 설정되지 않았습니다.")
    
    if not os.path.exists(cred_path):
        raise RuntimeError(f"Firebase 서비스 계정 키 파일을 찾을 수 없습니다: {cred_path}")
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("[Firebase] Admin SDK 초기화 완료")


def verify_firebase_token(id_token: str) -> dict:
    """
    Firebase ID Token을 검증하고 사용자 정보를 반환합니다.
    
    Args:
        id_token: 프론트엔드에서 전달받은 Firebase ID Token
    
    Returns:
        dict: 검증된 토큰 정보 (uid, email, email_verified 등)
    
    Raises:
        ValueError: 토큰이 유효하지 않거나 이메일이 인증되지 않은 경우
    """
    try:
        decoded_token = firebase_auth.verify_id_token(id_token, clock_skew_seconds=10)
    except firebase_admin.exceptions.FirebaseError as e:
        raise ValueError(f"유효하지 않은 Firebase 토큰입니다: {e}")
    except Exception as e:
        raise ValueError(f"토큰 검증 중 오류가 발생했습니다: {e}")
    
    if not decoded_token.get("email_verified", False):
        raise ValueError("이메일 인증이 완료되지 않았습니다.")
    
    return decoded_token
