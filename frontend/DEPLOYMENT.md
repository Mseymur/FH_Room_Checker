# Vercel Deployment Guide

This guide explains how to deploy the FH Room Checker frontend to Vercel.

## Quick Deploy

### Option 1: Vercel CLI
```bash
# Install Vercel CLI globally (optional if using npx)
npm install -g vercel

# Deploy
vercel
```

Or using npx (no installation needed):
```bash
npx vercel
```

### Option 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `www`
   - **Install Command**: `npm install`
5. Click "Deploy"

## Configuration

The project includes `vercel.json` with optimized settings:

- **SPA Routing**: All routes redirect to `index.html` for Angular routing
- **Caching**: Static assets cached for 1 year, HTML revalidated
- **Security Headers**: XSS protection, frame options, content type options
- **Production Build**: Optimized with minification, tree-shaking, and code splitting

## Environment Variables

The frontend should call its own same-origin `/api` routes in production.

Set these in the Vercel project:
- `API_BASE_URL=/api`
- `BACKEND_API_URL=https://your-laravel-domain/api`
- `INTERNAL_API_SECRET=<same secret as Laravel>`
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `RECAPTCHA_SITE_KEY`

Set these in Laravel:
- `FRONTEND_ORIGIN=https://your-frontend-domain`
- `INTERNAL_API_SECRET=<same secret as Vercel>`

## Build Optimization

The production build includes:
- ✅ Minified JavaScript and CSS
- ✅ Tree-shaking (removes unused code)
- ✅ Code splitting (lazy loading)
- ✅ Asset optimization (fonts, images)
- ✅ Source maps disabled (smaller bundle)
- ✅ AOT compilation (faster runtime)

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Ensure all dependencies are installed
- Check build logs in Vercel dashboard

### Routing Issues
- Verify `vercel.json` rewrites are configured
- Check that `outputDirectory` is set to `www`

### API Connection Issues
- Verify `FRONTEND_ORIGIN` is correct on the Laravel side
- Verify `BACKEND_API_URL` and `INTERNAL_API_SECRET` are set on Vercel
- Ensure backend is accessible from Vercel's servers

## Performance

Expected build output:
- Initial bundle: ~500KB - 1MB (gzipped)
- Total assets: ~2-3MB
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s

## Custom Domain

1. In Vercel dashboard, go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned
