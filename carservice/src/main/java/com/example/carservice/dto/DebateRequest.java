// package com.example.carservice.dto;

// import com.fasterxml.jackson.annotation.JsonProperty;
// import lombok.Data;
// import lombok.NoArgsConstructor;
// import lombok.AllArgsConstructor;

// @Data
// @NoArgsConstructor
// @AllArgsConstructor
// public class DebateRequest {
//     private Long userId;
//     // THÊM 2 HÀM GETTER/SETTER (nếu Lombok không tự generate vì lý do nào đó)
//     public Long getUserId() {
//         return userId;
//     }

//     public void setUserId(Long userId) {
//         this.userId = userId;
//     }
    
//     // Đổi tên biến sang snake_case để map trực tiếp với Python và Frontend
//     private String user_argument;
//     private Integer credibility_weight;
//     private Double current_score;
//     private String current_forecast;

//     // // Ánh xạ JSON snake_case từ Frontend/Python sang camelCase của Java
//     // @JsonProperty("user_argument")
//     // private String userArgument;

//     // @JsonProperty("credibility_weight")
//     // private Integer credibilityWeight;

//     // @JsonProperty("current_score")
//     // private Double currentScore;

//     // @JsonProperty("current_forecast")
//     // private String currentForecast;
// }

package com.example.carservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Thêm import này

@JsonIgnoreProperties(ignoreUnknown = true) // BẮT BUỘC THÊM: Chống crash khi JSON lệch chuẩn
public class DebateRequest {

    @JsonProperty("userId")
    private Long userId;
    
    @JsonProperty("scenario_id")
    private Long scenarioId; // Bổ sung trường này để map với React

    @JsonProperty("user_argument")
    private String userArgument;

    @JsonProperty("credibility_weight")
    private Integer credibilityWeight;

    @JsonProperty("current_score")
    private Double currentScore;

    @JsonProperty("current_forecast")
    private String currentForecast;
    public DebateRequest() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserArgument() {
        return userArgument;
    }

    public void setUserArgument(String userArgument) {
        this.userArgument = userArgument;
    }

    public Integer getCredibilityWeight() {
        return credibilityWeight;
    }

    public void setCredibilityWeight(Integer credibilityWeight) {
        this.credibilityWeight = credibilityWeight;
    }

    public Double getCurrentScore() {
        return currentScore;
    }

    public void setCurrentScore(Double currentScore) {
        this.currentScore = currentScore;
    }

    public String getCurrentForecast() {
        return currentForecast;
    }

    public void setCurrentForecast(String currentForecast) {
        this.currentForecast = currentForecast;
    }

    public Long getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(Long scenarioId) {
        this.scenarioId = scenarioId;
    }
}