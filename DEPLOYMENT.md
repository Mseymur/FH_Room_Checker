# Vercel Deployment Guide

This guide explains how to deploy the FH Room Checker frontend to Vercel.

## Quick Deploy

### Option 1: Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel
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

The app uses the production API by default (`https://room.luigitonno.at/api`).

To override the API URL, add in Vercel dashboard:
- **Variable**: `API_BASE_URL`
- **Value**: Your API URL (e.g., `https://your-api.com/api`)

Note: You'll need to update `environment.prod.ts` to use this variable if needed.

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
- Verify CORS is enabled on backend
- Check API URL in `environment.prod.ts`
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

