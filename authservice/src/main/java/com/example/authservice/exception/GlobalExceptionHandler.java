// src/main/java/com/example/authservice/exception/GlobalExceptionHandler.java
package com.example.authservice.exception;

import com.example.authservice.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Generate request ID for tracking
    private String generateRequestId() {
        return UUID.randomUUID().toString();
    }

    @ExceptionHandler(DuplicateFieldException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateFieldException ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("DUPLICATE_FIELD")
                .message(ex.getMessage())
                .code("DUPLICATE_" + ex.getField().toUpperCase())
                .status(HttpStatus.CONFLICT.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .details(ex.getField())
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");

        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("VALIDATION_ERROR")
                .message(message)
                .code("INVALID_INPUT")
                .status(HttpStatus.BAD_REQUEST.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDbConstraint(DataIntegrityViolationException ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        String detail = ex.getMostSpecificCause().getMessage().toLowerCase();
        String message;
        String code;
        
        if (detail.contains("email")) {
            message = "Email này đã được đăng ký";
            code = "DUPLICATE_EMAIL";
        } else if (detail.contains("phone")) {
            message = "Số điện thoại này đã được đăng ký";
            code = "DUPLICATE_PHONE";
        } else {
            message = "Dữ liệu đã tồn tại trong hệ thống";
            code = "DUPLICATE_ENTRY";
        }

        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("DATABASE_CONSTRAINT")
                .message(message)
                .code(code)
                .status(HttpStatus.CONFLICT.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("AUTHENTICATION_FAILED")
                .message(ex.getMessage())
                .code("INVALID_CREDENTIALS")
                .status(HttpStatus.UNAUTHORIZED.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("INVALID_ARGUMENT")
                .message(ex.getMessage())
                .code("ILLEGAL_ARGUMENT")
                .status(HttpStatus.BAD_REQUEST.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(Exception ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("INTERNAL_SERVER_ERROR")
                .message("Đã xảy ra lỗi, vui lòng thử lại")
                .code("SERVER_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}