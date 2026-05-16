// SSATIS — Reddit 크롤링 데이터 (자동 생성: 2026년 05월 16일 14:03)
// 출처: r/recruitinghell · r/cscareerquestions · r/jobs

// ─── GPT 분석용 수집 글 샘플 (실제 크롤링 전 데모 입력) ───────────────────────

window.PP_COLLECTED_SNIPPETS = {
  HR: [
    "최종 면접까지 갔는데 탈락 통보만 오고 사유는 영원히 안 알려줌. 다음 준비가 불가능함.",
    "Feedback 없이 고스트당하면 정신 건강만 망가짐. 시간만 버린 기분.",
    "JD에는 데이터 분석인데 입사하니 영업 보조라 미끼 공고 같음.",
    "공고랑 실제 업무가 너무 달라서 입사 한 달 만에 퇴사 고민 중.",
    "자소서 한 공고당 5시간씩 쓰는데 서류만 탈락. 이게 정상인가요?",
    "회사마다 다른 형식 강요해서 같은 이력인데도 매번 처음부터 작성함.",
    "ATS가 키워드 안 맞으면 바로 탈락이라 역량은 안 보이는 것 같음.",
    "코딩 테스트는 통과했는데 과제 무급에 시간만 날림 — 존중 없음.",
    "연봉 협상 전에 레퍼런스 체크까지 요구해서 부담스러움.",
    "면접관 태도가 불친절했고 질문도 무례함에 가까웠음.",
    "합격 연락 왔다가 다음 날 취소 통보 — 채용 프로세스가 너무 불안정함.",
    "신입인데 경력직 업무를 바로 시켜서 번아웃 옴.",
    "야근과 주말 근무가 미묘하게 강요되는 분위기.",
    "재택 근무라더니 출근 강요하고 규칙이 매번 바뀜.",
    "복지 항목이 공고와 실제가 다름 — 속았다는 느낌.",
  ],
  부동산: [
    "전세 계약 만료 한 달 전인데 집주인이 갑자기 월세로 바꾸자고 함.",
    "중개수수료 명목으로 추가 비용 요구해서 분쟁 생김.",
    "하자 있는데 보증금 반환 안 해준다고 함.",
    "월세 갱신 시 인상률이 너무 높아 협상 여지가 없음.",
    "직방·네이버에 올라온 사진이 실제와 완전히 다름.",
    "중개업소마다 같은 매물인데 가격 정보가 제각각임.",
    "관리비 항목이 불투명해서 매달 청구 금액이 들쭉날쭉함.",
    "방음이 안 돼서 윗집 층간소음 때문에 못 살겠음.",
    "계약서 조항이 불리한데 설명도 안 해줌.",
    "보증보험 가입했는데 해지 절차가 복잡하고 안내가 부족함.",
    "반려동물 허용이라더니 입주 후 금지 통보.",
    "김장철·이사 철에 중개비 폭등하는 느낌.",
    "전세 대출 승인 나기 전에 다른 사람에게 계약 맺게 한다고 압박.",
    "임대인 연락이 두절되고 중개사도 책임 회피함.",
    "집 상태 점검 체크리스트 없이 계약해서 나중에 분쟁.",
  ],
  의료: [
    "예약 앱에서 대기 시간을 알려줘도 실제는 두 배 이상 걸림.",
    "처방전 재발급하려면 병원을 또 방문해야 해서 불편함.",
    "비대면 진료 후 약국 연계가 안 되어 처방전 출력만 문제.",
    "검사 결과 나오기까지 문자 하나 없어 불안함.",
    "의료비 영수증을 여러 앱에 나눠 저장해야 해서 정리 지옥.",
    "원격 진료 후 증상 악화인데 후속 안내가 없음.",
    "병원마다 차트가 안 통해서 같은 설명을 매번 반복함.",
    "응급실 체류 시간이 너무 길어 본 진료 전에 지침.",
    "건강검진 결과 해설이 너무 어렵고 행동 가이드가 없음.",
    "진료비 미납 알림이 늦게 와서 연체 우려.",
    "약 복용 알림 앱과 병원 앱이 따로라 관리가 어렵움.",
    "영문 진료 기록이 필요한데 발급 절차가 복잡함.",
    "소아 진료 대기실이 좁고 예약 혼잡함.",
    "만성질환 재진 간격이 긴데 중간 관리 도구가 없음.",
    "의료 설명 동영상이 없어 노년층이 이해하기 힘듦.",
  ],
};

window.getCollectedPostsForAnalysis = function getCollectedPostsForAnalysis(keyword, sources) {
  const kw = String(keyword || "").trim();
  const pool =
    window.PP_COLLECTED_SNIPPETS[kw] ||
    window.PP_COLLECTED_SNIPPETS[kw.toUpperCase()] ||
    null;

  const generic = () =>
    Array.from({ length: 15 }, (_, i) =>
      `${kw || "해당"} 주제에서 사용자 불만 ${i + 1}: 정보가 흩어져 있고 검증이 어렵고, 비용·시간 낭비가 반복된다는 호소가 많음.`
    );
  const texts = pool || generic();

  const enabled =
    sources && typeof sources === "object"
      ? Object.entries(sources).filter(([, on]) => on).map(([id]) => id)
      : [];

  const srcList =
    enabled.length > 0
      ? enabled
      : ["reddit", "naver", "hackernews", "appstore"];

  return texts.map((text, i) => ({
    text: `[${kw || "주제"}] ${text}`,
    source: srcList[i % srcList.length],
  }));
};

window.PP_DATA = {
  "trendingKeywords": [
    {
      "kw": "HR",
      "delta": "+182%",
      "category": "B2B SaaS"
    },
    {
      "kw": "부동산",
      "delta": "+96%",
      "category": "Consumer"
    },
    {
      "kw": "의료",
      "delta": "+71%",
      "category": "Healthtech"
    },
    {
      "kw": "이커머스",
      "delta": "+54%",
      "category": "Retail"
    },
    {
      "kw": "교육",
      "delta": "+47%",
      "category": "Edtech"
    },
    {
      "kw": "금융",
      "delta": "+38%",
      "category": "Fintech"
    }
  ],
  "sources": [
    {
      "id": "reddit",
      "name": "레딧",
      "desc": "r/recruitinghell · r/cscareerquestions · r/jobs",
      "posts": 75,
      "defaultOn": true,
      "live": true,
      "free": true
    },
    {
      "id": "naver",
      "name": "네이버",
      "desc": "이직·취준생 카페 + 블로그 12개",
      "posts": 358,
      "defaultOn": true,
      "free": false
    },
    {
      "id": "hackernews",
      "name": "해커뉴스",
      "desc": "Ask HN · Show HN · job posts 댓글",
      "posts": 249,
      "defaultOn": true,
      "free": false
    },
    {
      "id": "appstore",
      "name": "앱스토어",
      "desc": "관련 앱 별 1~3점 리뷰 톱 500",
      "posts": 154,
      "defaultOn": true,
      "free": false
    },
    {
      "id": "playstore",
      "name": "구글플레이스토어",
      "desc": "관련 앱 별 1~3점 리뷰 톱 500",
      "posts": 127,
      "defaultOn": true,
      "free": false
    },
    {
      "id": "trustpilot",
      "name": "트러스트파일럿",
      "desc": "HR 서비스 분류 리뷰",
      "posts": 138,
      "defaultOn": false,
      "free": false
    },
    {
      "id": "youtube",
      "name": "유튜브 댓글",
      "desc": "관련 영상 댓글 (YouTube Data API)",
      "posts": 112,
      "defaultOn": true,
      "live": true,
      "free": false
    }
  ],
  "result": {
    "keyword": "HR",
    "analyzedAt": "2026년 05월 16일 14:03",
    "totalCollected": 923,
    "afterFilter": 738,
    "verdict": "틈새 존재",
    "verdictTone": "violet",
    "log": [
      {
        "src": "레딧",
        "id": "reddit",
        "n": 75,
        "t": "r/recruitinghell · r/cscareerquestions · r/jobs",
        "d": 0.3
      },
      {
        "src": "네이버",
        "id": "naver",
        "n": 358,
        "t": "이직·취준생 카페·블로그 12개",
        "d": 0.9
      },
      {
        "src": "해커뉴스",
        "id": "hackernews",
        "n": 249,
        "t": "Ask HN · Show HN 댓글 분석",
        "d": 1.5
      },
      {
        "src": "앱스토어",
        "id": "appstore",
        "n": 154,
        "t": "관련 앱 별 1~3점 리뷰 톱 500",
        "d": 2.1
      },
      {
        "src": "트러스트파일럿",
        "id": "trustpilot",
        "n": 138,
        "t": "HR 서비스 분류 리뷰",
        "d": 2.7
      },
      {
        "src": "구글플레이스토어",
        "id": "playstore",
        "n": 127,
        "t": "관련 앱 별 1~3점 리뷰 톱 500",
        "d": 3.2
      },
      {
        "src": "유튜브 댓글",
        "id": "youtube",
        "n": 112,
        "t": "관련 영상 댓글 톱 50",
        "d": 3.7
      }
    ],
    "painpoints": [
      {
        "id": "pp1",
        "rank": 1,
        "title": "면접 후 피드백을 주지 않아 억울하다",
        "summary": "최종 탈락 통보만 받고 사유를 알 수 없어 다음 면접 준비가 어렵다는 호소가 압도적으로 많다.",
        "severity": "high",
        "empathy": 6040,
        "comments": 435,
        "sources": {
          "reddit": 300,
          "naver": 274,
          "hackernews": 224,
          "appstore": 130,
          "playstore": 105,
          "trustpilot": 110,
          "youtube": 92
        },
        "emotions": {
          "분노": 41,
          "좌절": 33,
          "무력감": 18,
          "불안": 8
        },
        "samples": [
          {
            "src": "reddit",
            "title": "How do I tell him",
            "up": 6040,
            "link": "https://i.redd.it/sf9abzdsla1h1.jpeg"
          },
          {
            "src": "reddit",
            "title": "This is the clown work they are selling folks now",
            "up": 597,
            "link": "https://i.redd.it/3uoug4qx4c1h1.jpeg"
          },
          {
            "src": "reddit",
            "title": "Im about to be fired and I am scared. Age 50",
            "up": 551,
            "link": "https://www.reddit.com/r/jobs/comments/1tedk43/im_about_to_be_fired_and_i_am_scared_age_50/"
          }
        ]
      },
      {
        "id": "pp2",
        "rank": 2,
        "title": "채용 공고와 실제 업무가 달라 입사 후 실망",
        "summary": "JD에 적힌 역할과 실제 R&R이 다른 사례가 직군 무관하게 반복 등장. \"미끼 공고\"라는 표현이 자주 나옴.",
        "severity": "mid",
        "empathy": 506,
        "comments": 107,
        "sources": {
          "reddit": 300,
          "naver": 219,
          "hackernews": 110,
          "appstore": 82,
          "playstore": 65,
          "trustpilot": 89,
          "youtube": 51
        },
        "emotions": {
          "배신감": 38,
          "분노": 24,
          "후회": 22,
          "좌절": 16
        },
        "samples": [
          {
            "src": "reddit",
            "title": "Just how many x on this UnMerrygoRound must I take?!!!",
            "up": 506,
            "link": "https://i.redd.it/3f94lwykzc1h1.jpeg"
          },
          {
            "src": "reddit",
            "title": "Friendly reminder to not take things personal and it’s not because your resume sucks or you do. The market is BAD!!",
            "up": 395,
            "link": "https://www.reddit.com/r/recruitinghell/comments/1tdzdhk/friendly_reminder_to_not_take_things_personal_and/"
          },
          {
            "src": "reddit",
            "title": "FAANG Interviewer Hung Up On Me",
            "up": 359,
            "link": "https://www.reddit.com/r/recruitinghell/comments/1te9iyg/faang_interviewer_hung_up_on_me/"
          }
        ]
      },
      {
        "id": "pp3",
        "rank": 3,
        "title": "이력서·자기소개서 작성에 너무 많은 시간이 든다",
        "summary": "한 자리에 평균 4–6시간을 쓴다는 응답이 다수. 회사별 맞춤이 강요되는 한국 시장 특성과 결합.",
        "severity": "mid",
        "empathy": 340,
        "comments": 293,
        "sources": {
          "reddit": 300,
          "naver": 198,
          "hackernews": 100,
          "appstore": 38,
          "playstore": 32,
          "trustpilot": 61,
          "youtube": 41
        },
        "emotions": {
          "피로감": 49,
          "좌절": 21,
          "무력감": 18,
          "불안": 12
        },
        "samples": [
          {
            "src": "reddit",
            "title": "Anyone join a stand up and didn’t intend to have the camera on? What happened?",
            "up": 340,
            "link": "https://www.reddit.com/r/cscareerquestions/comments/1tdxdb9/anyone_join_a_stand_up_and_didnt_intend_to_have/"
          },
          {
            "src": "reddit",
            "title": "I’m genuinely losing it. (Vent)",
            "up": 317,
            "link": "https://i.redd.it/estwddzh7d1h1.jpeg"
          },
          {
            "src": "reddit",
            "title": "Is this suit okay for interviews?",
            "up": 277,
            "link": "https://i.redd.it/hw6we836kb1h1.jpeg"
          }
        ]
      }
    ],
    "ideas": [
      {
        "id": "i1",
        "rank": 1,
        "title": "면접 피드백 자동 생성 SaaS",
        "oneliner": "면접관 메모 한 줄을 입력하면 합·불 사유와 개선 가이드를 자동 생성해 지원자에게 발송.",
        "linkedPainpoint": "pp1",
        "target": "중견기업 인사팀 · 채용 에이전시",
        "revenue": "B2B SaaS · 시트당 월 ₩39,000",
        "mvp": [
          "면접관 한 줄 메모 입력 → GPT-4o가 합/불 사유 3문장 생성",
          "지원자 발송용 이메일 템플릿 자동 채움 + 발송 로그",
          "법적 리스크 검수 룰셋 (차별·성희롱 표현 자동 마스킹)"
        ],
        "market": "국내 1조 8,000억원 · 글로벌 약 32조원 (HR Tech 2024 IDC)",
        "verdict": "틈새 존재",
        "verdictTone": "violet",
        "competitors": [
          {
            "name": "Lattice (US)",
            "url": "lattice.com",
            "price": "$8–11/seat",
            "target": "Mid-market 전반",
            "weakness": "한국 채용 프로세스 미대응, 면접 피드백 모듈 부재"
          },
          {
            "name": "Greenhouse",
            "url": "greenhouse.io",
            "price": "Enterprise quote",
            "target": "Enterprise ATS",
            "weakness": "피드백은 면접관에게만 노출, 지원자 자동 발송 없음"
          },
          {
            "name": "원티드",
            "url": "wanted.co.kr",
            "price": "성공보수 7%",
            "target": "지원자 매칭",
            "weakness": "ATS 기능 없음, 면접 피드백 워크플로우 부재"
          }
        ],
        "moats": [
          "면접 메모 → 지원자 친화 표현 변환 데이터셋 (한국어 특화)",
          "차별·성희롱 표현 검수 룰셋 (법무팀과 공동 검증)",
          "공감 글 6,040건의 \"좋은 피드백\" 패턴 학습 데이터"
        ]
      },
      {
        "id": "i2",
        "rank": 2,
        "title": "채용공고 진실성 검증 플랫폼",
        "oneliner": "현직자 익명 검증으로 \"JD vs 실제 업무\" 일치도를 점수화. 공고 옆에 신뢰 배지 표시.",
        "linkedPainpoint": "pp2",
        "target": "20–30대 구직자 · 이직 활성층",
        "revenue": "프리미엄 구독 (₩9,900/월) + B2B 신뢰 배지 라이선스",
        "mvp": [
          "공고 URL 입력 → 현직자 1줄 검증 모집 (₩2,000 보상)",
          "JD 키워드 vs 응답 일치도 → 0–100점 신뢰 스코어",
          "Chrome 확장 — 잡코리아·사람인 위에 배지 오버레이"
        ],
        "market": "국내 채용공고 연 480만건 · 검증 시장 약 600억원 추정",
        "verdict": "블루오션",
        "verdictTone": "positive",
        "competitors": [
          {
            "name": "잡플래닛",
            "url": "jobplanet.co.kr",
            "price": "리뷰 1건/노출",
            "target": "기업 리뷰 일반",
            "weakness": "회사 단위 평가, 공고 단위 검증 없음"
          },
          {
            "name": "원티드 인사이트",
            "url": "wanted.co.kr/insight",
            "price": "무료",
            "target": "기업 인사이트",
            "weakness": "공고 단위 검증 없음, 현직자 응답률 낮음"
          },
          {
            "name": "Glassdoor",
            "url": "glassdoor.com",
            "price": "리뷰 교환",
            "target": "글로벌 리뷰",
            "weakness": "한국 데이터 빈약, 공고 단위 평가 불가"
          }
        ],
        "moats": [
          "공고 단위 신뢰 스코어 — 경쟁자는 회사 단위만 평가",
          "현직자 보상 네트워크 (선점 효과)",
          "확장 프로그램으로 \"외부 채용 사이트 위 노출\" 분배 채널 확보"
        ]
      },
      {
        "id": "i3",
        "rank": 3,
        "title": "AI 자소서 멀티버전 라이터",
        "oneliner": "기본 이력 한 번 입력 → 회사별 톤·강조 포인트 자동 변주. 4시간 → 12분.",
        "linkedPainpoint": "pp3",
        "target": "신입·주니어 구직자",
        "revenue": "Freemium · 월 3건 무료 / 무제한 ₩6,900",
        "mvp": [
          "기본 프로필 한 번 입력 (이력·프로젝트·강점)",
          "회사 JD 붙여넣기 → 회사 톤 분석 + 자소서 4문항 자동 작성",
          "표절률·AI 탐지 회피 점수 자동 표시"
        ],
        "market": "국내 자소서 작성 도구 시장 약 280억원 (2024)",
        "verdict": "레드오션",
        "verdictTone": "warn",
        "competitors": [
          {
            "name": "잡다 AI매칭",
            "url": "jobda.im",
            "price": "무료",
            "target": "신입 채용",
            "weakness": "이력 자동 생성에 한정, 회사별 변주 없음"
          },
          {
            "name": "자소설닷컴",
            "url": "jasoseol.com",
            "price": "₩9,900/월",
            "target": "취준생",
            "weakness": "AI 생성 품질 편차 큼, 톤 매칭 약함"
          },
          {
            "name": "노션 AI",
            "url": "notion.so",
            "price": "$10/월",
            "target": "범용",
            "weakness": "한국 자소서 포맷 미학습"
          },
          {
            "name": "ChatGPT",
            "url": "chatgpt.com",
            "price": "$20/월",
            "target": "범용",
            "weakness": "회사 톤 학습 없음, 매번 프롬프트 필요"
          }
        ],
        "moats": [
          "JD → 회사 톤 분류기 (수집된 공고 480만건 학습)",
          "자소서 4문항 한국형 템플릿 데이터셋"
        ]
      }
    ]
  }
};
