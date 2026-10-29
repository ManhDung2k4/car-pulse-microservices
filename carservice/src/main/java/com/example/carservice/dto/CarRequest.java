package com.example.carservice.dto;

import jakarta.validation.constraints.NotBlank;

public class CarRequest {

    // @NotBlank(message = "Mã tin is required")
    private String maTin;

    private String tieuDe;
    private String url;
    private String urlHinhAnh;
    private String ngayDang;
    private String namSX;
    private String xuatXu;
    private String diaDiem;
    private String kieuDang;
    private String soKmDaDi;
    private String hopSo;
    private String tinhTrang;
    private String nhienLieu;
    private String gia;
    private String tenNguoiBan;
private String sdtNguoiBan;
private String salonShowroom;
private String loaiNguoiBan;
private String diaChiNguoiBan;

    public CarRequest() {
    }
public String getTenNguoiBan() {
    return tenNguoiBan;
}

public void setTenNguoiBan(String tenNguoiBan) {
    this.tenNguoiBan = tenNguoiBan;
}

public String getSdtNguoiBan() {
    return sdtNguoiBan;
}

public void setSdtNguoiBan(String sdtNguoiBan) {
    this.sdtNguoiBan = sdtNguoiBan;
}

public String getSalonShowroom() {
    return salonShowroom;
}

public void setSalonShowroom(String salonShowroom) {
    this.salonShowroom = salonShowroom;
}

public String getLoaiNguoiBan() {
    return loaiNguoiBan;
}

public void setLoaiNguoiBan(String loaiNguoiBan) {
    this.loaiNguoiBan = loaiNguoiBan;
}

public String getDiaChiNguoiBan() {
    return diaChiNguoiBan;
}

public void setDiaChiNguoiBan(String diaChiNguoiBan) {
    this.diaChiNguoiBan = diaChiNguoiBan;
}
    public String getMaTin() {
        return maTin;
    }

    public void setMaTin(String maTin) {
        this.maTin = maTin;
    }

    public String getTieuDe() {
        return tieuDe;
    }

    public void setTieuDe(String tieuDe) {
        this.tieuDe = tieuDe;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getUrlHinhAnh() {
        return urlHinhAnh;
    }

    public void setUrlHinhAnh(String urlHinhAnh) {
        this.urlHinhAnh = urlHinhAnh;
    }

    public String getNgayDang() {
        return ngayDang;
    }

    public void setNgayDang(String ngayDang) {
        this.ngayDang = ngayDang;
    }

    public String getNamSX() {
        return namSX;
    }

    public void setNamSX(String namSX) {
        this.namSX = namSX;
    }

    public String getXuatXu() {
        return xuatXu;
    }

    public void setXuatXu(String xuatXu) {
        this.xuatXu = xuatXu;
    }

    public String getDiaDiem() {
        return diaDiem;
    }

    public void setDiaDiem(String diaDiem) {
        this.diaDiem = diaDiem;
    }

    public String getKieuDang() {
        return kieuDang;
    }

    public void setKieuDang(String kieuDang) {
        this.kieuDang = kieuDang;
    }

    public String getSoKmDaDi() {
        return soKmDaDi;
    }

    public void setSoKmDaDi(String soKmDaDi) {
        this.soKmDaDi = soKmDaDi;
    }

    public String getHopSo() {
        return hopSo;
    }

    public void setHopSo(String hopSo) {
        this.hopSo = hopSo;
    }

    public String getTinhTrang() {
        return tinhTrang;
    }

    public void setTinhTrang(String tinhTrang) {
        this.tinhTrang = tinhTrang;
    }

    public String getNhienLieu() {
        return nhienLieu;
    }

    public void setNhienLieu(String nhienLieu) {
        this.nhienLieu = nhienLieu;
    }

    public String getGia() {
        return gia;
    }

    public void setGia(String gia) {
        this.gia = gia;
    }
}