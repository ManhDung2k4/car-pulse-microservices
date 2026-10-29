package com.example.authservice.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.ChangePasswordRequest;
import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.dto.UpdateProfileRequest;
import com.example.authservice.dto.UserRequest;
import com.example.authservice.dto.UserResponse;
import com.example.authservice.entity.User;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.security.JwtService;
import com.example.authservice.exception.DuplicateFieldException;
import com.example.authservice.exception.InvalidCredentialsException;

import org.springframework.beans.factory.annotation.Autowired;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateFieldException("Email", request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateFieldException("Số điện thoại", request.getPhone());
        }

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role("USER")
                .status("active")
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

        return AuthResponse.builder()
                .message("Đăng ký thành công")
                .accessToken(token)
                .user(mapToUserResponse(savedUser))
                .build();
    }

    // public AuthResponse login(LoginRequest request) {
    //     User user = userRepository.findByEmail(request.getEmail())
    //             .orElseThrow(InvalidCredentialsException::new);

    //     if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
    //         throw new InvalidCredentialsException();
    //     }

    //     String token = jwtService.generateToken(
    //             user.getId(),
    //             user.getEmail(),
    //             user.getRole()
    //     );

    //     return AuthResponse.builder()
    //             .message("Đăng nhập thành công")
    //             .accessToken(token)
    //             .user(mapToUserResponse(user))
    //             .build();
    // }
//     public AuthResponse login(LoginRequest request) {
//     User user = userRepository.findByEmail(request.getEmail())
//             .orElseThrow(InvalidCredentialsException::new);

//     if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
//         throw new InvalidCredentialsException();
//     }

//     String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
//     String refreshToken = jwtService.generateRefreshToken(user.getEmail()); // Tạo Refresh Token

//     return AuthResponse.builder()
//             .message("Đăng nhập thành công")
//             .accessToken(accessToken)
//             .refreshToken(refreshToken) // Trả về cả Refresh Token
//             .user(mapToUserResponse(user))
//             .build();
// }


// Inject thêm RefreshTokenRepository nếu chưa có ở đầu file:
@Autowired
private com.example.authservice.repository.RefreshTokenRepository refreshTokenRepository;

public AuthResponse login(LoginRequest request) {
    // ... Logic xác thực mật khẩu cũ ...
    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException());

    String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
    String refreshTokenStr = jwtService.generateRefreshToken(user.getEmail());

    // 🔥 ĐOẠN SỬA BỔ SUNG: Lưu token xuống DB trước khi trả về
    com.example.authservice.entity.RefreshToken refreshTokenEntity = 
        com.example.authservice.entity.RefreshToken.builder()
            .userId(user.getId())
            .token(refreshTokenStr)
            .expiresAt(java.time.LocalDateTime.now().plusDays(7)) // Khớp với thời gian sống cấu hình
            .revoked(false)
            .build();
    refreshTokenRepository.save(refreshTokenEntity);

    return AuthResponse.builder()
            .message("Đăng nhập thành công")
            .accessToken(accessToken)
            .refreshToken(refreshTokenStr)
            .user(mapToUserResponse(user))
            .build();
}
    public AuthResponse refreshToken(String refreshToken) {
        try {
            // Validate refresh token
            if (!jwtService.isTokenValid(refreshToken)) {
                throw new InvalidCredentialsException("Refresh token đã hết hạn");
            }

            // Extract email from refresh token
            String email = jwtService.extractEmail(refreshToken);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new InvalidCredentialsException("Người dùng không tồn tại"));

            // Generate new access token
            String newAccessToken = jwtService.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole()
            );

            return AuthResponse.builder()
                    .message("Làm mới token thành công")
                    .accessToken(newAccessToken)
                    .refreshToken(refreshToken) // Return same refresh token
                    .user(mapToUserResponse(user))
                    .build();
        } catch (Exception e) {
            throw new InvalidCredentialsException("Refresh token không hợp lệ");
        }
    }
    public UserResponse getMe(User user) {
        return mapToUserResponse(user);
    }

    // ================= PROFILE & PASSWORD MANAGEMENT =================

    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setPhone(request.getPhone());
        user.setFullName(request.getFullName());

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        // Kiểm tra mật khẩu mới và xác nhận có khớp không
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }

        // Cập nhật mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }

    // ================= CÁC HÀM CHO ADMIN QUẢN LÝ NGƯỜI DÙNG =================

    public Page<UserResponse> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);
        return users.map(this::mapToUserResponse);
    }

    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateFieldException("Email", request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .fullName(request.getFullName())
                .role(request.getRole())
                .status(request.getStatus())
                .passwordHash(passwordEncoder.encode("123456")) // Pass mặc định khi admin tạo
                .build();

        return mapToUserResponse(userRepository.save(user));
    }

    public UserResponse updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateFieldException("Email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());

        return mapToUserResponse(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy người dùng");
        }
        userRepository.deleteById(id);
    }
}