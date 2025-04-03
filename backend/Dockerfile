FROM node:22

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy chỉ package.json (bỏ package-lock.json)
COPY package.json ./
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở cổng và chạy server
EXPOSE 3000
CMD ["node", "Server.js"]
