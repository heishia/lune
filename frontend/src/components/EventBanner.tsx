import { X } from "lucide-react";
import { useState, useEffect } from "react";

export interface EventBannerData {
  id: string;
  title: string;
  bannerImage: string;
  content: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

interface EventBannerProps {
  event: EventBannerData;
  onClose: () => void;
  onClick: () => void;
}

export function EventBanner({ event, onClose, onClick }: EventBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 애니메이션을 위해 마운트 후 표시
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* 배너 콘텐츠 */}
      <div className="relative max-w-3xl mx-auto px-4 pb-3">
        <div 
          onClick={onClick}
          className="relative bg-white rounded-t-lg shadow-xl overflow-hidden cursor-pointer group"
        >
          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            aria-label="Close banner"
          >
            <X className="w-3 h-3 text-white" />
          </button>

          {/* 배너 이미지만 표시 */}
          <div className="relative w-full h-20 sm:h-24 overflow-hidden">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}