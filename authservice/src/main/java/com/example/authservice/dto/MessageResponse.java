package com.example.authservice.dto;

public class MessageResponse {
    private String message;

    public MessageResponse() {}

    public MessageResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String message;

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public MessageResponse build() {
            return new MessageResponse(message);
        }
    }
}
