import { ChevronLeft } from "lucide-react";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

// 개인정보처리방침 페이지 컴포넌트
export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-brand-warm-taupe/20 z-50">
        <div className="relative flex items-center justify-center px-4 py-8">
          <button 
            onClick={onBack}
            className="absolute left-4 p-2 hover:bg-brand-warm-taupe/10 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-brand-terra-cotta" />
          </button>
          <img src={logo} alt="LUNE" className="h-8 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-32 mobile-pt-24 pb-20 mobile-pb-12 px-4 mobile-px-3">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12 mobile-mb-8">
            <h1 className="text-2xl mobile-text-xl text-brand-terra-cotta tracking-wider">
              개인정보처리방침
            </h1>
          </div>

          {/* Content */}
          <div className="text-sm text-black/80 leading-relaxed">
            <div className="space-y-6">
              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제1조 (개인정보의 처리 목적)</h3>
                <p>
                  LUNE(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 
                  처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                  이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>회원 가입 및 관리: 회원제 서비스 제공에 따른 본인 식별, 회원자격 유지 및 관리</li>
                  <li>재화 또는 서비스 제공: 물품배송, 서비스 제공, 청구서 발송, 콘텐츠 제공, 맞춤서비스 제공</li>
                  <li>마케팅 및 광고에의 활용: 이벤트 및 광고성 정보 제공 및 참여기회 제공, 서비스의 유효성 확인</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제2조 (개인정보의 처리 및 보유기간)</h3>
                <p>
                  회사는 법령에 따른 개인정보 보유, 이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 
                  개인정보 보유, 이용기간 내에서 개인정보를 처리, 보유합니다.
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계법령에 따라 보존할 필요가 있는 경우 해당 기간까지)</li>
                  <li>재화 또는 서비스 제공: 재화, 서비스 공급완료 및 요금결제, 정산 완료 시까지</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제3조 (처리하는 개인정보 항목)</h3>
                <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>필수항목: 이메일, 비밀번호, 이름, 휴대폰번호</li>
                  <li>선택항목: 주소, 마케팅 수신 동의 여부</li>
                  <li>서비스 이용과정에서 자동 생성되는 정보: IP주소, 쿠키, 접속로그, 서비스 이용기록</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제4조 (개인정보의 제3자 제공)</h3>
                <p>
                  회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 
                  정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 
                  제3자에게 제공합니다.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제5조 (개인정보처리의 위탁)</h3>
                <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>배송업무: 택배사 (CJ대한통운, 롯데택배 등)</li>
                  <li>결제처리: 결제대행사 (PG사)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제6조 (정보주체의 권리, 의무 및 행사방법)</h3>
                <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>개인정보 열람요구</li>
                  <li>오류 등이 있을 경우 정정 요구</li>
                  <li>삭제요구</li>
                  <li>처리정지 요구</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제7조 (개인정보의 파기)</h3>
                <p>
                  회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
                  지체없이 해당 개인정보를 파기합니다.
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>전자적 파일 형태: 복구 및 재생되지 않도록 안전하게 삭제</li>
                  <li>기록물, 인쇄물, 서면 등: 분쇄기로 분쇄하거나 소각</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제8조 (개인정보의 안전성 확보조치)</h3>
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>관리적 조치: 내부관리계획 수립, 시행, 정기적 직원 교육</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제9조 (개인정보 보호책임자)</h3>
                <p>
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 
                  불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="mt-2 p-3 bg-brand-warm-taupe/10 rounded-md">
                  <p><strong>개인정보 보호책임자</strong></p>
                  <p>성명: LUNE 고객센터</p>
                  <p>연락처: support@lune.co.kr</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-brand-terra-cotta mb-2">제10조 (개인정보처리방침 변경)</h3>
                <p>
                  이 개인정보처리방침은 2024년 1월 1일부터 적용됩니다. 
                  이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

