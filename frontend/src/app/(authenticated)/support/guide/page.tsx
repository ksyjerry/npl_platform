export default function GuidePage() {
  const sections = [
    {
      title: "서비스 개요",
      content:
        "삼일PwC 온라인 NPL 플랫폼은 매도인(금융기관)·매수인(F&I, 자산운용사)·회계법인(삼일PwC) 간의 NPL 거래를 중개하는 온라인 플랫폼입니다. Pool 거래 정보 조회, 거래 자료 등록·다운로드, 상담 신청 등의 기능을 제공합니다.",
      note: "모든 거래 정보는 역할 기반 접근 제어(RBAC)에 따라 관리됩니다.",
    },
    {
      title: "회원가입 안내",
      content:
        "회원가입 페이지에서 필수 정보를 입력하고 약관에 동의한 후 가입할 수 있습니다. 가입 직후에는 '인증 대기(pending)' 상태이며, 관리자가 회원 정보를 확인하고 역할을 부여한 후 서비스를 이용할 수 있습니다.",
      note: "관리자 인증이 완료되면 이메일 또는 유선으로 안내드립니다.",
    },
    {
      title: "Pool 거래현황 이용 방법",
      content:
        "거래현황 메뉴에서 현재 진행 중이거나 종결된 Pool 목록을 확인할 수 있습니다. 진행 중(active) Pool은 기본 정보만 제공되며, 종결(closed) Pool은 해당 거래에 참여 이력이 있는 업체에 한해 상세 정보를 열람할 수 있습니다.",
      note: "담보유형, 매도인, 매수인 등 일부 필드는 참여 이력이 있는 업체에게만 공개됩니다.",
    },
    {
      title: "거래자료 등록/다운로드",
      content:
        "거래자료 메뉴에서 역할에 따라 자료를 등록하고 다운로드할 수 있습니다. 매도인은 매도인 자료, 매수인은 매수인 자료에 접근할 수 있으며, 회계법인(삼일PwC)은 모든 자료에 접근 가능합니다.",
      note: "지원 파일 형식: PDF, XLSX, XLS, DOCX, DOC, ZIP, CSV, HWP (최대 500MB)",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Title bar */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h1 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
          이용가이드
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
          삼일PwC NPL 플랫폼의 주요 기능과 이용 방법을 안내합니다.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-10">
        {sections.map((s, i) => (
          <div key={i}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: "#2D2D2D" }}>
              {i + 1}. {s.title}
            </h3>
            <p className="text-base leading-relaxed mb-4" style={{ color: "#464646" }}>
              {s.content}
            </p>
            <div
              className="pl-4 text-sm"
              style={{
                borderLeft: "4px solid #D04A02",
                color: "#7D7D7D",
              }}
            >
              {s.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
