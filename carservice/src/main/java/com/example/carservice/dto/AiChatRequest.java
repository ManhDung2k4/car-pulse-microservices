package com.example.carservice.dto;

import lombok.Data;

@Data
public class AiChatRequest {
    private Long userId;
    private String message;
    
    // THÊM 2 HÀM GETTER/SETTER CHO USERID
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public AiChatRequest() {
    }
    public AiChatRequest(String message) {
        this.message = message;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }

}