package com.example.carservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "du_lieu_oto")
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_tin")
    private String maTin;

    @Column(name = "tieu_de", columnDefinition = "TEXT")
    private String tieuDe;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;

    @Column(name = "url_hinh_anh", columnDefinition = "TEXT")
    private String urlHinhAnh;

    @Column(name = "ngay_dang")
    private String ngayDang;

    @Column(name = "nam_sx")
    private String namSX;

    @Column(name = "xuat_xu")
    private String xuatXu;

    @Column(name = "dia_diem")
    private String diaDiem;

    @Column(name = "kieu_dang")
    private String kieuDang;

    @Column(name = "so_km_da_di")
    private String soKmDaDi;

    @Column(name = "hop_so")
    private String hopSo;

    @Column(name = "tinh_trang")
    private String tinhTrang;

    @Column(name = "nhien_lieu")
    private String nhienLieu;

    @Column(name = "gia")
    private String gia;
@Column(name = "ten_nguoi_ban")
private String tenNguoiBan;

@Column(name = "sdt_nguoi_ban")
private String sdtNguoiBan;

@Column(name = "salon_showroom")
private String salonShowroom;

@Column(name = "loai_nguoi_ban")
private String loaiNguoiBan;

@Column(name = "dia_chi_nguoi_ban", columnDefinition = "TEXT")
private String diaChiNguoiBan;

    public Car() {
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
    public Long getId() {
        return id;
    }

    public String getMaTin() {
        return maTin;
    }

    public String getTieuDe() {
        return tieuDe;
    }

    public String getUrl() {
        return url;
    }

    public String getUrlHinhAnh() {
        return urlHinhAnh;
    }

    public String getNgayDang() {
        return ngayDang;
    }

    public String getNamSX() {
        return namSX;
    }

    public String getXuatXu() {
        return xuatXu;
    }

    public String getDiaDiem() {
        return diaDiem;
    }

    public String getKieuDang() {
        return kieuDang;
    }

    public String getSoKmDaDi() {
        return soKmDaDi;
    }

    public String getHopSo() {
        return hopSo;
    }

    public String getTinhTrang() {
        return tinhTrang;
    }

    public String getNhienLieu() {
        return nhienLieu;
    }

    public String getGia() {
        return gia;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setMaTin(String maTin) {
        this.maTin = maTin;
    }

    public void setTieuDe(String tieuDe) {
        this.tieuDe = tieuDe;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public void setUrlHinhAnh(String urlHinhAnh) {
        this.urlHinhAnh = urlHinhAnh;
    }

    public void setNgayDang(String ngayDang) {
        this.ngayDang = ngayDang;
    }

    public void setNamSX(String namSX) {
        this.namSX = namSX;
    }

    public void setXuatXu(String xuatXu) {
        this.xuatXu = xuatXu;
    }

    public void setDiaDiem(String diaDiem) {
        this.diaDiem = diaDiem;
    }

    public void setKieuDang(String kieuDang) {
        this.kieuDang = kieuDang;
    }

    public void setSoKmDaDi(String soKmDaDi) {
        this.soKmDaDi = soKmDaDi;
    }

    public void setHopSo(String hopSo) {
        this.hopSo = hopSo;
    }

    public void setTinhTrang(String tinhTrang) {
        this.tinhTrang = tinhTrang;
    }

    public void setNhienLieu(String nhienLieu) {
        this.nhienLieu = nhienLieu;
    }

    public void setGia(String gia) {
        this.gia = gia;
    }
}