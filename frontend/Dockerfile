# Stage 1: Build the Vue.js application
FROM node:18-alpine AS build
WORKDIR /app

# python3, make và g++ là cần thiết để biên dịch các native addon như bcrypt
RUN apk add --no-cache --virtual .gyp python3 make g++
# ----> THAY ĐỔI Ở ĐÂY: Định nghĩa các ARG <----
# Các giá trị mặc định này sẽ bị ghi đè bởi build args từ docker-compose
ARG VITE_API_URL=http://192.168.100.80:3000 # Giá trị mặc định nếu không được truyền
ARG VITE_SOCKET_URL=http://192.168.100.80:3000
ARG VITE_DIGIKEY_CLIENT_ID=default_client_id

# ----> THAY ĐỔI Ở ĐÂY: Đặt ENV từ ARG để npm run build sử dụng <----
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
ENV VITE_DIGIKEY_CLIENT_ID=${VITE_DIGIKEY_CLIENT_ID}
# KHÔNG ĐẶT BIẾN BÍ MẬT Ở ĐÂY

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# ----> THÊM BƯỚC NÀY: Gỡ bỏ các công cụ build sau khi cài xong <----
RUN apk del .gyp
    
# Copy the rest of the application code
COPY . .

# Build the application (sẽ sử dụng các biến ENV ở trên)
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
