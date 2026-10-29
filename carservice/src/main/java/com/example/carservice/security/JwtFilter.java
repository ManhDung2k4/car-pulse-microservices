package com.example.carservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Kiểm tra header xem có chứa Token không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Không có vé thì cho đi tiếp (tới bước phân quyền sẽ bị chặn lại sau)
            return;
        }

        // 2. Cắt chữ "Bearer " ra để lấy Token nguyên bản
        jwt = authHeader.substring(7);

        try {
            userEmail = jwtUtils.extractEmail(jwt);

            // 3. Nếu đọc được Email và hệ thống chưa ghi nhận người này đang đăng nhập
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                if (jwtUtils.isTokenValid(jwt)) {
                    // Lấy Role từ token ra (VD: "ADMIN" hoặc "USER")
                    String role = jwtUtils.extractRole(jwt);
                    
                    // Thêm chữ ROLE_ vào trước theo chuẩn của Spring Security (VD: "ROLE_ADMIN")
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                    // 4. Báo cáo với Spring Security là "Vé chuẩn, cho người này vào!"
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            Collections.singletonList(authority)
                    );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
       } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.err.println("❌ JWT BỊ TỪ CHỐI: Token đã hết hạn!");
        } catch (Exception e) {
            System.err.println("❌ JWT BỊ TỪ CHỐI: Token không hợp lệ - " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}