# build stage
FROM node:18 as build-stage

WORKDIR /app

# Nhận toàn bộ biến cần thiết từ docker-compose hoặc dòng lệnh
ARG VITE_API_URL
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG VITE_DIGIKEY_CLIENT_ID
ARG VITE_DIGIKEY_CLIENT_SECRET
ARG VITE_GROQ_API_KEY

# Gán vào ENV để Vite thấy khi build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY
ENV VITE_DIGIKEY_CLIENT_ID=$VITE_DIGIKEY_CLIENT_ID
ENV VITE_DIGIKEY_CLIENT_SECRET=$VITE_DIGIKEY_CLIENT_SECRET
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

