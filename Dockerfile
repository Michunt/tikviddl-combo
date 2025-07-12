FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Build stage for the frontend
FROM base AS frontend-build
WORKDIR /app
COPY cobalt/web/package*.json ./
RUN npm install
COPY cobalt/web/ ./
RUN npm run build

# Build stage for the backend
FROM base AS backend-build
WORKDIR /app
COPY cobalt/ ./
RUN corepack enable
RUN apk add --no-cache python3 alpine-sdk
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile
RUN pnpm deploy --filter=@imput/cobalt-api --prod /prod/api

# Final stage
FROM base AS final
WORKDIR /app

# Install FFmpeg and nginx
RUN apk add --no-cache ffmpeg nginx

# Copy backend
COPY --from=backend-build --chown=node:node /prod/api /app/api
COPY --from=backend-build --chown=node:node /app/.git /app/.git

# Copy frontend build
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Nginx configuration
RUN echo 'server { \
    listen 10000; \
    server_name localhost; \
    \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api { \
        proxy_pass http://localhost:9000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/http.d/default.conf

# Start script
RUN echo '#!/bin/sh\n\
nginx\n\
cd /app/api && node src/cobalt' > /app/start.sh && \
chmod +x /app/start.sh

EXPOSE 10000
CMD ["/app/start.sh"]
