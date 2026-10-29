import axios from "axios";

// Cổng 8080 là cổng của Gateway API, nó sẽ tự động điều phối sang 5003 cho mình
// const AI_API_URL = "https://gateway-api-ngbw.onrender.com/api/ai";
// const AI_API_URL = "http://localhost:8080/api/ai";
// SỬA TẠI aiApi.js
const AI_API_URL = `${process.env.REACT_APP_API_BASE_URL}/ai`;
export const getAssociationRules = async () => {
  try {
    const response = await axios.get(`${AI_API_URL}/association-rules`);
    return response.data; // Dữ liệu trả về sẽ chứa 'count' và mảng 'rules'
  } catch (error) {
    console.error("Lỗi khi gọi API Luật kết hợp:", error);
    throw error;
  }
};
// ĐƯỢC THÊM MỚI: Định nghĩa hàm kết nối API Tranh Biện chuẩn tập trung
export const submitMarketDebate = async (debateData, token) => {
  try {
    const response = await axios.post(`${AI_API_URL}/debate`, debateData, {
      headers: {
        Authorization: `Bearer ${token}`, // Đính kèm thẻ thông hành JWT để định danh người dùng
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi kết nối API Tranh biện hệ thống:", error);
    throw error;
  }
};
