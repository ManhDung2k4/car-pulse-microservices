package com.example.carservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebateResponse {

    private String evaluation;
    
    private String evidence;
    
    private String impact;
    
    private Double relevance;
    
    private String adjustment;

    // Python đang trả về "newScore" viết liền camelCase, nên ta giữ nguyên
    @JsonProperty("newScore")
    private Double newScore;
}