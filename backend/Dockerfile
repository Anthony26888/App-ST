FROM node:18

# --- FIX MÚI GIỜ CHO CONTAINER + NODE.JS ---
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
# -------------------------------------------

WORKDIR /app

# Cài các gói cần thiết để build node-canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Port backend
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "dev"]
