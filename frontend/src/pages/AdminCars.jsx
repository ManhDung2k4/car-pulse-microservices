import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ==========================================
// CUSTOM SELECT COMPONENT
// ==========================================
const CustomSelect = ({
  name, // 👈 Thêm name vào đây
  value,
  onChange,
  options,
  placeholder = "Chọn...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    // 👈 Truyền kèm name vào event giả lập để component cha bắt được
    onChange({ target: { name: name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="custom-select-wrapper" ref={selectRef}>
      <div
        className={`custom-select-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <svg
          className="custom-select-icon"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {isOpen && (
        <ul className="custom-select-dropdown">
          {options.map((option) => (
            <li
              key={option.value}
              className={`custom-select-option ${value === option.value ? "selected" : ""}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ==========================================
// HÀM TIỆN ÍCH
// ==========================================
function parsePrice(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const text = String(value).trim().toLowerCase();
  if (!text) return null;

  const hasUnit = /(ty|tỷ|ti|tỉ|trieu|triệu|nghin|nghìn|ngan|ngàn)/.test(text);
  const match = text.replace(/,/g, ".").match(/\d+(?:\.\d+)?/);

  if (!match) return null;
  let number = parseFloat(match[0]);

  if (hasUnit) {
    if (/(ty|tỷ)/.test(text)) number *= 1_000_000_000;
    else if (/(ti|tỉ)/.test(text)) number *= 1_000_000_000;
    else if (/(trieu|triệu)/.test(text)) number *= 1_000_000;
    else if (/(nghin|nghìn|ngan|ngàn)/.test(text)) number *= 1_000;
  }
  return Math.round(number);
}

function formatPrice(num) {
  if (!num) return "0 đ";
  const billions = num / 1_000_000_000;
  if (billions >= 1) {
    return billions % 1 === 0
      ? `${billions.toFixed(0)} tỷ`
      : `${billions.toFixed(1)} tỷ`;
  }
  const millions = num / 1_000_000;
  if (millions >= 1) {
    return millions % 1 === 0
      ? `${millions.toFixed(0)} triệu`
      : `${millions.toFixed(1)} triệu`;
  }
  const thousands = num / 1_000;
  if (thousands >= 1) {
    return thousands % 1 === 0
      ? `${thousands.toFixed(0)} nghìn`
      : `${thousands.toFixed(1)} nghìn`;
  }
  return `${num} đ`;
}

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminCars = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✅ AUTO-CLEAR MESSAGES AFTER 3 SECONDS
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ AUTO-CLEAR ERRORS AFTER 5 SECONDS
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [formData, setFormData] = useState({
    tieuDe: "",
    namSX: new Date().getFullYear(),
    gia: "",
    soKmDaDi: "",
    nhienLieu: "",
    hopSo: "",
    kieuDang: "",
    xuatXu: "",
    tinhTrang: "",
    sdtNguoiBan: "",
    diaDiem: "",
    tenNguoiBan: "",
  });

  const FUEL_OPTIONS = [
    { label: "Xăng", value: "Xăng" },
    { label: "Dầu", value: "Dầu" },
    { label: "Điện", value: "Điện" },
    { label: "Hybrid", value: "Hybrid" },
  ];

  const TRANSMISSION_OPTIONS = [
    { label: "Tự động", value: "Tự động" },
    { label: "Số sàn", value: "Số sàn" },
  ];

  const BODY_STYLE_OPTIONS = [
    { label: "SUV", value: "SUV" },
    { label: "Sedan", value: "Sedan" },
    { label: "Hatchback", value: "Hatchback" },
    { label: "MPV", value: "MPV" },
    { label: "Bán tải", value: "Bán tải" },
    { label: "Crossover", value: "Crossover" },
  ];

  const ORIGIN_OPTIONS = [
    { label: "Lắp ráp trong nước", value: "Lắp ráp trong nước" },
    { label: "Nhập khẩu", value: "Nhập khẩu" },
  ];

  const CONDITION_OPTIONS = [
    { label: "Cũ", value: "Cũ" },
    { label: "Mới", value: "Mới" },
  ];

  // ✅ KIỂM TRA QUYỀN ADMIN
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (currentUser?.role !== "ADMIN") {
      navigate("/cars");
      return;
    }

    fetchCars();
  }, [navigate, page]);

  const fetchCars = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8080/api/cars?page=${page}&size=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCars(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setError("");
    } catch (err) {
      setError("Lỗi tải danh sách xe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        gia: parsePrice(formData.gia),
        soKmDaDi: parseInt(formData.soKmDaDi) || 0,
        namSX: parseInt(formData.namSX),
      };

      if (editingId) {
        // ✅ CẬP NHẬT XE
        await axios.put(
          `http://localhost:8080/api/cars/${editingId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setMessage("Cập nhật xe thành công");
        setError("");
      } else {
        // ✅ THÊM XE MỚI
        await axios.post("http://localhost:8080/api/cars", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Thêm xe mới thành công");
        setError("");
      }

      setTimeout(() => {
        resetForm();
        fetchCars();
      }, 300);
    } catch (err) {
      setError("Lỗi khi lưu xe: " + err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (car) => {
    setFormData({
      tieuDe: car.tieuDe || "",
      namSX: car.namSX || new Date().getFullYear(),
      gia: car.gia || "",
      soKmDaDi: car.soKmDaDi || "",
      nhienLieu: car.nhienLieu || "",
      hopSo: car.hopSo || "",
      kieuDang: car.kieuDang || "",
      xuatXu: car.xuatXu || "",
      tinhTrang: car.tinhTrang || "",
      sdtNguoiBan: car.sdtNguoiBan || "",
      diaDiem: car.diaDiem || "",
      tenNguoiBan: car.tenNguoiBan || "",
    });
    setEditingId(car.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa xe này?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/api/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Xóa xe thành công");
      setError("");
      fetchCars();
    } catch (err) {
      setError("Lỗi xóa xe: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      tieuDe: "",
      namSX: new Date().getFullYear(),
      gia: "",
      soKmDaDi: "",
      nhienLieu: "",
      hopSo: "",
      kieuDang: "",
      xuatXu: "",
      tinhTrang: "",
      sdtNguoiBan: "",
      diaDiem: "",
      tenNguoiBan: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading)
    return (
      <div className="admin-page">
        <div className="loading-spinner">Đang tải...</div>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="stat-link"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-undo2-icon lucide-undo-2"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>
          Quay lại trang admin
        </button>
        <h1>Quản lý xe</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Đóng form" : "Thêm xe mới"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* ===== FORM THÊM/SỬA XE ===== */}
      {showForm && (
        <div className="admin-form-card">
          <h2>{editingId ? "Cập nhật xe" : "Thêm xe mới"}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Tiêu đề (VD: Toyota Camry 2020 AT)</label>
                <input
                  type="text"
                  name="tieuDe"
                  value={formData.tieuDe}
                  onChange={handleChange}
                  placeholder="Toyota Camry 2020 AT"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Giá (VNĐ hoặc VD: 500 triệu)</label>
                <input
                  type="text"
                  name="gia"
                  value={formData.gia}
                  onChange={handleChange}
                  placeholder="VD: 500 triệu hoặc 500000000"
                />
              </div>
              <div className="form-group">
                <label>Năm sản xuất</label>
                <input
                  type="number"
                  name="namSX"
                  value={formData.namSX}
                  onChange={handleChange}
                  min="1990"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="form-group">
                <label>Số KM đã đi</label>
                <input
                  type="number"
                  name="soKmDaDi"
                  value={formData.soKmDaDi}
                  onChange={handleChange}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nhiên liệu</label>
                <CustomSelect
                  name="nhienLieu"
                  value={formData.nhienLieu}
                  onChange={handleChange}
                  options={FUEL_OPTIONS}
                />
              </div>
              <div className="form-group">
                <label>Hộp số (Truyền động)</label>
                <CustomSelect
                  name="hopSo"
                  value={formData.hopSo}
                  onChange={handleChange}
                  options={TRANSMISSION_OPTIONS}
                />
              </div>
              <div className="form-group">
                <label>Kiểu dáng</label>
                <CustomSelect
                  name="kieuDang"
                  value={formData.kieuDang}
                  onChange={handleChange}
                  options={BODY_STYLE_OPTIONS}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Xuất xứ</label>
                <CustomSelect
                  name="xuatXu"
                  value={formData.xuatXu}
                  onChange={handleChange}
                  options={ORIGIN_OPTIONS}
                />
              </div>
              <div className="form-group">
                <label>Tình trạng</label>
                <CustomSelect
                  name="tinhTrang"
                  value={formData.tinhTrang}
                  onChange={handleChange}
                  options={CONDITION_OPTIONS}
                />
              </div>
              <div className="form-group">
                <label>Địa điểm</label>
                <input
                  type="text"
                  name="diaDiem"
                  value={formData.diaDiem}
                  onChange={handleChange}
                  placeholder="VD: Hà Nội, TP.HCM"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tên người bán</label>
                <input
                  type="text"
                  name="tenNguoiBan"
                  value={formData.tenNguoiBan}
                  onChange={handleChange}
                  placeholder="Tên người bán"
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại người bán</label>
                <input
                  type="text"
                  name="sdtNguoiBan"
                  value={formData.sdtNguoiBan}
                  onChange={handleChange}
                  placeholder="0912345678"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingId ? "Cập nhật" : "Thêm mới"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetForm}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== DANH SÁCH XE ===== */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Năm</th>
                <th>Giá</th>
                <th>Nhiên liệu</th>
                <th>KM</th>
                <th>Người bán</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cars.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    Không có xe nào
                  </td>
                </tr>
              ) : (
                cars.map((car) => (
                  <tr key={car.id}>
                    <td className="font-bold">{car.tieuDe}</td>
                    <td>{car.namSX}</td>
                    <td>{formatPrice(parsePrice(car.gia))}</td>
                    <td>{car.nhienLieu}</td>
                    <td>
                      {parseInt(car.soKmDaDi)?.toLocaleString("vi-VN") || 0}
                    </td>
                    <td>{car.tenNguoiBan}</td>
                    <td className="action-cell">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(car)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-badge-plus-icon lucide-badge-plus"
                        >
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <line x1="12" x2="12" y1="8" y2="16" />
                          <line x1="8" x2="16" y1="12" y2="12" />
                        </svg>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(car.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-badge-x-icon lucide-badge-x"
                        >
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <line x1="15" x2="9" y1="9" y2="15" />
                          <line x1="9" x2="15" y1="9" y2="15" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="pagination">
          <button
            disabled={page === 0}
            onClick={() => setPage(Math.max(0, page - 1))}
            className="btn btn-outline"
          >
            ← Trước
          </button>
          <span className="page-info">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="btn btn-outline"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCars;
