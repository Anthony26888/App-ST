# build stage
FROM node:18 as build-stage

WORKDIR /app

# Nhận toàn bộ biến cần thiết từ docker-compose hoặc dòng lệnh
ARG VITE_API_URL
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG VITE_GROQ_API_KEY
ARG VITE_BANK_CODE
ARG VITE_BANK_ACCOUNT
ARG VITE_BANK_OWNER
ARG VITE_ZALO_CONTACT

# Gán vào ENV để Vite thấy khi build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
ENV VITE_BANK_CODE=$VITE_BANK_CODE
ENV VITE_BANK_ACCOUNT=$VITE_BANK_ACCOUNT
ENV VITE_BANK_OWNER=$VITE_BANK_OWNER
ENV VITE_ZALO_CONTACT=$VITE_ZALO_CONTACT

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage

RUN sed -i 's/application\/javascript[[:space:]]\+js;/application\/javascript js mjs;/' /etc/nginx/mime.types

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

