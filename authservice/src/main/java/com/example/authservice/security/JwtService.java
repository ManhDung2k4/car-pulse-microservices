package com.example.authservice.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // Thêm biến này dưới jwtExpiration
@Value("${jwt.refresh-expiration}")
private long refreshExpiration;

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId, String email, String role) {

        Date now = new Date();
        Date expiredAt = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(email)
                .claim("id", userId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiredAt)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        return extractAllClaims(token)
                .getExpiration()
                .after(new Date());
    }

    // Thêm hàm tạo Refresh Token (Không chứa role hay id để nhẹ gọn)
public String generateRefreshToken(String email) {
    Date now = new Date();
    Date expiredAt = new Date(now.getTime() + refreshExpiration);

    return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(now)
            .setExpiration(expiredAt)
            .signWith(getSignInKey(), SignatureAlgorithm.HS256)
            .compact();
}
}