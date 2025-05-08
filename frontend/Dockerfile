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

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=build /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
