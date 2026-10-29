package com.example.carservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public class ApiErrorResponse {
    private String error;
    private String message;
    private String code;
    private int status;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private String requestId;
    private String path;
    private Object details;

    public ApiErrorResponse() {}

    public ApiErrorResponse(String error, String message, String code, int status, LocalDateTime timestamp, String requestId, String path, Object details) {
        this.error = error;
        this.message = message;
        this.code = code;
        this.status = status;
        this.timestamp = timestamp;
        this.requestId = requestId;
        this.path = path;
        this.details = details;
    }

    // Getters and Setters
    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Object getDetails() {
        return details;
    }

    public void setDetails(Object details) {
        this.details = details;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String error;
        private String message;
        private String code;
        private int status;
        private LocalDateTime timestamp;
        private String requestId;
        private String path;
        private Object details;

        public Builder error(String error) {
            this.error = error;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder status(int status) {
            this.status = status;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder requestId(String requestId) {
            this.requestId = requestId;
            return this;
        }

        public Builder path(String path) {
            this.path = path;
            return this;
        }

        public Builder details(Object details) {
            this.details = details;
            return this;
        }

        public ApiErrorResponse build() {
            return new ApiErrorResponse(error, message, code, status, timestamp, requestId, path, details);
        }
    }

    public static ApiErrorResponse of(String error, String message, String code, int status, String requestId) {
        return ApiErrorResponse.builder()
                .error(error)
                .message(message)
                .code(code)
                .status(status)
                .timestamp(LocalDateTime.now())
                .requestId(requestId)
                .build();
    }
}
