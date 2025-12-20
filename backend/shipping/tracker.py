"""배송 추적 서비스

외부 택배사 API를 통한 배송 추적을 제공합니다.
"""
from typing import Optional, List
from datetime import datetime

import httpx

from backend.core.logger import get_logger
from backend.core.config import get_settings

logger = get_logger(__name__)
settings = get_settings()


# 택배사 코드 매핑
COURIER_CODES = {
    "cj": "04",        # CJ대한통운
    "hanjin": "05",    # 한진택배
    "lotte": "08",     # 롯데택배
    "post": "01",      # 우체국택배
    "logen": "06",     # 로젠택배
    "cvsnet": "24",    # 편의점택배
    "daesin": "22",    # 대신택배
    "ilyang": "11",    # 일양로지스
    "kyungdong": "23", # 경동택배
}

COURIER_NAMES = {
    "cj": "CJ대한통운",
    "hanjin": "한진택배",
    "lotte": "롯데택배",
    "post": "우체국택배",
    "logen": "로젠택배",
    "cvsnet": "편의점택배",
    "daesin": "대신택배",
    "ilyang": "일양로지스",
    "kyungdong": "경동택배",
}


class TrackingInfo:
    """배송 추적 정보"""
    
    def __init__(
        self,
        courier: str,
        tracking_number: str,
        status: str,
        progress: List[dict],
        estimated_delivery: Optional[datetime] = None,
    ):
        self.courier = courier
        self.courier_name = COURIER_NAMES.get(courier, courier)
        self.tracking_number = tracking_number
        self.status = status
        self.progress = progress
        self.estimated_delivery = estimated_delivery
    
    def to_dict(self) -> dict:
        return {
            "courier": self.courier,
            "courier_name": self.courier_name,
            "tracking_number": self.tracking_number,
            "status": self.status,
            "progress": self.progress,
            "estimated_delivery": self.estimated_delivery.isoformat() if self.estimated_delivery else None,
        }


class ShippingTracker:
    """배송 추적 클래스"""
    
    def __init__(self):
        # 스마트택배 API 등 외부 서비스 키
        self.api_key = getattr(settings, 'shipping_api_key', '')
    
    async def get_tracking_info(
        self,
        courier: str,
        tracking_number: str,
    ) -> Optional[TrackingInfo]:
        """배송 추적 정보 조회
        
        Args:
            courier: 택배사 코드 (cj, hanjin, lotte 등)
            tracking_number: 운송장번호
        
        Returns:
            TrackingInfo 또는 None
        """
        if not self.api_key:
            logger.warning("Shipping API key not configured")
            return self._get_mock_tracking(courier, tracking_number)
        
        try:
            courier_code = COURIER_CODES.get(courier, courier)
            
            # 스마트택배 API 예시 (실제 API에 맞게 수정 필요)
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://info.sweettracker.co.kr/api/v1/trackingInfo",
                    params={
                        "t_key": self.api_key,
                        "t_code": courier_code,
                        "t_invoice": tracking_number,
                    },
                    timeout=10.0,
                )
                
                if response.status_code != 200:
                    logger.error("Tracking API error: %s", response.text)
                    return None
                
                data = response.json()
                
                return TrackingInfo(
                    courier=courier,
                    tracking_number=tracking_number,
                    status=data.get("completeYN", "N"),
                    progress=[
                        {
                            "time": item.get("timeString"),
                            "location": item.get("where"),
                            "status": item.get("kind"),
                            "description": item.get("telno", ""),
                        }
                        for item in data.get("trackingDetails", [])
                    ],
                )
                
        except Exception as e:
            logger.error("Tracking API error: %s", str(e))
            return None
    
    def _get_mock_tracking(
        self,
        courier: str,
        tracking_number: str,
    ) -> TrackingInfo:
        """개발/테스트용 목 데이터"""
        return TrackingInfo(
            courier=courier,
            tracking_number=tracking_number,
            status="in_transit",
            progress=[
                {
                    "time": "2024-01-15 09:00",
                    "location": "서울 물류센터",
                    "status": "집하",
                    "description": "상품을 인수하였습니다.",
                },
                {
                    "time": "2024-01-15 14:00",
                    "location": "서울 허브",
                    "status": "이동중",
                    "description": "배송 중입니다.",
                },
            ],
            estimated_delivery=datetime.now(),
        )


# 싱글톤 인스턴스
shipping_tracker = ShippingTracker()


async def get_tracking(courier: str, tracking_number: str) -> Optional[dict]:
    """배송 추적 정보 조회 (헬퍼 함수)"""
    info = await shipping_tracker.get_tracking_info(courier, tracking_number)
    return info.to_dict() if info else None

