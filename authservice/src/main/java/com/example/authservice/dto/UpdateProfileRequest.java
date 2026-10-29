package com.example.authservice.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateProfileRequest {
    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;
    
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String phone, String fullName) {
        this.phone = phone;
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
