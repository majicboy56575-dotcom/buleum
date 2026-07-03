import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import auth

# 20개의 다양한 닉네임
nicknames = [
    "효도왕자", "따뜻한손길", "엄마사랑꾼", "든든한아들", "착한이웃",
    "동네형아", "마음돌봄이", "달려가는딸", "다정한봄", "해피헬퍼",
    "대전도우미", "엄마미소", "효자손자", "따뜻한차한잔", "두정동히어로",
    "사랑의일꾼", "청춘봉사자", "늘곁에", "이웃사촌", "봉사하는민수"
]

# 대전 17개, 천안 1개, 청주 1개, 안산 1개
dummy_contents = [
    {
        "title": "부모님 스마트폰 사진 백업 및 클라우드 동기화 정리",
        "description": "부모님 스마트폰 용량이 꽉 차서 사진 촬영이 안 됩니다. 외장 하드 및 네이버 MYBOX 클라우드로 여태 찍으신 자식, 손주 사진들을 안전하게 옮겨서 백업해주실 분 구합니다.",
        "location": "대전시 서구 둔산동",
        "price": 25000
    },
    {
        "title": "혼자 계신 어머니 댁 형광등 LED 전등 교체 작업",
        "description": "안방과 거실 전등이 깜빡거리는데 어머니가 혼자 교체하시기 위험해 보입니다. 사 오신 LED 전등 교체 작업 및 삐걱거리는 방문 문고리 수리 요청드립니다.",
        "location": "대전시 유성구 궁동",
        "price": 40000
    },
    {
        "title": "안과 정기검진 병원 대기 및 약 처방 동행",
        "description": "어머니 안과 검진이 있는 날인데 보호자 동행이 필요합니다. 안과 검사 후 눈이 침침해 지실 수 있으니 처방전 받아서 약국 약 수령 후 자택까지 무사 귀가 동행하는 일입니다.",
        "location": "대전시 중구 은행동",
        "price": 40000
    },
    {
        "title": "무거운 김치통 다용도실 이동 및 김장 보조",
        "description": "어머니께서 김장을 하셔야 하는데 소금 절이기 작업과 무거운 김치통, 항아리들을 다용도실로 이동시키는 힘쓰는 일을 도와주실 분을 급히 모십니다.",
        "location": "대전시 동구 자양동",
        "price": 90000
    },
    {
        "title": "독거 할머니 댁 문고리 수리 및 가구 위치 조율",
        "description": "다리가 아프신 할머니의 편리한 동선을 위해 침대와 협탁 위치를 조율하고, 삐걱거리는 현관 중문과 화장실 문고리를 안전하게 교체해주실 손재주 좋으신 분 구합니다.",
        "location": "대전시 대덕구 오정동",
        "price": 50000
    },
    {
        "title": "요양병원 부모님 면회 차량 동행 및 휠체어 보조",
        "description": "요양병원에 계신 어머니 면회를 가려는데 거동이 많이 불편하십니다. 차량 승하차와 요양병원 내 휠체어 이동을 친절하게 보조해주실 든든한 전문가분을 찾습니다.",
        "location": "대전시 서구 탄방동",
        "price": 50000
    },
    {
        "title": "주말 할머니 말벗 및 가벼운 산책 파트너",
        "description": "할머니가 요즘 바깥 활동이 없으셔서 많이 외로워하십니다. 주말 오후에 아파트 단지 산책로를 가볍게 같이 걸으며 도란도란 따뜻한 말벗이 되어주실 친절한 분 환영합니다.",
        "location": "대전시 유성구 봉명동",
        "price": 25000
    },
    {
        "title": "부모님 결혼기념일 선물 및 꽃바구니 대리 전달",
        "description": "부모님 결혼기념일인데 제가 해외 출장 중이라 직접 가지 못합니다. 준비한 꽃바구니와 선물 상자를 부모님께 직접 정중하게 인사드리며 대리 전달해 주실 분 구합니다.",
        "location": "대전시 중구 대흥동",
        "price": 20000
    },
    {
        "title": "싱크대 배수관 노후 호스 교체 및 주방 청소",
        "description": "싱크대 배수관 노후화로 물이 조금씩 새고 냄새가 올라옵니다. 사다 둔 호스 세트로 깔끔하게 교체해주시고, 싱크대 하단 곰팡이 낀 부분을 락스로 말끔히 청소 부탁드립니다.",
        "location": "대전시 서구 갈마동",
        "price": 45000
    },
    {
        "title": "겨울철 대비 안방 및 거실 외풍 단열 시트 부착",
        "description": "부모님 댁이 단열이 잘 안 되어 겨울에 외풍이 심합니다. 뽁뽁이 단열 시트와 문풍지 부착 작업, 그리고 보일러 기본 점검 작동 여부 확인 등을 꼼꼼하게 도와주세요.",
        "location": "대전시 동구 가양동",
        "price": 60000
    },
    {
        "title": "마당 무성한 잡초 제거 및 잔디 깎기",
        "description": "혼자 사시는 할머니께서 마당 잡초 때문에 힘들어하십니다. 마당 앞뒤 잡초 정리와 예초기를 이용한 잔디 깎기 작업을 정성껏 도와주실 분 구합니다.",
        "location": "대전시 대덕구 신탄진동",
        "price": 80000
    },
    {
        "title": "정형외과 접수 보조 및 물리치료 대기 동행",
        "description": "아버지가 무릎 관절염 때문에 병원 진료를 보셔야 하는데 거동이 힘드십니다. 병원 접수 보조, 진료실 및 물리치료 대기, 약국 동행까지 자식처럼 함께 동행해 주실 분 구합니다.",
        "location": "대전시 서구 괴정동",
        "price": 45000
    },
    {
        "title": "수면 위내시경 검사 보호자 자택 동행",
        "description": "수면 위내시경 검사를 받는 아버지가 무사히 집에 복귀하실 수 있도록 종합병원에서 만나 택시를 같이 타고 집에 들어가 안정하시는 것까지 지켜봐 주실 분을 모집합니다.",
        "location": "대전시 유성구 신성동",
        "price": 50000
    },
    {
        "title": "대형 서랍장 폐기 스티커 부착 및 외부 배출",
        "description": "무거운 오래된 서랍장 2개를 버려야 하는데 부모님 두 분 힘으로는 불가능합니다. 서랍장을 집 밖 지정 수거 구역까지 꺼내놓고 폐기 스티커를 부착하는 작업 도와주실 분 찾습니다.",
        "location": "대전시 중구 오류동",
        "price": 40000
    },
    {
        "title": "일주일 드실 밑반찬 및 국 조리 대행",
        "description": "편찮으신 홀어머니를 위해 냉장고에 두고 드실 수 있는 건강한 밑반찬(콩자반, 시금치나물, 미역국 등)을 저희 집 부엌에서 맛있게 조리해 용기에 정리해주실 분 구합니다.",
        "location": "대전시 동구 판암동",
        "price": 75000
    },
    {
        "title": "보일러 배관 동파 방지 단열재 시공",
        "description": "보일러실 배관 단열 작업입니다. 날씨가 영하로 내려가기 전에 노출된 배관들을 보온재로 꼼꼼하게 감싸주고 단속해주실 손재주 좋으신 분을 찾습니다.",
        "location": "대전시 대덕구 법동",
        "price": 30000
    },
    {
        "title": "주민센터 행정서류 발급 동행 및 시장 짐꾼 대행",
        "description": "주민센터에서 서류 발급하는 과정을 같이 도와주시고 인근 시장에서 무거운 짐(쌀, 과일 등)을 대신 들어 안전하게 댁까지 배달 완료해주실 도우미 분을 찾습니다.",
        "location": "대전시 서구 월평동",
        "price": 35000
    },
    {
        "title": "천안 어머니 댁 장보기 보조 및 쌀 포대 옮기기",
        "description": "무릎 관절이 안 좋으신 천안의 어머니 장보기를 지원합니다. 마트에서 무거운 쌀포대(20kg)와 생수 상자 등을 카트에 싣고 차량에 실어 자택 주방까지 안전하게 배달해주실 분 구합니다.",
        "location": "충청남도 천안시 서북구 두정동",
        "price": 35000
    },
    {
        "title": "청주 할머니 댁 보일러 작동법 안내 및 실내 필터 청소",
        "description": "청주 아파트에 홀로 계신 할머니 댁 보일러가 작동이 잘 안 된다고 하십니다. 작동 요령을 알려드리고 에어컨 및 보일러 필터 청소를 가볍게 처리해주실 분 구합니다.",
        "location": "충청북도 청주시 상당구 용암동",
        "price": 30000
    },
    {
        "title": "안산 부모님 댁 안 쓰는 헌책 무거운 상자들 분리수거함 배출",
        "description": "오래된 전집 등 처분할 헌책이 5상자 정도 나옵니다. 부모님이 들고 엘리베이터 타시기엔 허리에 무리가 가니, 1층 분리수거 장소까지 깔끔하게 옮겨서 배출해주실 분을 모십니다.",
        "location": "경기도 안산시 단원구 고잔동",
        "price": 30000
    }
]

def create_dummies():
    db: Session = SessionLocal()
    try:
        # 1. 기존 더미 사용자들(is_simulated=True)의 부름 글 삭제
        simulated_users = db.query(models.User).filter(models.User.is_simulated == True).all()
        for su in simulated_users:
            db.query(models.Buleum).filter(models.Buleum.user_id == su.id).delete()
        # 기존 더미 사용자 삭제
        db.query(models.User).filter(models.User.is_simulated == True).delete()
        db.commit()
        print(f"기존 더미 사용자 및 부름 데이터 삭제 완료")

        # 2. 20개의 더미 사용자 생성 (각각 다른 닉네임)
        dummy_users = []
        for idx, nick in enumerate(nicknames):
            user = models.User(
                email=f"dummy{idx+1}@buleum.com",
                password_hash=auth.get_password_hash("dummy1234"),
                nickname=nick,
                location=dummy_contents[idx]["location"],
                manner_temperature=round(random.uniform(36.0, 38.5), 1),
                is_verified=True,
                is_admin=False,
                is_simulated=True
            )
            db.add(user)
            dummy_users.append(user)
        
        db.commit()
        for u in dummy_users:
            db.refresh(u)
        print(f"더미 사용자 {len(dummy_users)}명 생성 완료")

        # 3. 각 사용자에게 1개씩 부름 게시글 등록 (총 20개)
        now = datetime.utcnow()
        for idx, item in enumerate(dummy_contents):
            random_days_ago = random.randint(0, 14)
            random_hours_ago = random.randint(0, 23)
            created_time = now - timedelta(days=random_days_ago, hours=random_hours_ago)
            
            status_list = ["대기중", "대기중", "대기중", "진행중", "완료"]
            item_status = random.choice(status_list)
            
            buleum_post = models.Buleum(
                user_id=dummy_users[idx].id,
                title=item["title"],
                price=item["price"],
                description=item["description"],
                location=item["location"],
                image_url=None,
                status=item_status,
                likes=random.randint(0, 8),
                chat_count=random.randint(0, 4),
                created_at=created_time
            )
            db.add(buleum_post)
        
        db.commit()
        print("20개 더미 부름 데이터를 각각 다른 닉네임의 사용자로 생성 완료!")
        
    except Exception as e:
        db.rollback()
        print(f"에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_dummies()
