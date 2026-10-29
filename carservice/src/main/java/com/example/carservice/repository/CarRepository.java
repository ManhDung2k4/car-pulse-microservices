// package com.example.carservice.repository;

// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;

// import com.example.carservice.entity.Car;

// public interface CarRepository extends JpaRepository<Car, Long> {

//     @Query("""
//         SELECT c FROM Car c
//         WHERE c.tieuDe IS NOT NULL AND TRIM(c.tieuDe) <> ''
//           AND c.urlHinhAnh IS NOT NULL AND TRIM(c.urlHinhAnh) <> ''
//           AND c.gia IS NOT NULL AND TRIM(c.gia) <> ''
//           AND c.namSX IS NOT NULL AND TRIM(c.namSX) <> ''
//           AND c.soKmDaDi IS NOT NULL AND TRIM(c.soKmDaDi) <> ''
//           AND c.nhienLieu IS NOT NULL AND TRIM(c.nhienLieu) <> ''
//           AND c.hopSo IS NOT NULL AND TRIM(c.hopSo) <> ''
//     """)
//     Page<Car> findAllValidCars(Pageable pageable);
// }

package com.example.carservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.carservice.entity.Car;

public interface CarRepository extends JpaRepository<Car, Long> {

    // Lọc bỏ những xe rác (không có tiêu đề, không có giá, không có năm SX).
    // Các thông số phụ như hộp số, nhiên liệu, số km... nếu thiếu thì vẫn cho qua để FE hiện "N/A".
    @Query("""
        SELECT c FROM Car c
        WHERE c.tieuDe IS NOT NULL AND TRIM(c.tieuDe) <> ''
          AND c.gia IS NOT NULL AND TRIM(c.gia) <> ''
          AND c.namSX IS NOT NULL AND TRIM(c.namSX) <> ''
    """)
    Page<Car> findAllValidCars(Pageable pageable);
}