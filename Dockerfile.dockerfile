# Dockerfile

# ---- Stage 1: Build Frontend ----
FROM node:18-alpine AS builder

# Đặt biến môi trường build-time cho Vite
# Bạn cần truyền biến này khi build image, ví dụ: docker build --build-arg VITE_SOCKET_URL=http://your-server-ip:3000 .
ARG VITE_SOCKET_URL
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

WORKDIR /app/frontend

# Copy package files và cài đặt dependencies trước để tận dụng cache
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy toàn bộ source code frontend
COPY frontend/ ./

# Build frontend
# Thay 'build' bằng script build thực tế trong frontend/package.json nếu khác
RUN npm run build

# ---- Stage 2: Setup Backend & Final Image ----
FROM node:18-alpine

WORKDIR /app

# Set môi trường production
ENV NODE_ENV=production
# Đặt PORT (mặc dù đã hardcode trong server.js, đây là good practice)
ENV PORT=3000

# Copy package files của backend và cài đặt dependencies production
COPY backend/package.json backend/package-lock.json* ./
# Chỉ cài đặt production dependencies
RUN npm install --production --ignore-scripts

# Copy source code backend
# Lưu ý: database.db và uploads sẽ được mount qua volume, không cần copy ở đây
COPY backend/ ./

# Copy frontend build từ stage 'builder' vào đúng vị trí mà server.js mong đợi
# server.js dùng path.join(__dirname, "../frontend/dist")
# __dirname trong container sẽ là /app, nên cần copy vào /app/frontend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Tạo thư mục uploads nếu chưa có (mặc dù volume sẽ làm điều này)
RUN mkdir -p /app/uploads

# Khai báo Volume cho database và uploads để dữ liệu được lưu trữ bên ngoài container
# Đường dẫn /app/database.db là nơi database.js tìm file SQLite
# Đường dẫn /app/uploads là nơi multer lưu file
VOLUME ["/app/database.db", "/app/uploads"]

# Expose port mà ứng dụng chạy
EXPOSE 3000

# Lệnh để chạy ứng dụng
CMD ["node", "server.js"]
