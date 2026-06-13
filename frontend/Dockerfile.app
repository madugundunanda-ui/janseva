# ─── Frontend Dockerfile (Nx Multi-App Support) ─────────────────
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Pass APP_NAME as a build argument (e.g., janseva-citizen, janseva-officer)
ARG APP_NAME
ENV APP_NAME=$APP_NAME

# Build the specific Nx application
RUN npx nx build ${APP_NAME} --configuration=production

# ─── Production Serve Stage ─────────────────────────────────────
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
# Nx builds are typically output to /app/dist/<app_name> or /app/dist/apps/<app_name>
ARG APP_NAME
COPY --from=builder /app/dist/${APP_NAME}/browser /usr/share/nginx/html/

# Copy custom Nginx configuration for Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
