package com.example.carservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    // Khóa bí mật copy từ Auth Service sang application.properties của Car Service
    @Value("${jwt.secret}")
    private String secretKey;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // Lấy toàn bộ thông tin trong Token
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Lấy Email
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Lấy Quyền (Role)
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // Kiểm tra Token còn hạn không
    public boolean isTokenValid(String token) {
        try {
            return extractAllClaims(token).getExpiration().after(new Date());
        } catch (Exception e) {
            return false; // Token hỏng, sai chữ ký, hoặc hết hạn
        }
    }
}