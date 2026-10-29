package com.example.authservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            userEmail = jwtService.extractEmail(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // if (jwtService.isTokenValid(jwt)) {
                //     // Cấp thẻ thông hành cho Spring Security biết user này hợp lệ
                //     UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                //             userEmail,
                //             null,
                //             Collections.emptyList() 
                //     );
                    
                //     authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                //     SecurityContextHolder.getContext().setAuthentication(authToken);
                // }

                // SỬA TẠI JwtFilter.java
                if (jwtService.isTokenValid(jwt)) {
                    // Trích xuất Role từ token (cần đảm bảo jwtService có hàm lấy claims hoặc extractRole tương tự car-service)
                    String role = jwtService.extractAllClaims(jwt).get("role", String.class);
                    org.springframework.security.core.authority.SimpleGrantedAuthority authority = 
                            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            java.util.List.of(authority) // Thay thế Collections.emptyList()
                    );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token hỏng hoặc hết hạn
        }

        filterChain.doFilter(request, response);
    }
}