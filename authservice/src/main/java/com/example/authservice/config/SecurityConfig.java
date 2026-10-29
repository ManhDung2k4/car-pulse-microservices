// package com.example.authservice.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.Customizer;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.web.SecurityFilterChain;

// @Configuration
// public class SecurityConfig {

//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http
//             .csrf(csrf -> csrf.disable())
//             .cors(Customizer.withDefaults())
//             .authorizeHttpRequests(auth -> auth
//                 .requestMatchers("/auth/register", "/auth/login").permitAll()
//                 .anyRequest().permitAll()   // để test trước
//             );

//         return http.build();
//     }
// }

package com.example.authservice.config;

import com.example.authservice.security.JwtFilter; // Import màng lọc
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity // BẮT BUỘC CÓ: Tắt chế độ sinh mật khẩu random của Spring
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable()) // Tắt CORS vì API Gateway (cổng 8080) đã lo việc này
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Mở cửa cho Đăng nhập và Đăng ký
                // .requestMatchers("/auth/register", "/auth/login", "/auth/refresh").permitAll()
                // Sửa thành:
                .requestMatchers("/auth/register", "/auth/login", "/auth/refresh").permitAll()
                .requestMatchers("/auth/users/**").hasRole("ADMIN") // Thêm dòng này để bảo vệ API quản trị dữ liệu user
                .anyRequest().authenticated()
                // Tất cả các API còn lại (bao gồm /auth/profile) bắt buộc phải có Token hợp lệ
                // .anyRequest().authenticated()   
            )
            // Nhét ông bảo vệ JwtFilter vào chặn trước cổng
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}