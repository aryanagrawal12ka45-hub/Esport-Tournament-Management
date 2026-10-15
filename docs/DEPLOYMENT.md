# Deployment Guide

This guide provides instructions for deploying the **Renewable Energy DB Simulator** to production environments, static hosts, and containerized cloud providers.

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
3. Import `Renewable-Energy-Simulator`.
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

#### Via Netlify Web Interface:
1. Connect your GitHub repository.
2. Set **Build command**: `npm run build`
3. Set **Publish directory**: `dist`
4. Click **Deploy Site**.

---

### 3. GitHub Pages

To host on GitHub Pages:

1. In `vite.config.ts`, add the base repository path if hosted on a sub-path:
   ```typescript
   export default defineConfig({
     base: '/Renewable-Energy-Simulator/',
     plugins: [react()],
   });
   ```
2. Build and deploy using `gh-pages`:
   ```bash
   npm install -D gh-pages
   npx gh-pages -d dist
   ```

Alternatively, use a GitHub Actions workflow `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### 4. Containerized Docker Deployment

For self-hosted Kubernetes, AWS ECS, or DigitalOcean Droplets, a lightweight multi-stage Docker build with Nginx is recommended:

```dockerfile
# Stage 1: Build production bundle
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx Alpine
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Companion `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Run container:
```bash
docker build -t renewable-energy-simulator .
docker run -d -p 8080:80 renewable-energy-simulator
```
Open `http://localhost:8080` in your browser.
