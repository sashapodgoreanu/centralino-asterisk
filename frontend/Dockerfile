ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000
ARG VITE_WS_URL=http://localhost:3000
ARG VITE_SIP_WS_URL=ws://localhost:8088/ws
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_SIP_WS_URL=${VITE_SIP_WS_URL}
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
