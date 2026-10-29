package com.example.carservice.exception;

import com.example.carservice.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private String generateRequestId() {
        return UUID.randomUUID().toString();
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .code("NOT_FOUND")
                .status(HttpStatus.NOT_FOUND.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex, HttpServletRequest request) {
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
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
        String requestId = generateRequestId();
        ApiErrorResponse response = ApiErrorResponse.builder()
                .error("INTERNAL_SERVER_ERROR")
                .message("Đã xảy ra lỗi, vui lòng thử lại")
                .code("SERVER_ERROR")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .requestId(requestId)
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}