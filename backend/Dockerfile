# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# ----> THÊM BƯỚC NÀY: Cài đặt các công cụ build cần thiết <----
RUN apk add --no-cache --virtual .gyp python3 make g++

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json* ./

# Install dependencies using npm ci for faster, reliable builds
RUN npm ci 

# ----> THÊM BƯỚC NÀY: Gỡ bỏ các công cụ build sau khi cài xong <----
RUN apk del .gyp

# Copy the rest of the application code
COPY . .

# Make port 5000 available to the world outside this container (adjust if your backend uses a different port)
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
# Assumes your package.json has a "start" script (e.g., "node server.js")
# CMD [ "npm", "start" ]

# If you don't have an npm start script, you might use:
CMD [ "node", "server.js" ]
