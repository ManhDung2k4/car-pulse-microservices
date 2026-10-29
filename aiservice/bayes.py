def calculate_new_confidence(current_score: float, impact_direction: int, impact_magnitude: int, credibility_weight: int, relevance_score: float = 1.0):
    if impact_direction == 0:
        return current_score, "N/A (0%)"

    # Công thức toán học mở rộng (Bayesian-like heuristic với bộ lọc tương đồng Cosine)
    # Lực tác động dịch chuyển phụ thuộc chặt chẽ vào việc lập luận đó có sát với dữ liệu báo chí thực tế hay không
    shift = impact_direction * (impact_magnitude * credibility_weight * 1.5 * relevance_score)
    new_score = current_score + shift

    new_score = max(5.0, min(99.0, new_score))
    actual_change = new_score - current_score
    trend = "TĂNG" if actual_change > 0 else "GIẢM"
    
    adjustment_text = f"{trend} {abs(actual_change):.1f}% (Từ {current_score:.1f}% -> {new_score:.1f}%)"
    return round(new_score, 1), adjustment_text