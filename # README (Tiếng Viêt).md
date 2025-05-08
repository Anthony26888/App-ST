# Frontend cho App-ST

Đây là ứng dụng frontend cho hệ thống quản lý nội bộ App-ST, được xây dựng bằng Vue.js 3, Vite và Vuetify 3. Nó cung cấp giao diện người dùng để quản lý các khía cạnh khác nhau của doanh nghiệp, bao gồm quản lý kho, kiểm tra BOM, theo dõi dự án và quản trị người dùng.

## Tính năng

*   **Xác thực:** Đăng nhập và đăng xuất người dùng an toàn bằng JWT.
*   **Kiểm soát truy cập dựa trên vai trò:** Các tính năng và giao diện khác nhau có thể truy cập được dựa trên vai trò người dùng (Admin, Kế hoạch, Thủ kho, Kinh doanh, Quản lý).
*   **Quản lý Kho (Tồn Kho / Tồn Kho 2):**
    *   Xem danh sách tồn kho với chức năng tìm kiếm và phân trang.
    *   Thêm mặt hàng tồn kho mới thủ công.
    *   Chỉnh sửa mặt hàng tồn kho hiện có (bao gồm tính toán tồn kho tự động dựa trên nhập/xuất).
    *   Xóa mặt hàng tồn kho.
    *   Nhập dữ liệu tồn kho từ tệp Excel.
    *   Xuất dữ liệu tồn kho hiện tại ra tệp Excel.
    *   Lấy và hiển thị chi tiết linh kiện (datasheet, thông số, hình ảnh) từ API Digi-Key.
*   **Kiểm tra BOM (Kiểm tra số liệu):**
    *   Tải lên tệp Bill of Materials (BOM) cùng với chi tiết dự án (PO, Số lượng).
    *   Xử lý BOM dựa trên tồn kho hiện tại để kiểm tra tính khả dụng.
    *   Xem kết quả BOM đã xử lý.
    *   Tải xuống dữ liệu BOM đã xử lý dưới dạng tệp Excel.
    *   Lưu dữ liệu BOM đã xử lý thành "Đơn hàng" để theo dõi.
    *   Chỉnh sửa/Xóa định nghĩa BOM đã tải lên trước đó.
*   **Theo dõi Đơn hàng (Tình trạng đơn hàng):**
    *   Xem danh sách các đơn hàng đã lưu được tạo từ việc kiểm tra BOM.
    *   Kiểm tra trạng thái đơn hàng (Chờ xử lý/Đã xác nhận bởi kho).
    *   Xem chi tiết đơn hàng.
    *   Xóa đơn hàng.
*   **Quản lý Dự án (Dự án):**
    *   Xem danh sách khách hàng/dự án.
    *   Thêm/Sửa/Xóa khách hàng.
    *   Nhập dữ liệu dự án (có thể là cấu trúc khách hàng/PO) từ Excel.
    *   Xem chi tiết Đơn đặt hàng (PO) cho từng khách hàng.
    *   Thêm/Sửa/Xóa các mục trong một PO cụ thể (theo dõi số lượng đã giao so với còn lại).
    *   Tải xuống chi tiết PO cụ thể dưới dạng tệp Excel.
*   **Cài đặt (Chỉ dành cho Admin):**
    *   Xem danh sách người dùng ứng dụng.
    *   Thêm người dùng mới với vai trò cụ thể.
    *   Chỉnh sửa thông tin và vai trò người dùng hiện có.
    *   Xóa người dùng.
    *   Xóa hàng loạt dữ liệu cho các module cụ thể (Kho, Kho 2, BOM, Dự án).

## Ngăn xếp Công nghệ

*   **Frontend:**
    *   Vue.js 3 (Composition API)
    *   Vite
    *   Vuetify 3
    *   Vue Router 4
    *   Axios (để gửi yêu cầu API)
    *   jwt-decode (để giải mã token JWT)
*   **Backend:** Repository này chỉ chứa mã nguồn frontend. Nó yêu cầu một API backend riêng biệt để hoạt động, API này xử lý việc lưu trữ dữ liệu, logic nghiệp vụ, xác thực và tương tác với các dịch vụ bên ngoài như Digi-Key.

## Điều kiện tiên quyết

*   Node.js (khuyến nghị v18 trở lên)
*   npm hoặc yarn

## Cài đặt

1.  **Sao chép (clone) repository:**
    ```bash
    git clone <your-repository-url>
    cd App-ST/frontend
    ```

2.  **Cài đặt các dependencies (thư viện phụ thuộc):**
    cài đặt thư viện
    npm install axios body-parser buffer cors dotenv express fs mine-types multer puppeteer socket.io-client socket.io sqlite3 xlsx
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Cấu hình Biến Môi trường:**
    Tạo một tệp `.env` trong thư mục gốc `frontend`. Sao chép nội dung của `.env.example` (nếu có) hoặc thêm các biến sau:

    ```env
    # URL của máy chủ API backend
    VITE_API_URL=http://localhost:3000 # Thay thế bằng URL backend thực tế của bạn

    # Thông tin xác thực API Digi-Key (cho tính năng tra cứu linh kiện)
    VITE_DIGIKEY_CLIENT_ID=YOUR_DIGIKEY_CLIENT_ID
    VITE_DIGIKEY_CLIENT_SECRET=YOUR_DIGIKEY_CLIENT_SECRET
    ```
    *   Thay thế `http://localhost:3000` bằng URL thực tế nơi API backend của bạn đang chạy.
    *   Lấy thông tin xác thực API từ Cổng API Digi-Key nếu bạn cần tính năng tra cứu linh kiện.

## Chạy Ứng dụng

1.  **Khởi động server phát triển:**
    ```bash
    npm run dev
    # hoặc
    yarn dev
    ```

2.  Mở trình duyệt của bạn và truy cập URL được cung cấp bởi Vite (thường là `http://localhost:5173`).

## Xây dựng cho Môi trường Production

1.  **Xây dựng ứng dụng:**
    ```bash
    npm run build
    # hoặc
    yarn build
    ```

2.  Thao tác này sẽ tạo một thư mục `dist` chứa các tài sản tĩnh đã được tối ưu hóa. Triển khai (deploy) nội dung của thư mục này lên máy chủ web hoặc nền tảng lưu trữ của bạn.

## Cấu trúc Dự án


## EmailJS
1. Tài khoản
    Email: sieuthuatapp@outlook.com
    Mật khẩu: sieuthuat123

## Digikey
1. Tài khoản
    Email: sieuthuatapp@outlook.com
    Mật khẩu: sieuthuat123

## Cài đặt và Chạy với Docker

### Yêu cầu
- Docker
- Docker Compose

### Các bước cài đặt

1. **Tạo file Dockerfile cho Frontend**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Cài đặt các dependencies cần thiết
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Cài đặt dependencies với legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Cài đặt serve để chạy ứng dụng đã build
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Chạy ứng dụng đã build
CMD ["serve", "-s", "dist", "-l", "3000"]
```

2. **Tạo file Dockerfile cho Backend**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Cài đặt các dependencies cần thiết
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Cài đặt dependencies với legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

3. **Tạo file docker-compose.yml**
```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3001
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

### Chạy ứng dụng

1. **Xóa các container và image cũ**
```bash
# Xóa tất cả container và image
docker-compose down --rmi all

# Xóa node_modules và package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
```

2. **Build và chạy**
```bash
# Build với memory limit cao hơn
docker-compose build --memory=4g

# Chạy ứng dụng
docker-compose up
```

### Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Lưu ý
- Đảm bảo các port 3000 và 3001 không bị sử dụng bởi ứng dụng khác
- Nếu cần thay đổi port, có thể chỉnh sửa trong file docker-compose.yml
- Để xem logs của các container:
  ```bash
  docker-compose logs -f
  ```
- Để xem logs của một service cụ thể:
  ```bash
  docker-compose logs -f frontend
  docker-compose logs -f backend
  ```

### Troubleshooting
1. Nếu gặp lỗi permission khi chạy Docker:
   ```bash
   sudo chmod 666 /var/run/docker.sock
   ```

2. Nếu gặp lỗi khi build:
   ```bash
   # Xóa node_modules và package-lock.json
   rm -rf frontend/node_modules frontend/package-lock.json
   rm -rf backend/node_modules backend/package-lock.json
   
   # Build lại với memory limit cao hơn
   docker-compose build --memory=4g
   ```

3. Nếu gặp lỗi về dependencies:
   ```bash
   # Thử cài đặt dependencies thủ công
   cd frontend && npm install --legacy-peer-deps
   cd ../backend && npm install --legacy-peer-deps
   
   # Sau đó build lại
   docker-compose up --build
   ```

