FROM node:22

WORKDIR /app

# Cài đặt dependencies
# Copy chỉ package.json (bỏ package-lock.json)
COPY package.json ./
RUN npm install

# Copy mã nguồn
COPY . .

# Build project
RUN npm run build

# Serve ứng dụng
CMD ["npm", "run", "dev"]
