# ChefAnand Hub - Deployment Guide

This guide will help you deploy your application to **www.chefanandhub.com**

## 🎯 Overview

Your application has two parts:
1. **Frontend** (React/Vite) → Deploy to Vercel
2. **Backend API** (Express server) → Deploy to Railway

---

## 📦 Part 1: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from Project Root
```bash
cd /tmp/cc-agent/61733221/project
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** chefanand-hub (or your choice)
- **Directory?** ./ (current directory)
- **Override settings?** No

### Step 4: Add Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project → Settings → Environment Variables
3. Add these variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Get these values from your `.env` file.

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Add Custom Domain

1. Go to Project Settings → Domains
2. Add domain: `chefanandhub.com`
3. Add domain: `www.chefanandhub.com`
4. Vercel will show you DNS records to add

---

## 🌐 Part 2: Configure Your Domain (GoDaddy/Namecheap/etc)

### DNS Records to Add:

**For Vercel (Frontend):**

| Type  | Name | Value                |
|-------|------|----------------------|
| A     | @    | 76.76.21.21         |
| CNAME | www  | cname.vercel-dns.com |

**Note:** Vercel will provide exact DNS records in their dashboard.

---

## 🚀 Part 3: Deploy Backend to Railway

### Step 1: Create Railway Account
Go to https://railway.app and sign up with GitHub

### Step 2: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 3: Login to Railway
```bash
railway login
```

### Step 4: Initialize Railway Project
```bash
cd server
railway init
```

### Step 5: Add Environment Variables in Railway

In Railway dashboard:
1. Click your project
2. Go to Variables tab
3. Add:

```
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://www.chefanandhub.com,https://chefanandhub.com
```

### Step 6: Deploy Backend
```bash
railway up
```

### Step 7: Get Backend URL

Railway will provide a URL like: `https://your-app.railway.app`

Copy this URL - you'll need it for the frontend.

---

## 🔗 Part 4: Connect Frontend to Backend

### Update Frontend Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:

```
VITE_API_URL=https://your-app.railway.app
```

3. Redeploy:
```bash
vercel --prod
```

---

## 🔒 Part 5: Configure Supabase for Production

### Update Supabase Settings

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication → URL Configuration
4. Update:

**Site URL:**
```
https://www.chefanandhub.com
```

**Redirect URLs (add these):**
```
https://www.chefanandhub.com/**
https://chefanandhub.com/**
```

---

## ✅ Part 6: Verify Deployment

### Check Frontend
1. Visit https://www.chefanandhub.com
2. Test login/signup
3. Test task creation
4. Test all features

### Check Backend
```bash
curl https://your-app.railway.app/api/health
```

Should return: `{"status":"OK","message":"Server is running"}`

---

## 🎨 Quick Deploy Commands

### Deploy Frontend Updates
```bash
cd /tmp/cc-agent/61733221/project
vercel --prod
```

### Deploy Backend Updates
```bash
cd server
railway up
```

---

## 🐛 Troubleshooting

### Issue: "CORS Error"
**Solution:** Make sure ALLOWED_ORIGINS in Railway includes your domain

### Issue: "Environment variables not found"
**Solution:**
- Check Vercel dashboard for VITE_* variables
- Redeploy after adding variables

### Issue: "Page not found on refresh"
**Solution:** The `vercel.json` file handles this with rewrites

### Issue: "Supabase auth not working"
**Solution:**
- Check Site URL in Supabase dashboard
- Verify redirect URLs include your domain

---

## 📊 Monitoring

### Vercel Analytics
- Go to your project dashboard
- View deployment logs, analytics, and performance

### Railway Logs
```bash
railway logs
```

---

## 💰 Costs

- **Vercel:** Free for personal projects
- **Railway:** $5/month (includes $5 credit)
- **Domain:** ~$12/year (varies by registrar)
- **Supabase:** Free tier (generous limits)

---

## 🎉 You're Live!

Your ChefAnand Hub is now live at:
- https://www.chefanandhub.com
- https://chefanandhub.com

Both URLs will work and automatically redirect to the www version.

---

## 📞 Need Help?

If you encounter any issues during deployment:
1. Check the deployment logs in Vercel/Railway dashboards
2. Verify all environment variables are set correctly
3. Test the backend API health endpoint
4. Check browser console for errors
