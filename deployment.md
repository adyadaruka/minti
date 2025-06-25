# Minty - Deployment Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/google-callback"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# For production, update these URLs:
# GOOGLE_REDIRECT_URI="https://your-domain.com/google-callback"
# NEXTAUTH_URL="https://your-domain.com"
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/google-callback` (for development)
   - `https://your-domain.com/google-callback` (for production)

## Local Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Railway

1. Connect your GitHub repository
2. Add environment variables
3. Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

## GitHub Repository Setup

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit: Minty budgeting app"
```

2. Create GitHub repository and push:
```bash
git remote add origin https://github.com/yourusername/minty.git
git branch -M main
git push -u origin main
```

## Database Migration

For production, you may want to use PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update environment variable:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

3. Run migrations:
```bash
npx prisma migrate deploy
```

## Security Considerations

1. Use strong NEXTAUTH_SECRET
2. Enable HTTPS in production
3. Set up proper CORS policies
4. Use environment variables for all secrets
5. Regularly update dependencies

## Performance Optimization

1. Enable Next.js caching
2. Use CDN for static assets
3. Optimize images
4. Implement proper error boundaries
5. Add loading states

## Monitoring

1. Set up error tracking (Sentry)
2. Add analytics (Google Analytics)
3. Monitor API performance
4. Set up uptime monitoring 