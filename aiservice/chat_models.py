from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    userId: int
    message: str

class DebateRequest(BaseModel):
    # userId: int # BẮT BUỘC THÊM DÒNG NÀY
    # user_argument: str
    # credibility_weight: int
    # current_score: float
    # current_forecast: str
    # scenario_id: Optional[int] = 1 # Cấu hình tùy chọn để không bị lỗi nếu thiếu
    userId: int
    scenario_id: Optional[int] = 1  # Bắt buộc thêm dòng này
    user_argument: str
    credibility_weight: int
    current_score: float
    current_forecast: str