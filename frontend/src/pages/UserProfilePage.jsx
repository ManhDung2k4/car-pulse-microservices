import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile, changePassword } from "../api/authApi";

function UserProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profileData, setProfileData] = useState({
    phone: "",
    fullName: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Load user data
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setUser(userData);
        setProfileData({
          phone: userData.phone || "",
          fullName: userData.fullName || "",
        });
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user data:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Auto clear message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto clear error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle profile update
  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await updateProfile(profileData, token);

      // Update localStorage with new data
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setMessage("Cập nhật thông tin thành công");
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thông tin thất bại");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    setMessage("");
    setError("");

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoadingPassword(false);
      return;
    }

    // if (passwordData.newPassword.length < 6) {
    //   setError("Mật khẩu mới phải có ít nhất 6 ký tự");
    //   setLoadingPassword(false);
    //   return;
    // }

    // Kiểm tra định dạng mật khẩu chuẩn khớp với Backend Spring Boot
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(passwordData.newPassword)) {
      setError(
        "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!",
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Xác nhận mật khẩu không khớp!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await changePassword(passwordData, token);

      setMessage("Thay đổi mật khẩu thành công");
      setShowPasswordForm(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(
        "Password change error:",
        err.response?.data || err.message,
      );
      setError(err.response?.data?.message || "Thay đổi mật khẩu thất bại");
    } finally {
      setLoadingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <h1>Thông tin tài khoản cá nhân</h1>
            <p>Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
          </div>
        </div>

        {/* Messages */}
        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-section">
            <div className="section-header">
              <h2>Thông tin cá nhân</h2>
              {!editMode && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditMode(true)}
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            {editMode ? (
              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="form-control"
                    title="Email không thể thay đổi"
                  />
                  <small className="form-hint">Email không thể thay đổi</small>
                </div>

                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="form-control"
                    placeholder="Nhập họ tên"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="form-control"
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loadingProfile}
                  >
                    {loadingProfile ? "Đang cập nhật..." : "Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEditMode(false);
                      setProfileData({
                        phone: user.phone || "",
                        fullName: user.fullName || "",
                      });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Họ và tên:</span>
                  <span className="info-value">{user.fullName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số điện thoại:</span>
                  <span className="info-value">{user.phone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Quyền:</span>
                  <span className="info-value info-role">
                    {user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Trạng thái:</span>
                  <span className="info-value info-status">
                    {user.status === "active" ? "Hoạt động" : "Khóa"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Card */}
        <div className="profile-card">
          <div className="profile-section">
            <div className="section-header">
              <h2>Bảo mật tài khoản</h2>
              {!showPasswordForm && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Thay đổi mật khẩu
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <form className="profile-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                  <small className="form-hint">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </small>
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loadingPassword}
                  >
                    {loadingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        oldPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="password-info">
                <p className="password-message">
                  ✓ Mật khẩu được mã hóa và bảo vệ an toàn
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
