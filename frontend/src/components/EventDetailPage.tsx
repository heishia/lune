import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { EventBannerData } from "./EventBanner";
import { unsplash_tool } from "../tools";

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
}

// 임시 이벤트 데이터
const mockEvents: Record<string, EventBannerData> = {
  "winter-sale": {
    id: "winter-sale",
    title: "WINTER SALE 🎁 신규 회원 최대 30% 할인",
    bannerImage: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200",
    content: `🎉 LUNE 겨울 특별 세일 안내

안녕하세요, LUNE입니다.

따뜻한 겨울을 맞이하여 특별한 혜택을 준비했습니다.

【 행사 기간 】
2024년 11월 18일 - 12월 31일까지

【 할인 혜택 】
✨ 신규 회원: 전 상품 30% 할인
✨ 기존 회원: 전 상품 20% 할인  
✨ VIP 회원: 전 상품 35% 할인 + 무료배송

【 추가 혜택 】
• 5만원 이상 구매 시 에코백 증정
• 10만원 이상 구매 시 캐시미어 머플러 증정
• 첫 구매 고객 추가 5,000포인트 적립

【 주요 상품 】
• Cashmere Blend Knit Collection
• Wool Coat Series  
• Winter Essential Set

겨울 시즌 필수 아이템을 LUNE만의 감성으로 만나보세요.

자세한 문의사항은 고객센터(1577-LUNE)로 연락 주시기 바랍니다.

감사합니다.`,
    startDate: "2024-11-18",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-11-18",
  },
};

export function EventDetailPage({ eventId, onBack }: EventDetailPageProps) {
  const event = mockEvents[eventId];

  if (!event) {
    return (
      <div className="min-h-screen bg-brand-cream pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-warm-taupe tracking-wide">이벤트를 찾을 수 없습니다.</p>
          <button
            onClick={onBack}
            className="mt-8 px-12 py-3 bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe rounded-sm tracking-wider text-sm transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-brand-cream pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brand-terra-cotta hover:text-brand-warm-taupe transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm tracking-wider">돌아가기</span>
        </button>

        {/* 이벤트 카드 */}
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          {/* 배너 이미지 */}
          <div className="w-full h-64 sm:h-96 overflow-hidden">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 이벤트 정보 */}
          <div className="p-6 sm:p-10">
            {/* 타이틀 */}
            <h1 className="text-black tracking-wider mb-6 pb-6 border-b border-brand-warm-taupe/20">
              {event.title}
            </h1>

            {/* 날짜 정보 */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm text-black/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-terra-cotta" />
                <span className="tracking-wide">
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-terra-cotta" />
                <span className="tracking-wide">
                  등록일: {formatDate(event.createdAt)}
                </span>
              </div>
            </div>

            {/* 이벤트 내용 */}
            <div className="prose prose-sm max-w-none">
              <div 
                className="text-black/80 leading-relaxed tracking-wide whitespace-pre-wrap"
                style={{ wordBreak: 'keep-all' }}
              >
                {event.content}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            className="inline-block px-12 py-3 bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe rounded-sm tracking-wider text-sm transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}