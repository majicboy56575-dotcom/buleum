import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Notices.css';

const noticesData = [
  {
    id: 9,
    category: '안내',
    title: '🤖 텔레그램 에이전트 인학 가이드',
    summary: `---
name: telegram_remote_control
description: Enables the agent to autonomously monitor a Telegram bot command queue and execute coding or system tasks remotely based on incoming messages.
---

# Telegram Remote Control Agent Skill

이 스킬은 에이전트가 텔레그램 봇을 통해 외부에서 전송된 텍스트 명령(예: 코드 수정, 빌드, 타 에이전트 연동 실행 등)을 자동으로 감지하고, 수동 개입 없이 안전하게 원격으로 해당 명령을 처리하여 결과를 다시 텔레그램으로 전송하게 하는 무인 자율 조종 스킬입니다.

## 1. 아키텍처 개요

시스템은 아래와 같은 흐름으로 2단계에 걸쳐 동작합니다.
1. **명령 수집기 (\`check_telegram.py\` 또는 \`check_telegram_template.py\`)**:
   * 텔레그램 봇 서버를 롱 폴링(Long Polling)하며 보스의 명령을 실시간 감시합니다.
   * 명령 수신 시 텔레그램으로 즉각 접수 알림을 보내고, 로컬의 \`telegram_commands.json\` 파일에 \`pending\` 상태로 명령어를 쌓아둡니다.
2. **에이전트 자율 스케줄러**:
   * 안티그래비티 에이전트에 등록된 1분 주기 크론(Cron) 타이머가 작동하여 매 분마다 깨어납니다.
   * \`telegram_commands.json\`을 읽고 \`pending\` 명령어가 있으면 즉각 실행(개발 툴 가동 등)한 뒤 결과를 텔레그램 답장으로 쏘고 상태를 \`completed\`로 바꿉니다.

---

## 2. 연동 스크립트 설정 (\`check_telegram.py\`)

새로운 에이전트 환경에서 텔레그램 명령 접수 서버를 구동하기 위해 아래 템플릿 코드를 배치합니다.

* **코드 템플릿 위치:** [check_telegram_template.py](file:///C:/Users/USER/.gemini/config/skills/telegram_remote_control/scripts/check_telegram_template.py)
* **주요 설정 값:**
  * \`TOKEN\`: BotFather를 통해 발급받은 텔레그램 봇 API 토큰.
  * \`COMMANDS_FILE\`: 대기열이 저장될 파일명 (\`telegram_commands.json\` 기본 권장).

---

## 3. 에이전트 무인 감시 스케줄링 가이드

새로운 에이전트가 이 기능을 자동으로 가동하도록 하려면 아래의 **자율 1분 크론 감시 스케줄러**를 등록해야 합니다.

### 스케줄러 등록 명령어 (안티그래비티 내부 툴 호출 방식)
\`\`\`json
{
  "CronExpression": "* * * * *",
  "Prompt": "텔레그램 명령 대기열(telegram_commands.json)을 읽어 pending 상태의 명령어가 있는지 체크하고, 있다면 즉시 지시사항을 분석하여 툴(write_to_file, replace_file_content 등)을 사용해 명령을 수행하십시오. 수행 후 결과를 텔레그램으로 답장하고 상태를 completed로 업데이트하세요."
}
\`\`\`

---

## 4. 대기열 데이터 포맷 (\`telegram_commands.json\`)

대기열 파일은 아래와 같은 표준 구조의 JSON 리스트 형식으로 명령을 저장합니다.

\`\`\`json
[
  {
    "timestamp": "2026-06-30 17:03:46",
    "chat_id": 7711168296,
    "user_name": "Sangho",
    "message": "하연이한테 새로운 부름을 홍보할 수 있는 새로운 내용을 실사로 만들어서 포스팅하라고 해줘",
    "status": "pending"
  }
]
\`\`\`

에이전트는 이 파일을 읽고 \`status\` 필드가 \`pending\`인 대상을 필터링하여 작업을 수립합니다.

---

## 5. 중요 고려 사항 및 에러 처리 (Best Practices)

1. **Windows 한글 및 유니코드 인코딩 깨짐 방지:**
   * 윈도우 환경의 터미널과 파이썬 기본 인코딩(CP949) 간 충돌을 방지하기 위해 \`sys.stdin\`, \`sys.stdout\`, \`sys.stderr\`를 반드시 UTF-8 인코딩으로 강제 재설정해야 합니다.
   * \`sys.stdout.reconfigure(encoding='utf-8', errors='replace')\` 방식을 코드 상단에 포함하십시오.
2. **이중 수신 및 유실 방지 (Offset):**
   * 텔레그램 API getUpdates 호출 시 이전 쿼리의 업데이트 ID에 \`+1\` 한 값을 \`offset\` 매개변수로 전달해야 메시지가 중복 처리되지 않고 정상 소비됩니다.
3. **결과 알림 시의 문자열 이스케이프:**
   * 파이썬 스크립트 실행을 통해 텔레그램 완료 알림을 보낼 때, 줄바꿈(\`\\n\`)이나 이모지, 홑따옴표가 포함되면 명령 줄(CLI) 쉘 이스케이프 오류가 납니다.
   * 안전하게 임시 파이썬 스크립트(\`send_msg.py\`)를 scratch 폴더에 쓰고 실행한 뒤 삭제하는 우회 방식을 사용하십시오.

---

## 6. 에이전트 자율 수행 행동 지침 (Agent Automation Directives)

> [!IMPORTANT]
> 에이전트(나)가 이 스킬을 활성화하여 로드했을 때, 보스의 명시적인 개입이 없더라도 **아래 셋업 실무를 자율적으로 스스로 즉각 완료**해야 합니다.

1. **원격 수신 봇 템플릿 복사 및 배치 (자동 수행):**
   * 에이전트는 글로벌 스킬 템플릿 경로(\`C:\\Users\\USER\\.gemini\\config\\skills\\telegram_remote_control\\scripts\\check_telegram_template.py\` 또는 본 스킬의 \`scripts/check_telegram_template.py\`)에서 템플릿 코드를 읽어와, 현재 활성화된 프로젝트의 루트 경로에 \`check_telegram.py\`라는 이름으로 복사 및 생성합니다.
   * 보스에게 대화방에서 사용할 텔레그램 봇 토큰(\`TOKEN\`)을 요청하고, 입력된 토큰 값을 \`check_telegram.py\` 파일의 토큰 변수에 자동으로 기입(replace)합니다.
2. **수집기 스크립트 백그라운드 구동 (자동 수행):**
   * 에이전트는 즉시 \`run_command\` 툴을 실행하여 \`py check_telegram.py\` 명령을 백그라운드 태스크(Async)로 띄워 텔레그램 명령 대기열(\`telegram_commands.json\`) 감시기를 작동시킵니다.
3. **자율 크론 스케줄러 자동 예약 (자동 수행):**
   * 에이전트는 즉시 \`schedule\` 툴을 가동하여 **매 1분마다 스스로 깨어나 원격 명령을 감시 및 실행**하도록 크론(\`CronExpression: "* * * * *"\`) 스케줄 작업을 백그라운드에 자동으로 등록해 둡니다.
4. **문제 발생 시 공유 및 텔레그램 지시 수행 규칙 (자동 수행):**
   * 에이전트 구동 중 심각한 예외(예: 인증 만료, 리소스 누락 등)나 결정이 필요한 오류가 발생하면 즉시 문제 발생 소식과 원인을 요약하여 텔레그램으로 전송 및 공유해야 합니다.
   * 보스가 텔레그램을 통해 보낸 해결책이나 추가 지시사항이 감지되면, 이를 대기열(\`telegram_commands.json\`)에서 분석하여 상황에 맞춰 수정 코드를 반영하거나 필요한 도구를 수행하여 즉시 우회/해결을 진행해야 합니다.`,
    date: '2026-07-03',
    isPinned: true,
    isNew: true,
  },
  {
    id: 1,
    category: '서비스',
    title: '부름 서비스 정식 오픈 안내',
    summary: '효도 대행 및 심부름 매칭 서비스 "부름"이 정식 오픈하였습니다. 많은 이용 부탁드립니다.',
    date: '2026-07-01',
    isPinned: true,
    isNew: true,
  },
  {
    id: 2,
    category: '이벤트',
    title: '🎉 오픈 기념 첫 이용 50% 할인 이벤트',
    summary: '부름 오픈을 기념하여 첫 서비스 이용 시 50% 할인 쿠폰을 드립니다. 지금 바로 참여하세요!',
    date: '2026-07-01',
    isPinned: true,
    isNew: true,
  },
  {
    id: 3,
    category: '안내',
    title: '고객센터 운영시간 안내',
    summary: '고객센터 운영시간은 평일 09:00~18:00 입니다. 주말 및 공휴일은 채팅 상담만 운영됩니다.',
    date: '2026-06-28',
    isPinned: false,
    isNew: false,
  },
  {
    id: 4,
    category: '서비스',
    title: '전문가 인증 시스템 업데이트 안내',
    summary: '전문가 인증 절차가 간소화되었습니다. 신분증 촬영만으로 빠르게 인증이 가능합니다.',
    date: '2026-06-25',
    isPinned: false,
    isNew: false,
  },
  {
    id: 5,
    category: '안내',
    title: '서비스 이용약관 변경 안내',
    summary: '2026년 7월 1일부터 변경되는 이용약관을 안내드립니다. 주요 변경사항을 확인해주세요.',
    date: '2026-06-20',
    isPinned: false,
    isNew: false,
  },
  {
    id: 6,
    category: '이벤트',
    title: '친구 초대 이벤트 - 추천인 혜택 안내',
    summary: '친구를 초대하면 추천인과 피추천인 모두에게 5,000원 쿠폰을 드립니다.',
    date: '2026-06-18',
    isPinned: false,
    isNew: false,
  },
  {
    id: 7,
    category: '서비스',
    title: '수도권 외 지역 서비스 확대 예정 안내',
    summary: '2026년 하반기부터 대전, 대구, 부산 등 주요 광역시로 서비스를 확대할 예정입니다.',
    date: '2026-06-15',
    isPinned: false,
    isNew: false,
  },
  {
    id: 8,
    category: '안내',
    title: '개인정보 처리방침 개정 안내',
    summary: '개인정보 보호법 개정에 따라 개인정보 처리방침이 일부 변경되었습니다.',
    date: '2026-06-10',
    isPinned: false,
    isNew: false,
  },
];

const categories = ['전체', '서비스', '이벤트', '안내'];

const Notices = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredNotices = noticesData.filter((notice) => {
    const matchCategory =
      selectedCategory === '전체' || notice.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      notice.title.includes(searchQuery) ||
      notice.summary.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  // Sort: pinned first, then by date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case '서비스': return 'notice-badge-blue';
      case '이벤트': return 'notice-badge-pink';
      case '안내': return 'notice-badge-green';
      default: return 'notice-badge-blue';
    }
  };

  return (
    <div className="notices-page">
      {/* Hero */}
      <section className="notices-hero">
        <Link to="/customer-center" className="notices-back-link">
          ← 고객센터로 돌아가기
        </Link>
        <h1 className="notices-hero-title">📢 공지사항</h1>
        <p className="notices-hero-subtitle">부름의 최신 소식과 업데이트를 확인하세요</p>
      </section>

      {/* Toolbar */}
      <section className="notices-toolbar">
        <div className="notices-toolbar-inner">
          <div className="notices-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`notices-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="notices-search-wrapper">
            <input
              type="text"
              className="notices-search-input"
              placeholder="공지사항 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="notices-search-icon">🔍</span>
          </div>
        </div>
      </section>

      {/* Notice List */}
      <section className="notices-list-section">
        <div className="notices-list">
          {sortedNotices.length > 0 ? (
            sortedNotices.map((notice, index) => (
              <div
                key={notice.id}
                className={`notice-item ${notice.isPinned ? 'pinned' : ''} ${expandedId === notice.id ? 'expanded' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
              >
                <div className="notice-item-header">
                  <div className="notice-item-left">
                    {notice.isPinned && <span className="notice-pin">📌</span>}
                    <span className={`notice-badge ${getCategoryColor(notice.category)}`}>
                      {notice.category}
                    </span>
                    <h3 className="notice-title">{notice.title}</h3>
                    {notice.isNew && <span className="notice-new-badge">NEW</span>}
                  </div>
                  <div className="notice-item-right">
                    <span className="notice-date">{notice.date}</span>
                    <span className={`notice-chevron ${expandedId === notice.id ? 'open' : ''}`}>▶</span>
                  </div>
                </div>
                {expandedId === notice.id && (
                  <div className="notice-item-body">
                    <p>{notice.summary}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="notices-empty">
              <span className="notices-empty-icon">🔎</span>
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
        <div className="notices-count">
          총 <strong>{sortedNotices.length}</strong>건의 공지사항
        </div>
      </section>
    </div>
  );
};

export default Notices;
