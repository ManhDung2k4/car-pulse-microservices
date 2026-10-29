// // // // package com.example.carservice.controller;


// // // // import com.example.carservice.dto.AiChatRequest;
// // // // import com.example.carservice.service.AiService;
// // // // import org.springframework.http.ResponseEntity;
// // // // import org.springframework.web.bind.annotation.*;

// // // // @RestController
// // // // @RequestMapping("/ai")
// // // // public class AiController {

// // // //     private final AiService aiService;

// // // //     public AiController(AiService aiService) {
// // // //         this.aiService = aiService;
// // // //     }

// // // //     @PostMapping("/chat")
// // // //     public ResponseEntity<String> chat(
// // // //             @RequestBody AiChatRequest request
// // // //     ){

// // // //         return ResponseEntity.ok(
// // // //                 aiService.chat(
// // // //                         request.getMessage()
// // // //                 )
// // // //         );
// // // //     }
// // // // }

// // // package com.example.carservice.controller;

// // // import com.example.carservice.dto.AiChatRequest;
// // // import com.example.carservice.dto.AiChatResponse; // Bổ sung import này
// // // import com.example.carservice.service.AiService;
// // // import org.springframework.http.ResponseEntity;
// // // import org.springframework.web.bind.annotation.*;

// // // @RestController
// // // // Thêm "/api" vào đường dẫn để khớp chính xác với lời gọi bên ReactJS
// // // @RequestMapping("/api/ai") 
// // // public class AiController {

// // //     private final AiService aiService;

// // //     public AiController(AiService aiService) {
// // //         this.aiService = aiService;
// // //     }

// // //     @PostMapping("/chat")
// // //     public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        
// // //         // 1. Lấy câu trả lời (dạng chuỗi) từ AiService
// // //         String answer = aiService.chat(request.getMessage());
        
// // //         // 2. Bọc chuỗi đó vào object AiChatResponse để nó tự động biến thành JSON: {"answer": "..."}
// // //         return ResponseEntity.ok(new AiChatResponse(answer));
// // //     }
// // //  // THÊM MỚI: Endpoint cho tính năng Tranh biện (Debate)
// // //     @PostMapping("/debate")
// // //     public ResponseEntity<DebateResponse> debate(
// // //             // Dòng này (tùy chọn) để phục vụ việc lưu vết (audit) sau này nếu cần
// // //             @RequestHeader(value = "Authorization", required = false) String token, 
// // //             @RequestBody DebateRequest request) {
        
// // //         DebateResponse response = aiService.debateMarket(request);
// // //         return ResponseEntity.ok(response);
// // //     }
// // // }

// // package com.example.carservice.controller;

// // import com.example.carservice.dto.AiChatRequest;
// // import com.example.carservice.dto.AiChatResponse;
// // import com.example.carservice.dto.DebateRequest;
// // import com.example.carservice.dto.DebateResponse;
// // import com.example.carservice.security.JwtUtils; // Cần import cái này
// // import com.example.carservice.service.AiService;
// // import org.springframework.http.ResponseEntity;
// // import org.springframework.web.bind.annotation.*;

// // @RestController
// // @RequestMapping("/api/ai")
// // public class AiController {

// //     private final AiService aiService;
// //     private final JwtUtils jwtUtils; // Thêm JwtUtils

// //     public AiController(AiService aiService, JwtUtils jwtUtils) {
// //         this.aiService = aiService;
// //         this.jwtUtils = jwtUtils;
// //     }

// //     // @PostMapping("/chat")
// //     // public ResponseEntity<AiChatResponse> chat(
// //     //         @RequestHeader("Authorization") String token, 
// //     //         @RequestBody AiChatRequest request) {
        
// //     //     // Cắt bỏ chữ "Bearer " để lấy đúng token
// //     //     String jwt = token.substring(7);
// //     //     // Trích xuất ID từ token
// //     //     Long userId = jwtUtils.extractAllClaims(jwt).get("id", Long.class);
// //     //     request.setUserId(userId); // Gắn ID vào request
        
// //     //     // Đổi cách gọi sang truyền cả Object request
// //     //     return ResponseEntity.ok(new AiChatResponse(aiService.chat(request)));
// //     // }

// //     @PostMapping("/chat")
// // public ResponseEntity<AiChatResponse> chat(
// //         @RequestHeader("Authorization") String token, 
// //         @RequestBody AiChatRequest request) {

// //     String jwt = token.substring(7);
// //     // SỬA CÁCH ÉP KIỂU TẠI ĐÂY:
// //     Number idNum = jwtUtils.extractAllClaims(jwt).get("id", Number.class);
// //     request.setUserId(idNum.longValue()); 

// //     return ResponseEntity.ok(new AiChatResponse(aiService.chat(request)));
// // }

// //     // @PostMapping("/debate")
// //     // public ResponseEntity<DebateResponse> debate(
// //     //         @RequestHeader("Authorization") String token, 
// //     //         @RequestBody DebateRequest request) {
        
// //     //     String jwt = token.substring(7);
// //     //     Long userId = jwtUtils.extractAllClaims(jwt).get("id", Long.class);
// //     //     request.setUserId(userId); // Gắn ID vào request
        
// //     //     return ResponseEntity.ok(aiService.debateMarket(request));
// //     // }

// //     @PostMapping("/debate")
// // public ResponseEntity<DebateResponse> debate(
// //         @RequestHeader("Authorization") String token, 
// //         @RequestBody DebateRequest request) {

// //     String jwt = token.substring(7);
// //     // SỬA CÁCH ÉP KIỂU TẠI ĐÂY:
// //     Number idNum = jwtUtils.extractAllClaims(jwt).get("id", Number.class);
// //     request.setUserId(idNum.longValue()); 

// //     return ResponseEntity.ok(aiService.debateMarket(request));
// // }
// // }


// package com.example.carservice.controller;

// import com.example.carservice.dto.AiChatRequest;
// import com.example.carservice.dto.AiChatResponse;
// import com.example.carservice.dto.DebateResponse;
// import com.example.carservice.service.AiService;
// import com.example.carservice.security.JwtUtils;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.HashMap;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/ai")
// public class AiController {

//     private final AiService aiService;
//     private final JwtUtils jwtUtils;

//     public AiController(AiService aiService, JwtUtils jwtUtils) {
//         this.aiService = aiService;
//         this.jwtUtils = jwtUtils;
//     }

//     @PostMapping("/chat")
//     public ResponseEntity<AiChatResponse> chat(
//             @RequestHeader("Authorization") String token,
//             @RequestBody AiChatRequest request) {

//         String jwt = token.substring(7);
//         Number idNum = jwtUtils.extractAllClaims(jwt).get("id", Number.class);
//         request.setUserId(idNum.longValue());

//         return ResponseEntity.ok(new AiChatResponse(aiService.chat(request)));
//     }

//     // 🔥 KỸ THUẬT SENIOR: DÙNG MAP ĐỂ HỨNG MỌI LOẠI JSON TỪ REACT
//     @PostMapping("/debate")
//     public ResponseEntity<DebateResponse> debate(
//             @RequestHeader("Authorization") String token,
//             @RequestBody Map<String, Object> requestBody) {

//         String jwt = token.substring(7);
//         Number idNum = jwtUtils.extractAllClaims(jwt).get("id", Number.class);

//         // Nặn ra gói dữ liệu chuẩn 100% snake_case cho Python
//         Map<String, Object> pythonPayload = new HashMap<>();
//         pythonPayload.put("userId", idNum.longValue());

//         // Quét tìm dữ liệu với mọi tên biến có thể có từ React, kèm giá trị mặc định chống lỗi 422
//         pythonPayload.put("user_argument", getSafely(requestBody, "Không có lập luận", "userArgument", "user_argument", "customArgument"));
//         pythonPayload.put("credibility_weight", getSafely(requestBody, 3, "credibilityWeight", "credibility_weight"));
//         pythonPayload.put("current_score", getSafely(requestBody, 75.0, "currentScore", "current_score", "confidenceScore"));
//         pythonPayload.put("current_forecast", getSafely(requestBody, "Chưa có dự báo", "currentForecast", "current_forecast"));

//         return ResponseEntity.ok(aiService.debateMarket(pythonPayload));
//     }

//     // Hàm tiện ích: Dò tìm tên biến an toàn
//     private Object getSafely(Map<String, Object> map, Object defaultValue, String... possibleKeys) {
//         for (String key : possibleKeys) {
//             if (map.containsKey(key) && map.get(key) != null) {
//                 return map.get(key);
//             }
//         }
//         return defaultValue;
//     }
// }

package com.example.carservice.controller;

import com.example.carservice.dto.AiChatRequest;
import com.example.carservice.dto.AiChatResponse;
import com.example.carservice.dto.DebateRequest;
import com.example.carservice.dto.DebateResponse;
import com.example.carservice.service.AiService;
import com.example.carservice.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final JwtUtils jwtUtils;

    public AiController(AiService aiService, JwtUtils jwtUtils) {
        this.aiService = aiService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @RequestHeader("Authorization") String token,
            @RequestBody AiChatRequest request) {

        String jwt = token.substring(7);
        Number idNum = jwtUtils.extractAllClaims(jwt).get("id", Number.class);
        request.setUserId(idNum.longValue());

        return ResponseEntity.ok(new AiChatResponse(aiService.chat(request)));
    }

    @PostMapping("/debate")
    public ResponseEntity<DebateResponse> debate(
            @RequestHeader("Authorization") String token,
            @RequestBody DebateRequest request) {

        String jwt = token.substring(7);
        Number idNum = jwtUtils.extractAllClaims(jwt).get("id", Number.class);
        
        // Gắn userId từ Token vào DTO
        request.setUserId(idNum.longValue());

        return ResponseEntity.ok(aiService.debateMarket(request));
    }
}