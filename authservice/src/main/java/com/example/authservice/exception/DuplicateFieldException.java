// src/main/java/com/example/authservice/exception/DuplicateFieldException.java
package com.example.authservice.exception;

// Dùng chung cho cả email lẫn phone, phân biệt bằng field name
public class DuplicateFieldException extends RuntimeException {
    private final String field;

    public DuplicateFieldException(String field, String value) {
        super(field + " '" + value + "' đã được sử dụng");
        this.field = field;
    }

    public String getField() { return field; }
}