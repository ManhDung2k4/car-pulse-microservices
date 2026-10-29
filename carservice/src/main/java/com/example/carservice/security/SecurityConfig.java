package com.example.carservice.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Tắt CSRF vì đang dùng JWT
            .cors(AbstractHttpConfigurer::disable) // Cấu hình CORS nếu cần thiết
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Chế độ KHÔNG lưu trạng thái
            .authorizeHttpRequests(auth -> auth
                // BỔ SUNG DÒNG NÀY: Mở cửa cho trình duyệt gửi request kiểm tra CORS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Cho phép ai cũng có thể XEM danh sách xe và xem chi tiết xe
                .requestMatchers(HttpMethod.GET, "/cars", "/cars/**").permitAll()
                // // Chỉ người có token hợp lệ mới được Thêm/Sửa/Xóa (Có thể thêm .hasRole("ADMIN") nếu muốn chặt hơn)
                // .requestMatchers(HttpMethod.POST, "/cars").authenticated()
                // .requestMatchers(HttpMethod.PUT, "/cars/**").authenticated()
                // .requestMatchers(HttpMethod.DELETE, "/cars/**").authenticated()
                // Sửa thành:
                .requestMatchers(HttpMethod.POST, "/cars").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/cars/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/cars/**").hasRole("ADMIN")
                // Cho phép các endpoint của Swagger và Actuator
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            // Nhét ông bảo vệ JwtFilter vào chặn trước cổng
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}