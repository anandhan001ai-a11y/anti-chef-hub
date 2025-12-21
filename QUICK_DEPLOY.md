# ⚡ Quick Deploy Commands

Fast reference for deploying ChefAnand Hub to www.chefanandhub.com

## 🚀 One-Time Setup

```bash
# Install deployment tools
npm install -g vercel @railway/cli

# Login to services
vercel login
railway login
```

## 📦 Deploy Frontend (Vercel)

```bash
# From project root
npm run build
vercel --prod
```

**Add these environment variables in Vercel Dashboard:**
```
VITE_SUPABASE_URL=<from your .env>
VITE_SUPABASE_ANON_KEY=<from your .env>
VITE_GEMINI_API_KEY=<from your .env>
VITE_GOOGLE_CLIENT_ID=<from your .env>
VITE_API_URL=<your railway backend url>
```

## 🚂 Deploy Backend (Railway)

```bash
# From server directory
cd server
railway init    # First time only
railway up
```

**Add these environment variables in Railway Dashboard:**
```
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://www.chefanandhub.com,https://chefanandhub.com
```

## 🌐 DNS Configuration

**In your domain registrar, add:**

| Type  | Name | Value                | TTL  |
|-------|------|----------------------|------|
| A     | @    | 76.76.21.21         | 3600 |
| CNAME | www  | cname.vercel-dns.com | 3600 |

## 🔒 Supabase Configuration

1. Go to https://supabase.com/dashboard
2. Authentication → URL Configuration
3. Set Site URL: `https://www.chefanandhub.com`
4. Add Redirect URLs:
   - `https://www.chefanandhub.com/**`
   - `https://chefanandhub.com/**`

## ✅ Verify Deployment

```bash
# Check frontend
curl -I https://www.chefanandhub.com

# Check backend
curl https://your-app.railway.app/api/health
```

## 🔄 Update Deployments

**Frontend updates:**
```bash
npm run build && vercel --prod
```

**Backend updates:**
```bash
cd server && railway up
```

## 📊 View Logs

```bash
# Railway logs
railway logs

# Vercel logs
# View in dashboard: vercel.com/dashboard
```

## 🎯 Quick Troubleshooting

**CORS Error?**
→ Check ALLOWED_ORIGINS in Railway

**Auth Not Working?**
→ Verify Supabase Site URL and Redirect URLs

**404 on Refresh?**
→ vercel.json should have rewrites configured (already done)

---

💡 **For detailed instructions, see:** `DEPLOYMENT_GUIDE.md`

📋 **For complete checklist, see:** `DEPLOYMENT_CHECKLIST.md`
