# Bước 1: Mượn một máy ảo có sẵn Maven và Java 17 để build code
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy file cấu hình thư viện và toàn bộ source code vào
COPY pom.xml .
COPY src ./src

# Chạy lệnh đóng gói dự án thành file .jar
RUN mvn clean package -DskipTests

# Bước 2: Tạo môi trường chạy thật siêu nhẹ (chỉ chứa Java Runtime)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Lấy file .jar vừa build xong ở Bước 1 sang đây
COPY --from=build /app/target/*.jar app.jar

# Lệnh khởi chạy ứng dụng Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]