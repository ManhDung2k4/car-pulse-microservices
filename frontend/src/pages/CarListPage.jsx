import { useEffect, useMemo, useState, useDeferredValue, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAssociationRules } from "../api/aiApi";
import AIChat from "./AIChat";
const IMAGE_FALLBACK = "/no-image.svg";

const FUEL_OPTIONS = ["Xăng", "Dầu", "Điện", "Hybrid"];
const TRANSMISSION_OPTIONS = ["Tự động", "Số sàn"];
const BODY_STYLE_OPTIONS = [
  "SUV",
  "Sedan",
  "Hatchback",
  "MPV",
  "Bán tải",
  "Crossover",
];
const ORIGIN_OPTIONS = ["Lắp ráp trong nước", "Nhập khẩu"];
const CONDITION_OPTIONS = ["Cũ", "Mới"];

// ==========================================
// COMPONENT: DROPDOWN CUSTOM CAO CẤP
// ==========================================
const CustomSelect = ({ value, onChange, options }) => {
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
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Chọn...";

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
// HÀM TIỆN ÍCH - ĐÃ SỬA LỖI TỈ/TỶ
// ==========================================
function parsePrice(value) {
  if (value === null || value === undefined) return null;

  // 🔥 DÒNG FIX LỖI: Nếu value đã là số nguyên/số thập phân chuẩn từ Backend -> Trả về luôn!
  if (typeof value === "number") return value;

  const text = String(value).trim().toLowerCase();
  if (!text) return null;

  const hasUnit = /(ty|tỷ|ti|tỉ|trieu|triệu|nghin|nghìn|ngan|ngàn)/.test(text);
  const match = text.replace(/,/g, ".").match(/\d+(?:\.\d+)?/);

  if (!match) return null;
  let number = parseFloat(match[0]);

  if (hasUnit) {
    if (
      text.includes("ty") ||
      text.includes("tỷ") ||
      text.includes("ti") ||
      text.includes("tỉ")
    )
      number *= 1_000_000_000;
    else if (text.includes("trieu") || text.includes("triệu"))
      number *= 1_000_000;
    else if (
      text.includes("nghin") ||
      text.includes("nghìn") ||
      text.includes("ngan") ||
      text.includes("ngàn")
    )
      number *= 1_000;
    return number;
  }

  // Bỏ logic xóa dấu chấm cũ, trả thẳng biến number đã được bắt bằng RegEx ở trên
  return number;
}

function formatPrice(value) {
  let numeric = parsePrice(value);

  if (!numeric || Number.isNaN(numeric))
    return value ? String(value) : "Chưa có giá";

  if (numeric > 100_000_000_000) {
    const numString = String(numeric);
    numeric = Number(numString.substring(0, 10));
  }

  if (numeric >= 1_000_000_000) {
    return (numeric / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + " Tỷ";
  } else if (numeric >= 1_000_000) {
    return Math.round(numeric / 1_000_000) + " Triệu";
  }

  return new Intl.NumberFormat("vi-VN").format(numeric) + " VNĐ";
}

function toLower(value) {
  return String(value ?? "").toLowerCase();
}

// ==========================================
// TRANG CHÍNH: CAR LIST PAGE
// ==========================================
function CarListPage() {
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(8);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState("price-desc");

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    fuel: "all",
    transmission: "all",
    bodyStyle: "all",
    origin: "all",
    condition: "all",
    location: "",
  });

  const navigate = useNavigate();
  const [popularRules, setPopularRules] = useState([]);
  const [aiRules, setAiRules] = useState([]);

  const deferredQuery = useDeferredValue(query);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    fetchAllCars();
  }, []);

  const fetchAllCars = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:8080/api/cars?page=0&size=5000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      try {
        const ruleRes = await getAssociationRules();
        setAiRules(ruleRes.rules || []);
        setPopularRules((ruleRes.rules || []).filter((r) => r.support > 0.15));
      } catch (e) {
        console.error("AI Rules không sẵn sàng");
      }

      const data = res.data;
      if (Array.isArray(data)) setAllCars(data);
      else if (Array.isArray(data.content)) setAllCars(data.content);
      else {
        setAllCars([]);
        setError("Dữ liệu trả về không đúng định dạng.");
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách xe:", error);
      setAllCars([]);
      setError("Không thể tải danh sách xe.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    const minPrice = parsePrice(deferredFilters.minPrice);
    const maxPrice = parsePrice(deferredFilters.maxPrice);
    const minYear = Number(deferredFilters.minYear) || null;
    const maxYear = Number(deferredFilters.maxYear) || null;

    const result = allCars.filter((car) => {
      const title = toLower(car.tieuDe);
      const location = toLower(car.diaDiem);
      const fuel = toLower(car.nhienLieu);
      const transmission = toLower(car.hopSo);
      const bodyStyle = toLower(car.kieuDang);
      const origin = toLower(car.xuatXu);
      const condition = toLower(car.tinhTrang);
      const price = parsePrice(car.gia);
      const yearValue = Number(car.namSX || car.namSx) || null;

      if (keyword) {
        const haystack = [
          title,
          location,
          fuel,
          transmission,
          bodyStyle,
          origin,
          condition,
          String(car.id),
        ]
          .filter(Boolean)
          .join(" ");
        if (!haystack.includes(keyword)) return false;
      }

      if (
        deferredFilters.location &&
        !location.includes(deferredFilters.location.trim().toLowerCase())
      )
        return false;
      if (
        deferredFilters.fuel !== "all" &&
        fuel !== deferredFilters.fuel.toLowerCase()
      )
        return false;
      if (
        deferredFilters.transmission !== "all" &&
        transmission !== deferredFilters.transmission.toLowerCase()
      )
        return false;
      if (
        deferredFilters.bodyStyle !== "all" &&
        bodyStyle !== deferredFilters.bodyStyle.toLowerCase()
      )
        return false;
      if (
        deferredFilters.origin !== "all" &&
        origin !== deferredFilters.origin.toLowerCase()
      )
        return false;
      if (
        deferredFilters.condition !== "all" &&
        condition !== deferredFilters.condition.toLowerCase()
      )
        return false;
      if (minPrice !== null && (price === null || price < minPrice))
        return false;
      if (maxPrice !== null && (price === null || price > maxPrice))
        return false;
      if (minYear !== null && (yearValue === null || yearValue < minYear))
        return false;
      if (maxYear !== null && (yearValue === null || yearValue > maxYear))
        return false;

      return true;
    });

    return result.sort((a, b) => {
      const priceA = parsePrice(a.gia) || 0;
      const priceB = parsePrice(b.gia) || 0;
      const yearA = Number(a.namSX || a.namSx) || 0;
      const yearB = Number(b.namSX || b.namSx) || 0;

      switch (sortBy) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "year-asc":
          return yearA - yearB;
        case "year-desc":
          return yearB - yearA;
        default:
          return 0;
      }
    });
  }, [allCars, deferredFilters, deferredQuery, sortBy]);

  useEffect(() => {
    setPage(0);
  }, [deferredFilters, deferredQuery, sortBy]);

  const paginatedCars = useMemo(() => {
    const startIndex = page * size;
    return filteredCars.slice(startIndex, startIndex + size);
  }, [filteredCars, page, size]);

  const totalPages = Math.ceil(filteredCars.length / size);

  const handleSearch = () => {
    setQuery(searchInput);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleClearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      fuel: "all",
      transmission: "all",
      bodyStyle: "all",
      origin: "all",
      condition: "all",
      location: "",
    });
    setSearchInput("");
    setQuery("");
  };

  const isNationalConfig = (car) => {
    if (!popularRules || popularRules.length === 0) return false;

    const brand = car.tieuDe ? car.tieuDe.split(" ")[0].toLowerCase() : "";
    const fuel = car.nhienLieu ? car.nhienLieu.toLowerCase() : "";
    const trans = car.hopSo ? car.hopSo.toLowerCase() : "";

    const carTraits = [
      `brand_${brand}`,
      `trans_${trans}`,
      `fuel_${fuel}`,
      `segment_${car.segmentId}`,
    ];

    return popularRules.some((rule) => {
      const ruleTraits = [...rule.antecedents, ...rule.consequents].map((t) =>
        t.toLowerCase(),
      );
      return ruleTraits.every((trait) => carTraits.includes(trait));
    });
  };

  const activeInsight = useMemo(() => {
    if (!aiRules.length) return null;
    const userTraits = [];

    if (deferredFilters.bodyStyle !== "all")
      userTraits.push(
        `style_${deferredFilters.bodyStyle.trim().toLowerCase()}`,
      );
    if (deferredFilters.fuel !== "all")
      userTraits.push(`fuel_${deferredFilters.fuel.trim().toLowerCase()}`);

    const minP = parsePrice(deferredFilters.minPrice) || 0;
    const maxP = parsePrice(deferredFilters.maxPrice) || 999999999999;

    if (deferredFilters.minPrice || deferredFilters.maxPrice) {
      const avgPrice =
        minP === 0 ? maxP : maxP === 999999999999 ? minP : (minP + maxP) / 2;
      if (avgPrice < 400000000) userTraits.push("price_<400tr");
      else if (avgPrice <= 700000000) userTraits.push("price_400-700tr");
      else if (avgPrice <= 1000000000) userTraits.push("price_700-1ty");
      else userTraits.push("price_>1ty");
    }

    if (userTraits.length === 0) return null;

    let bestRule = null;
    let maxScore = 0;

    aiRules.forEach((rule) => {
      const allItemsInRule = [...rule.antecedents, ...rule.consequents].map(
        (a) => a.trim().toLowerCase(),
      );
      const brandItem = allItemsInRule.find((item) =>
        item.startsWith("brand_"),
      );
      if (!brandItem) return;

      let score = 0;
      let hasConflict = false;

      userTraits.forEach((ut) => {
        const prefix = ut.split("_")[0];
        const ruleItemWithSamePrefix = allItemsInRule.find((item) =>
          item.startsWith(prefix + "_"),
        );
        if (ruleItemWithSamePrefix) {
          if (ruleItemWithSamePrefix === ut) score += 1;
          else hasConflict = true;
        }
      });

      if (!hasConflict && score > 0 && score > maxScore) {
        maxScore = score;
        bestRule = {
          confidence: rule.confidence,
          brand: brandItem.split("_")[1],
        };
      }
    });

    if (bestRule) {
      return {
        text: `🤖 Chuyên gia AI: Dựa trên phân tích xu hướng thị trường, ${(bestRule.confidence * 100).toFixed(0)}% khách hàng có nhu cầu tương tự đã quyết định chọn dòng xe ${bestRule.brand.toUpperCase()}.`,
        brand: bestRule.brand,
      };
    }
    return null;
  }, [
    deferredFilters.bodyStyle,
    deferredFilters.fuel,
    deferredFilters.minPrice,
    deferredFilters.maxPrice,
    aiRules,
  ]);

  const applyBrandSuggestion = (brandName) => {
    setSearchInput(brandName);
    setQuery(brandName);
    setShowAdvanced(false);
  };

  const buildOptions = (list) => [
    { value: "all", label: "Tất cả" },
    ...list.map((item) => ({ value: item.toLowerCase(), label: item })),
  ];

  return (
    <div className="car-page">
      {/* <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Danh sách xe</h1>
          <p>Tìm kiếm, lọc và phân tích danh sách xe theo nhu cầu của bạn.</p>
        </div>
      </div> */}

      <div className="premium-list-header">
        {/* Thêm 3 thẻ div làm quả cầu ánh sáng */}
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>

        <h1 className="premium-title">
          Danh Sách <span>Xe </span>
        </h1>
        <p className="premium-subtitle">
          Tìm kiếm, chắt lọc và phân tích dữ liệu hàng ngàn mẫu xe để tìm ra lựa
          chọn hoàn hảo nhất dành riêng cho bạn.
        </p>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <input
            className="search-input filter-control"
            type="text"
            placeholder="Từ khóa, ID, địa điểm, nhiên liệu..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSearch}
          >
            Tìm kiếm
          </button>
        </div>

        <div className="result-summary">
          {activeInsight && (
            <div
              className="ai-insight-box"
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span>{activeInsight.text}</span>
              <button
                className="btn btn-primary"
                style={{
                  padding: "6px 14px",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  backgroundColor: "#f59e0b",
                  border: "none",
                }}
                onClick={() => applyBrandSuggestion(activeInsight.brand)}
              >
                Xem xe {activeInsight.brand.toUpperCase()} ngay
              </button>
            </div>
          )}
          {/* <div className="tag-row">
            <span className="badge">{filteredCars.length} xe</span>
            <span className="badge">
              Trang {filteredCars.length === 0 ? 0 : page + 1}
            </span>
            <span className="badge">Kích thước {size}</span>
          </div> */}

          <div className="filter-actions">
            <div style={{ width: "200px" }}>
              <CustomSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "price-desc", label: "Giá cao - thấp" },
                  { value: "price-asc", label: "Giá thấp - cao" },
                  { value: "year-desc", label: "Năm mới - cũ" },
                  { value: "year-asc", label: "Năm cũ - mới" },
                ]}
              />
            </div>
            <button
              type="button"
              className="filter-toggle"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              {showAdvanced ? "Ẩn bộ lọc nâng cao" : "Bộ lọc nâng cao"}
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="filters-grid">
            <div className="filter-group">
              <label>Giá tối thiểu</label>
              <input
                className="filter-control"
                type="text"
                placeholder="Ví dụ 300 triệu"
                value={filters.minPrice}
                onChange={handleFilterChange("minPrice")}
              />
            </div>
            <div className="filter-group">
              <label>Giá tối đa</label>
              <input
                className="filter-control"
                type="text"
                placeholder="Ví dụ 1 tỷ"
                value={filters.maxPrice}
                onChange={handleFilterChange("maxPrice")}
              />
            </div>
            <div className="filter-group">
              <label>Năm từ</label>
              <input
                className="filter-control"
                type="number"
                placeholder="2015"
                value={filters.minYear}
                onChange={handleFilterChange("minYear")}
              />
            </div>
            <div className="filter-group">
              <label>Năm đến</label>
              <input
                className="filter-control"
                type="number"
                placeholder="2024"
                value={filters.maxYear}
                onChange={handleFilterChange("maxYear")}
              />
            </div>

            <div className="filter-group">
              <label>Nhiên liệu</label>
              <CustomSelect
                value={filters.fuel}
                onChange={handleFilterChange("fuel")}
                options={buildOptions(FUEL_OPTIONS)}
              />
            </div>
            <div className="filter-group">
              <label>Hộp số</label>
              <CustomSelect
                value={filters.transmission}
                onChange={handleFilterChange("transmission")}
                options={buildOptions(TRANSMISSION_OPTIONS)}
              />
            </div>
            <div className="filter-group">
              <label>Kiểu dáng</label>
              <CustomSelect
                value={filters.bodyStyle}
                onChange={handleFilterChange("bodyStyle")}
                options={buildOptions(BODY_STYLE_OPTIONS)}
              />
            </div>
            <div className="filter-group">
              <label>Xuất xứ</label>
              <CustomSelect
                value={filters.origin}
                onChange={handleFilterChange("origin")}
                options={buildOptions(ORIGIN_OPTIONS)}
              />
            </div>
            <div className="filter-group">
              <label>Tình trạng</label>
              <CustomSelect
                value={filters.condition}
                onChange={handleFilterChange("condition")}
                options={buildOptions(CONDITION_OPTIONS)}
              />
            </div>
            <div className="filter-group">
              <label>Địa điểm</label>
              <input
                className="filter-control"
                type="text"
                placeholder="Hà Nội, TP HCM..."
                value={filters.location}
                onChange={handleFilterChange("location")}
              />
            </div>

            <div
              className="filter-actions"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <button
                className="btn btn-outline"
                style={{
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  padding: "10px 20px",
                  borderRadius: "10px",
                }}
                type="button"
                onClick={handleClearFilters}
              >
                Đóng / Đặt lại
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Đang tải danh sách xe...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : paginatedCars.length === 0 ? (
        <div className="empty-state">Không có xe phù hợp bộ lọc hiện tại.</div>
      ) : (
        <div className="car-grid">
          {paginatedCars.map((car) => (
            <div
              key={car.id}
              className="car-card"
              onClick={() => navigate(`/cars/${car.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="car-image-wrap">
                {isNationalConfig(car) && (
                  <div className="national-badge">🔥 Cấu hình quốc dân</div>
                )}
                <img
                  src={car.urlHinhAnh || IMAGE_FALLBACK}
                  alt={car.tieuDe || "Car image"}
                  className="car-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = IMAGE_FALLBACK;
                  }}
                />
              </div>

              <div className="car-card-body">
                <div className="car-title-row">
                  <h3>{car.tieuDe || "Không có tiêu đề"}</h3>
                  <span className="car-year">
                    {car.namSX || car.namSx || "N/A"}
                  </span>
                </div>
                {/* SỬ DỤNG formatPrice Ở ĐÂY */}
                <p className="car-price">{formatPrice(car.gia)}</p>
                <div className="car-meta-grid">
                  <div>
                    <span>Số km</span>
                    <strong>{": " + (car.soKmDaDi || "N/A")}</strong>
                  </div>
                  <div>
                    <span>Nhiên liệu</span>
                    <strong>{": " + (car.nhienLieu || "N/A")}</strong>
                  </div>
                  <div>
                    <span>Hộp số</span>
                    <strong>{": " + (car.hopSo || "N/A")}</strong>
                  </div>
                  <div>
                    <span>ID</span>
                    <strong>{": " + (car.id || "N/A")}</strong>
                  </div>
                </div>
                <button
                  className="primary-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/cars/${car.id}`);
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(0)}>
            {"<<"}
          </button>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            {"<"}
          </button>
          {[...Array(totalPages)].map((_, i) => {
            if (
              i === 0 ||
              i === totalPages - 1 ||
              (i >= page - 2 && i <= page + 2)
            ) {
              return (
                <button
                  key={i}
                  className={i === page ? "active-page" : ""}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              );
            }
            if (i === page - 3 || i === page + 3)
              return <span key={i}>...</span>;
            return null;
          })}
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {">"}
          </button>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(totalPages - 1)}
          >
            {">>"}
          </button>
        </div>
      )}
      <AIChat />
    </div>
  );
}

export default CarListPage;
