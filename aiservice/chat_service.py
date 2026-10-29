import pandas as pd
import re

from gemini_client import ask_gemini


def chat_with_ai(user_id, message):

    # Import bên trong hàm để tránh circular import
    import main

    # ==========================
    # Lưu câu hỏi user
    # ==========================
    main.save_chat(
        user_id=user_id,
        role="user",
        message=message
    )

    # ==========================
    # Lấy lịch sử chat
    # ==========================
    history_rows = main.get_chat_history(user_id)

    history_text = ""

    for row in history_rows:
        history_text += f"{row.role}: {row.message}\n"

    # ==========================
    # Lấy dữ liệu xe
    # ==========================
    df = main.get_clustered_df()

    msg_lower = message.lower()

    brands = [
        "toyota",
        "honda",
        "ford",
        "hyundai",
        "kia",
        "mazda",
        "vinfast",
        "mercedes",
        "bmw",
        "audi",
        "lexus",
        "mitsubishi",
        "chevrolet",
        "nissan",
        "suzuki"
    ]

    words = re.findall(r"\w+", msg_lower)

    found_brands = set()

    for word in words:
        if len(word) >= 3:
            for brand in brands:
                if brand.startswith(word):
                    found_brands.add(brand)

    found_brands = list(found_brands)

    years_in_msg = re.findall(
        r"\b(19\d{2}|20\d{2})\b",
        msg_lower
    )

    # ==========================
    # Lọc xe theo hãng
    # ==========================
    if found_brands:

        search_pattern = "|".join(found_brands)

        filtered_df = df[
            df["tieu_de"]
            .str.lower()
            .str.contains(
                search_pattern,
                na=False
            )
        ]

        if years_in_msg:

            year_filtered = filtered_df[
                filtered_df["nam_sx"]
                .astype(str)
                .isin(years_in_msg)
            ]

            if not year_filtered.empty:
                filtered_df = year_filtered

        sample_df = filtered_df.head(20)

    else:

        sample_df = (
            df.sample(min(20, len(df)))
            if not df.empty
            else df
        )

    # ==========================
    # Chuẩn bị dữ liệu cho AI
    # ==========================
    cars = []

    for _, row in sample_df.iterrows():

        cars.append({
            "title": row.get("tieu_de", ""),
            "price": row.get("gia", ""),
            "fuel": row.get("nhien_lieu", ""),
            "year": row.get("nam_sx", "")
        })

    # ==========================
    # Prompt
    # ==========================
    prompt = f"""
Lịch sử hội thoại:
{history_text}

Câu hỏi hiện tại:
{message}

Danh sách xe hiện có trong kho:
{cars}

Bạn là chuyên gia tư vấn ô tô.

Hãy dựa vào toàn bộ lịch sử hội thoại để trả lời.

Nếu khách đang hỏi tiếp một câu trước đó như:
- tại sao?
- còn xe khác không?
- xe nào tốt hơn?
- so sánh chúng đi

thì phải hiểu ngữ cảnh từ các tin nhắn trước.

Chỉ được đề xuất xe có trong danh sách.
Không được bịa thông tin.
Trả lời ngắn gọn, thân thiện và chuyên nghiệp.
"""

    # ==========================
    # Gọi Gemini
    # ==========================
    response = ask_gemini(prompt)

    # ==========================
    # Lưu câu trả lời AI
    # ==========================
    main.save_chat(
        user_id=user_id,
        role="assistant",
        message=response
    )

    return response