import { useState, useRef, useEffect } from "react";
import axios from "axios";

function AIChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const loadHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;
      const response = await axios.get(
        `http://localhost:8080/api/ai/chat/history/${userId}`,
      );

      const history = response.data.map((item) => ({
        role: item.role,
        content: item.message,
      }));

      setMessages(history);
    } catch (error) {
      console.error("Không tải được lịch sử chat", error);
    }
  };
  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);
  useEffect(() => {
    loadHistory();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage(""); // Xóa input ngay lập tức sau khi gửi

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token"); // LẤY TOKEN TỪ STORAGE

      const userId = user?.id;

      // THÊM HEADER AUTHORIZATION VÀO ĐÂY
      const response = await axios.post(
        `http://localhost:8080/api/ai/chat`,
        { message: userMessage.content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const aiResponse = { role: "ai", content: response.data.answer };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn", error);
      const errorMsg = {
        role: "ai",
        content: "Xin lỗi, hệ thống AI đang bận hoặc lỗi xác thực.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };
  return (
    <div className="ai-chat-widget">
      {/* Cửa sổ Chat */}
      <div className={`ai-chat-window ${open ? "is-open" : ""}`}>
        <div className="ai-chat-header">
          <div className="ai-chat-header-title">
            <div className="ai-chat-avatar">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a2 2 0 0 1 2 2c-.11.85-.45 1.63-1 2.28A6.98 6.98 0 0 0 5 13H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2a6.98 6.98 0 0 0-8-6.72A3.99 3.99 0 0 1 12 2Z"></path>
                <circle cx="9" cy="13" r="1"></circle>
                <circle cx="15" cy="13" r="1"></circle>
              </svg>
            </div>
            <div>
              <h3>Chuyên gia AI</h3>
              <span>Sẵn sàng hỗ trợ bạn</span>
            </div>
          </div>
          <button className="ai-chat-close" onClick={() => setOpen(false)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.length === 0 ? (
            <div className="ai-chat-empty">
              Chào bạn! Mình có thể giúp gì cho bạn trong việc tìm kiếm và lựa
              chọn xe hôm nay?
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`ai-message-wrapper ${msg.role}`}>
                <div className="ai-message-bubble">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            className="form-control"
            placeholder="Nhập câu hỏi của bạn..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button className="btn btn-primary btn-send" onClick={sendMessage}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Nút bong bóng bật/tắt chat */}
      <button
        className={`ai-chat-toggle ${open ? "is-active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}

export default AIChat;
