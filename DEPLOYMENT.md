# NexKirana Accounting Backend - Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository
- MongoDB Atlas database

### Step 1: Prepare for Deployment

1. **Environment Variables**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=8h
   NODE_ENV=production
   COMPANY_NAME=NexKirana
   SESSION_TIMEOUT=480
   ```

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
# ... add all other variables
```

### Step 3: Create Admin User

After deployment, create the admin user:

```bash
npm run create-admin-prod
```

### Step 4: Test Deployment

Test your API endpoints:
```bash
curl https://your-backend.vercel.app/api/health
```

## 🔧 Environment Variables

Set these in Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry time | `8h` |
| `NODE_ENV` | Environment | `production` |
| `COMPANY_NAME` | Company name | `NexKirana` |
| `SESSION_TIMEOUT` | Session timeout (minutes) | `480` |

## 📊 Post-Deployment

1. **Create Admin User**
2. **Test Authentication**
3. **Verify Database Connection**
4. **Test All Endpoints**

## 🐛 Troubleshooting

- Check Vercel function logs
- Verify environment variables
- Test MongoDB connection
- Check CORS settings