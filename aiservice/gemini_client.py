# import os
# from openai import OpenAI

# import os
# from dotenv import load_dotenv
# from openai import OpenAI

# load_dotenv()

# print("API_KEY =", os.getenv("OPENAI_API_KEY"))
# print("BASE_URL =", os.getenv("OPENAI_BASE_URL"))

# client = OpenAI(
#     api_key=os.getenv("OPENAI_API_KEY"),
#     base_url=os.getenv("OPENAI_BASE_URL")
# )

# # client = OpenAI(
# #     api_key=os.getenv("OPENAI_API_KEY"),
# #     base_url=os.getenv("OPENAI_BASE_URL")
# # )

# # def ask_gemini(prompt: str):

# #     response = client.chat.completions.create(
# #         model="openai:gpt-4.1-mini",
# #         messages=[
# #             {
# #                 "role": "system",
# #                 "content": "Bạn là chuyên gia tư vấn ô tô."
# #             },
# #             {
# #                 "role": "user",
# #                 "content": prompt
# #             }
# #         ],
# #         temperature=0.3
# #     )
# # ... existing code ...
# def ask_gemini(prompt: str):

#     response = client.chat.completions.create(
#         model="gemini-2.5-flash", # Cập nhật model ở đây
#         messages=[
#             {
#                 "role": "system",
#                 "content": "Bạn là chuyên gia tư vấn ô tô."
#             },
#             {
#                 "role": "user",
#                 "content": prompt
#             }
#         ],
#         temperature=0.3
#     )
#     return response.choices[0].message.content

#     # THÊM HÀM MỚI NÀY VÀO CUỐI FILE
# def analyze_market_argument(context: str, current_forecast: str, current_score: float, user_argument: str):
#     prompt = f"""
# Bạn là một Chuyên gia Phân tích Dữ liệu Ô tô khách quan. Nhiệm vụ của bạn là đánh giá lập luận của người dùng.

# Quy tắc bắt buộc:
# 1. KHÔNG tranh cãi cảm tính. KHÔNG đưa ra lời khuyên đầu tư.
# 2. NẾU lập luận hợp lý và có dữ liệu hỗ trợ từ Context, phải thừa nhận.
# 3. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON. Không giải thích lằng nhằng.

# Dự báo hiện tại: {current_forecast}
# Điểm tin cậy hiện tại: {current_score}%

# Dữ liệu báo chí hệ thống thu thập được (Context):
# {context}

# Lập luận của người dùng: "{user_argument}"

# TRẢ VỀ DUY NHẤT 1 OBJECT JSON THEO FORMAT SAU:
# {{
#     "evaluation": "Đánh giá logic lập luận người dùng ngắn gọn",
#     "evidence": "Trích dẫn bằng chứng từ Context (nếu có)",
#     "impact": "Mô tả ngắn gọn tác động tới dự báo hiện tại",
#     "impact_direction": 1, 
#     "impact_magnitude": 3 
# }}
# *Lưu ý impact_direction: 1 (Củng cố dự báo), -1 (Phản bác dự báo), 0 (Không liên quan). impact_magnitude từ 1 (Rất yếu) đến 5 (Rất mạnh).
# """
#     response = client.chat.completions.create(
#         model="gemini-2.5-flash", # Cập nhật model ở đây
#         messages=[
#             {"role": "system", "content": "Bạn là máy chủ phân tích dữ liệu, chỉ trả về chuỗi JSON."},
#             {"role": "user", "content": prompt}
#         ],
#         temperature=0.1 # Để temperature thấp (0.1) để AI không sáng tạo bậy bạ
#     )
#     return response.choices[0].message.content

import time
import os
import json
from dotenv import load_dotenv
# from openai import OpenAI
from openai import (
    OpenAI,
    APIError,
    RateLimitError,
    InternalServerError
)


load_dotenv()

print("API_KEY =", os.getenv("OPENAI_API_KEY"))
print("BASE_URL =", os.getenv("OPENAI_BASE_URL"))

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

def call_gemini(messages, temperature=0.3):

    models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ]

    last_error = None

    for model in models:

        for attempt in range(3):

            try:

                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature
                )

                return response

            except (
                InternalServerError,
                RateLimitError,
                APIError
            ) as e:

                last_error = e

                print(
                    f"[Gemini Retry] "
                    f"Model={model}, "
                    f"Attempt={attempt+1}, "
                    f"Error={e}"
                )

                time.sleep(3)

            except Exception as e:

                last_error = e

                print(
                    f"[Gemini Fatal] "
                    f"Model={model}, "
                    f"Error={e}"
                )

                break

    raise last_error


# def ask_gemini(prompt: str):

#     response = client.chat.completions.create(
#         model="gemini-2.5-flash", # Cập nhật model ở đây
#         messages=[
#             {
#                 "role": "system",
#                 "content": "Bạn là chuyên gia tư vấn ô tô."
#             },
#             {
#                 "role": "user",
#                 "content": prompt
#             }
#         ],
#         temperature=0.3
#     )
#     return response.choices[0].message.content

def ask_gemini(prompt: str):

    try:

        response = call_gemini(
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là chuyên gia tư vấn ô tô."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        return response.choices[0].message.content

    except Exception as e:

        print("Lỗi Gemini:", e)

        return """
Xin lỗi, hệ thống AI hiện đang quá tải.
Vui lòng thử lại sau vài phút.
"""

# def analyze_market_argument(context: str, current_forecast: str, current_score: float, user_argument: str):
#     prompt = f"""
#         Bạn là một Chuyên gia Phân tích Dữ liệu Ô tô khách quan. Nhiệm vụ của bạn là đánh giá lập luận của người dùng.

#         Quy tắc bắt buộc:
#         1. KHÔNG tranh cãi cảm tính. KHÔNG đưa ra lời khuyên đầu tư.
#         2. NẾU lập luận hợp lý và có dữ liệu hỗ trợ từ Context, phải thừa nhận.
#         3. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON. Không giải thích lằng nhằng.

#         Dự báo hiện tại: {current_forecast}
#         Điểm tin cậy hiện tại: {current_score}%

#         Dữ liệu báo chí hệ thống thu thập được (Context):
#         {context}

#         Lập luận của người dùng: "{user_argument}"

#         TRẢ VỀ DUY NHẤT 1 OBJECT JSON THEO FORMAT SAU:
#         {{
#             "evaluation": "Đánh giá logic lập luận người dùng ngắn gọn",
#             "evidence": "Trích dẫn bằng chứng từ Context (nếu có)",
#             "impact": "Mô tả ngắn gọn tác động tới dự báo hiện tại",
#             "impact_direction": 1, 
#             "impact_magnitude": 3 
#         }}
#         *Lưu ý impact_direction: 1 (Củng cố dự báo), -1 (Phản bác dự báo), 0 (Không liên quan). impact_magnitude từ 1 (Rất yếu) đến 5 (Rất mạnh).
#         """
#     response = client.chat.completions.create(
#         model="gemini-2.5-flash", # Cập nhật model ở đây
#         messages=[
#             {"role": "system", "content": "Bạn là máy chủ phân tích dữ liệu, chỉ trả về chuỗi JSON."},
#             {"role": "user", "content": prompt}
#         ],
#         temperature=0.1 # Để temperature thấp (0.1) để AI không sáng tạo bậy bạ
#     )
    
#     # Lấy chuỗi raw từ Gemini
#     raw_text = response.choices[0].message.content.strip()

#     # Bóc tách thẻ markdown (nếu có) do Gemini sinh ra
#     if raw_text.startswith("```json"):
#         raw_text = raw_text[7:]
#     elif raw_text.startswith("```"):
#         raw_text = raw_text[3:]
        
#     if raw_text.endswith("```"):
#         raw_text = raw_text[:-3]

#     # Parse chuỗi JSON sạch thành Object và trả về
#     return json.loads(raw_text.strip())

def analyze_market_argument(
    context: str,
    current_forecast: str,
    current_score: float,
    user_argument: str
):

    prompt = f"""
Bạn là một Chuyên gia Phân tích Dữ liệu Ô tô khách quan. Nhiệm vụ của bạn là đánh giá lập luận của người dùng.

Quy tắc bắt buộc:
1. KHÔNG tranh cãi cảm tính.
2. KHÔNG đưa ra lời khuyên đầu tư.
3. NẾU lập luận hợp lý và có dữ liệu hỗ trợ từ Context, phải thừa nhận.
4. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON.

Dự báo hiện tại: {current_forecast}
Điểm tin cậy hiện tại: {current_score}%

Dữ liệu báo chí:
{context}

Lập luận người dùng:
{user_argument}

Trả về duy nhất JSON:

{{
    "evaluation": "",
    "evidence": "",
    "impact": "",
    "impact_direction": 0,
    "impact_magnitude": 0
}}
"""

    try:

        response = call_gemini(
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là máy chủ phân tích dữ liệu, chỉ trả về JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1
        )

        raw_text = response.choices[0].message.content.strip()

        # Bỏ markdown
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]

        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]

        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        try:

            return json.loads(raw_text.strip())

        except json.JSONDecodeError as e:

            print("JSON Parse Error:", e)
            print("Raw Response:", raw_text)

            return {
                "evaluation": "AI trả về JSON không hợp lệ.",
                "evidence": "",
                "impact": "",
                "impact_direction": 0,
                "impact_magnitude": 0
            }

    except Exception as e:

        print("Gemini Debate Error:", e)

        return {
            "evaluation": "AI hiện đang quá tải.",
            "evidence": "",
            "impact": "Không thể phân tích dữ liệu lúc này.",
            "impact_direction": 0,
            "impact_magnitude": 0
        }