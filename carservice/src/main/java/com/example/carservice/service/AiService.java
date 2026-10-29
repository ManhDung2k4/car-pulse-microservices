// package com.example.carservice.service;
// import com.example.carservice.dto.AiChatRequest;
// import com.example.carservice.dto.AiChatResponse;
// import org.springframework.http.ResponseEntity;
// import org.springframework.stereotype.Service;
// import org.springframework.web.client.RestTemplate;

// import com.example.carservice.dto.DebateRequest;
// import com.example.carservice.dto.DebateResponse;
// import org.springframework.beans.factory.annotation.Value;

// // THÊM 2 DÒNG NÀY:
// import java.util.HashMap;
// import java.util.Map;
// @Service
// public class AiService {

//     private final RestTemplate restTemplate =
//             new RestTemplate();

// //     public String chat(String message){

// //         AiChatRequest request =
// //                 new AiChatRequest();

// //         request.setMessage(message);

// //         ResponseEntity<AiChatResponse> response =
// //                 restTemplate.postForEntity(
// //                         "http://localhost:8080/api/ai/chat",
// //                         request,
// //                         AiChatResponse.class
// //                 );

// //         return response.getBody().getAnswer();
// //     }

// // // SỬA LẠI HÀM NÀY
// //     public String chat(AiChatRequest request){
// //         ResponseEntity<AiChatResponse> response =
// //                 restTemplate.postForEntity(
// //                         "http://localhost:5003/chat", // Lưu ý URL tuỳ môi trường
// //                         request,
// //                         AiChatResponse.class
// //                 );
// //         return response.getBody().getAnswer();
// //     }
// // 🔥 Đoạn thêm mới để đọc cấu hình động từ properties hoặc docker-compose
//     @Value("${ai.service.url:http://localhost:5003}")
//     private String aiServiceUrl;

//     public String chat(AiChatRequest request){
//         ResponseEntity<AiChatResponse> response =
//                 restTemplate.postForEntity(
//                         aiServiceUrl + "/chat", 
//                         request,
//                         AiChatResponse.class
//                 );
//         return response.getBody().getAnswer();
//     }
//     // public DebateResponse debateMarket(DebateRequest request) {
//     //     // Lưu ý: Cấu hình URL này cho môi trường production hoặc localhost thông qua Gateway
//     //     String pythonDebateUrl = "http://localhost:5003/debate"; 
        
//     //     ResponseEntity<DebateResponse> response = restTemplate.postForEntity(
//     //             pythonDebateUrl,
//     //             request,
//     //             DebateResponse.class
//     //     );

//     //     return response.getBody();
//     // }
//     // public DebateResponse debateMarket(DebateRequest request) {
//     //     ResponseEntity<DebateResponse> response = restTemplate.postForEntity(
//     //             aiServiceUrl + "/debate",
//     //             request,
//     //             DebateResponse.class
//     //     );
//     //     return response.getBody();
//     // }
//     // public DebateResponse debateMarket(DebateRequest request) {
//     //     // 🔥 ĐÓNG GÓI BẰNG TAY (MANUAL MAPPING) ĐỂ ÉP JACKSON XUẤT ĐÚNG SNAKE_CASE
//     //     Map<String, Object> payload = new HashMap<>();
//     //     payload.put("userId", request.getUserId());
//     //     payload.put("user_argument", request.getUserArgument());
//     //     payload.put("credibility_weight", request.getCredibilityWeight());
//     //     payload.put("current_score", request.getCurrentScore());
//     //     payload.put("current_forecast", request.getCurrentForecast());

//     //     ResponseEntity<DebateResponse> response = restTemplate.postForEntity(
//     //             aiServiceUrl + "/debate",
//     //             payload,  // Gửi thẳng cái Map này đi
//     //             DebateResponse.class
//     //     );

//     //     return response.getBody();
//     // }
//     // 🔥 NHẬN VÀO MAP CHUẨN VÀ GỬI THẲNG SANG PYTHON
//     public DebateResponse debateMarket(Map<String, Object> payload) {
//         ResponseEntity<DebateResponse> response = restTemplate.postForEntity(
//                 aiServiceUrl + "/debate",
//                 payload,
//                 DebateResponse.class
//         );
//         return response.getBody();
//     }
// }

package com.example.carservice.service;

import com.example.carservice.dto.AiChatRequest;
import com.example.carservice.dto.AiChatResponse;
import com.example.carservice.dto.DebateRequest;
import com.example.carservice.dto.DebateResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException; // Thêm import này
@Service
public class AiService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://localhost:5003}")
    private String aiServiceUrl;

    public String chat(AiChatRequest request) {
        // Ép chuẩn JSON cho tính năng Chat
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AiChatRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<AiChatResponse> response = restTemplate.postForEntity(
                aiServiceUrl + "/chat",
                entity,
                AiChatResponse.class
        );
        return response.getBody().getAnswer();
    }

    // public DebateResponse debateMarket(DebateRequest request) {
    //     // 🔥 ÉP CHUẨN JSON TUYỆT ĐỐI CHO TÍNH NĂNG TRANH BIỆN CHỐNG LỖI 422
    //     HttpHeaders headers = new HttpHeaders();
    //     headers.setContentType(MediaType.APPLICATION_JSON);
        
    //     HttpEntity<DebateRequest> entity = new HttpEntity<>(request, headers);

    //     ResponseEntity<DebateResponse> response = restTemplate.postForEntity(
    //             aiServiceUrl + "/debate",
    //             entity,
    //             DebateResponse.class
    //     );

    //     return response.getBody();
    // }
    public DebateResponse debateMarket(DebateRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<DebateRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<DebateResponse> response = restTemplate.postForEntity(
                    aiServiceUrl + "/debate",
                    entity,
                    DebateResponse.class
            );
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            // 🔥 VŨ KHÍ TỐI THƯỢNG: Bắt Java in ra lỗi chi tiết từ Python
            System.err.println("❌ LỖI TỪ PYTHON AI SERVICE: " + e.getResponseBodyAsString());
            throw new RuntimeException("AI Service Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println("❌ LỖI KẾT NỐI (Python có thể đang tắt): " + e.getMessage());
            throw new RuntimeException("Cannot connect to AI Service");
        }
    }
}
