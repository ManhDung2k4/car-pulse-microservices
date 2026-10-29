package com.example.carservice.dto;

import lombok.Data;

@Data
public class AiChatResponse {

    private String answer;
    public AiChatResponse() {
    }
    public AiChatResponse(String answer) {
        this.answer = answer;
    }
    public String getAnswer() {
        return answer;
    }
    public void setAnswer(String answer) {
        this.answer = answer;
    }

}