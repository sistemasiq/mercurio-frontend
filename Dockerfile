FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
# npm ci: instala exactamente el lock. Sin hooks de husky dentro de la imagen.
ENV HUSKY=0
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_APP_TITLE="Woow Kids"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
