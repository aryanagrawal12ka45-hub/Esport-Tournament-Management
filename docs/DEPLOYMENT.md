# Deployment Guide

This guide provides instructions for deploying the **Global E-Sports Tournament Management Database Simulator** to production environments, static hosts, and containerized cloud providers.

---

## Build Verification

Before deploying, ensure the application compiles cleanly without TypeScript errors or lint violations:

```bash
# 1. Install dependencies
npm install

# 2. Run Oxlint code verification
npm run lint

# 3. Create optimized production build
npm run build

# 4. Preview locally
npm run preview
```

The optimized bundle is generated into the `dist/` directory.

---

## Deployment Options

### 1. Vercel (Recommended)
Vercel automatically detects Vite projects with zero configuration needed.

#### Via Vercel CLI:
```bash
npx vercel
```

#### Via GitHub Integration:
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Import `esports-database-simulator`.
4. Ensure the build configuration is:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

---

### 2. Netlify

A `public/_redirects` file is included in this repository to support single-page application (SPA) routing:
```
/*    /index.html   200
```

#### Via Netlify CLI:
```bash
npx netlify-cli deploy --prod --dir=dist
```

#### Via Netlify UI:
1. Connect your repository on [Netlify](https://app.netlify.com/).
2. Set Build command to `npm run build`.
3. Set Publish directory to `dist`.
4. Deploy site.

---

### 3. Docker Deployment

A lightweight multi-stage Dockerfile can be used to containerize the application using NGINX Alpine:

```dockerfile
# Stage 1: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### NGINX Configuration (`nginx.conf`):
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Build and Run Docker Container:
```bash
docker build -t esports-database-simulator .
docker run -p 8080:80 esports-database-simulator
```
Access the application at `http://localhost:8080`.

---

## Performance Optimization Checklist

* [x] **Vite Rolldown & Production Tree-Shaking**: Dead code paths stripped during compilation.
* [x] **Responsive Asset Delivery**: SVG vector icons and lightweight modern font declarations.
* [x] **Client-Side In-Memory Execution**: Zero server round-trips for schema browsing, queries, and PL/SQL blocks.
