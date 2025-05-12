# Build stage
FROM node:18 as build-stage

WORKDIR /app

# Install yarn
RUN npm install -g yarn

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy project files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV VITE_APP_TITLE=App-ST

# Build the app
RUN yarn build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy built files from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 