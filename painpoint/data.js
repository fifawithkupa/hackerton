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
      : ["naver", "youtube"];

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
      "id": "naver",
      "name": "네이버",
      "desc": "블로그·카페·지식인",
      "posts": 50,
      "defaultOn": true,
      "live": true,
      "free": true
    },
    {
      "id": "youtube",
      "name": "유튜브 댓글",
      "desc": "관련 영상 댓글",
      "posts": 80,
      "defaultOn": true,
      "live": true,
      "free": true
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
        "src": "네이버",
        "id": "naver",
        "n": 50,
        "t": "블로그·카페·지식인",
        "d": 1.2
      },
      {
        "src": "유튜브",
        "id": "youtube",
        "n": 80,
        "t": "관련 영상 댓글",
        "d": 2.0
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
          "naver": 274,
          "youtube": 92
        },
        "emotions": {
          "분노": 41,
          "좌절": 33,
          "무력감": 18,
          "불안": 8
        },
        "samples": []
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
          "naver": 219,
          "youtube": 51
        },
        "emotions": {
          "배신감": 38,
          "분노": 24,
          "후회": 22,
          "좌절": 16
        },
        "samples": []
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
          "naver": 198,
          "youtube": 41
        },
        "emotions": {
          "피로감": 49,
          "좌절": 21,
          "무력감": 18,
          "불안": 12
        },
        "samples": []
      }
    ],
    "ideas": window.PP_MOCK_IDEAS = [
      {
        "id": "i1",
        "rank": 1,
        "title": "데이터 파이프라인 품질 자동 모니터링 SaaS",
        "oneliner": "SQL 한 줄 연결만으로 파이프라인 전 구간 이상을 실시간 탐지. 이상 감지 시 슬랙 알림 + 원인 자동 추적.",
        "linkedPainpoint": "pp1",
        "target": "스타트업·중견기업 데이터팀 · 데이터 분석가",
        "revenue": "B2B SaaS · 파이프라인 수 기반 월 ₩49,000~",
        "mvp": [
          "DB 연결 → 컬럼 null·중복·범위 이탈 자동 탐지 (노코드 설정)",
          "Slack·이메일 알림 + 이상 레코드 샘플 링크 즉시 발송",
          "시간별 데이터 품질 점수 히스토리 대시보드"
        ],
        "market": "국내 데이터 품질 툴 시장 약 240억원 · 글로벌 $3.4B (2024 Gartner)",
        "verdict": "틈새 존재",
        "verdictTone": "violet",
        "competitors": [
          {
            "name": "Great Expectations",
            "url": "greatexpectations.io",
            "price": "오픈소스 / 유료",
            "target": "데이터 엔지니어",
            "weakness": "설정 복잡, 한국어 문서 전무, 비개발자 사용 불가"
          },
          {
            "name": "dbt Cloud",
            "url": "getdbt.com",
            "price": "$100~/월",
            "target": "Analytics Engineer",
            "weakness": "테스트 기능 한정, 실시간 모니터링 미지원"
          },
          {
            "name": "Atlan",
            "url": "atlan.com",
            "price": "Enterprise quote",
            "target": "대기업 데이터팀",
            "weakness": "SMB 가격 부담, 국내 레퍼런스 없음"
          }
        ],
        "moats": [
          "한국 SaaS·핀테크 DB 스키마 패턴 학습 → 이상 탐지 정확도 우위",
          "노코드 5분 설정 — 비개발자도 즉시 모니터링 시작",
          "파이프라인 실행 로그 연동으로 '왜 깨졌나' 원인 자동 추적"
        ]
      },
      {
        "id": "i2",
        "rank": 2,
        "title": "모바일 데이터 절약 코치 앱",
        "oneliner": "앱별 데이터 소모를 실시간 추적 후 낭비 패턴 분석 → 맞춤 절약 플랜과 요금제 최적 추천을 자동 제안.",
        "linkedPainpoint": "pp2",
        "target": "데이터 요금 민감 20~30대 · 알뜰폰 이용자",
        "revenue": "Freemium · 프리미엄 분석 ₩2,900/월",
        "mvp": [
          "앱별 데이터 소모 실시간 트래킹 (Android VPN API 활용)",
          "월 예산 설정 → 초과 예상 시 푸시 알림 즉시 발송",
          "통신사별 요금제 vs 실사용량 비교 리포트 자동 생성"
        ],
        "market": "국내 알뜰폰 가입자 1,700만명 · 데이터 관리 앱 시장 약 80억원",
        "verdict": "블루오션",
        "verdictTone": "positive",
        "competitors": [
          {
            "name": "SKT·KT·LGU+ 자사 앱",
            "url": "t-world.co.kr",
            "price": "무료",
            "target": "자사 고객",
            "weakness": "앱별 세부 내역 없음, 절약 가이드 부재, 타통신사 비교 불가"
          },
          {
            "name": "GlassWire",
            "url": "glasswire.com",
            "price": "$2.99/월",
            "target": "PC 보안 모니터링",
            "weakness": "모바일 기능 빈약, 한국 통신사 API 미연동"
          },
          {
            "name": "My Data Manager",
            "url": "mydatamanager.com",
            "price": "무료",
            "target": "글로벌 사용자",
            "weakness": "한국 알뜰폰·요금제 DB 없음, UI 구식"
          }
        ],
        "moats": [
          "한국 통신사·알뜰폰 120개 요금제 DB 실시간 갱신",
          "앱 카테고리별 '평균 소모량 대비 내 사용량' 벤치마크 제공",
          "절약 달성 시 포인트 지급 → 알뜰폰 요금 할인 연계 (바이럴)"
        ]
      },
      {
        "id": "i3",
        "rank": 3,
        "title": "개인 투자자용 데이터 기반 종목 스크리너",
        "oneliner": "흩어진 재무·뉴스·공시 데이터를 한 화면에 통합. 자연어로 조건을 입력하면 DART·KRX 데이터를 즉시 필터링.",
        "linkedPainpoint": "pp3",
        "target": "개인 투자자 · 주식 스터디 모임",
        "revenue": "프리미엄 구독 ₩9,900/월 · 종목 알림 API",
        "mvp": [
          "자연어 조건 입력 → SQL 자동 변환 → DART·KRX 필터링",
          "종목 비교표 자동 생성 (5개 핵심 지표 나란히 보기)",
          "조건 저장 → 신규 충족 종목 발생 시 카카오·슬랙 알림"
        ],
        "market": "국내 개인 투자자 1,400만명 · HTS 외 분석 툴 시장 약 350억원",
        "verdict": "레드오션",
        "verdictTone": "warn",
        "competitors": [
          {
            "name": "증권플러스",
            "url": "stockplus.com",
            "price": "무료",
            "target": "개인 투자자",
            "weakness": "자연어 검색 불가, 커스텀 스크리닝 없음"
          },
          {
            "name": "FnGuide",
            "url": "fnguide.com",
            "price": "기관 전용",
            "target": "기관·증권사",
            "weakness": "개인 구독 불가, UX 복잡, 가격 수백만원대"
          },
          {
            "name": "Finviz (US)",
            "url": "finviz.com",
            "price": "$24.96/월",
            "target": "글로벌 투자자",
            "weakness": "한국 주식 미지원, 공시·DART 미연동"
          },
          {
            "name": "토스증권",
            "url": "tossinvest.com",
            "price": "무료",
            "target": "MZ 투자자",
            "weakness": "스크리닝 기능 없음, 데이터 분석 도구 부재"
          }
        ],
        "moats": [
          "DART·KRX 공시 실시간 파싱 + 자연어 변환 파이프라인",
          "개인 투자자 커뮤니티 조건 공유 기능 (바이럴 루프)",
          "국내 재무데이터 10년치 정규화 DB (경쟁사 동급 구축 6개월↑)"
        ]
      }
    ]
  }
};
