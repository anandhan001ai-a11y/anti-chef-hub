# 🚀 Deployment Checklist for www.chefanandhub.com

Use this checklist to ensure a smooth deployment process.

## ✅ Pre-Deployment Checklist

### Frontend Preparation
- [ ] All features tested locally
- [ ] Build runs successfully (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Environment variables documented in `.env.example`

### Backend Preparation
- [ ] Server runs locally (`cd server && npm start`)
- [ ] Health endpoint working (`http://localhost:3001/api/health`)
- [ ] File uploads tested
- [ ] CORS configured for production

### Domain & DNS
- [ ] Domain purchased (chefanandhub.com)
- [ ] Access to domain registrar account
- [ ] Ready to update DNS records

### Accounts Setup
- [ ] Vercel account created
- [ ] Railway account created (or alternative)
- [ ] Supabase project created
- [ ] Google Cloud project for OAuth (if using)

---

## 📦 Frontend Deployment (Vercel)

- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Deploy: `vercel --prod`
- [ ] Add environment variables in Vercel dashboard:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_GEMINI_API_KEY`
  - [ ] `VITE_GOOGLE_CLIENT_ID`
  - [ ] `VITE_API_URL` (backend URL from Railway)
- [ ] Redeploy after adding variables
- [ ] Add custom domain: `chefanandhub.com`
- [ ] Add custom domain: `www.chefanandhub.com`

---

## 🚂 Backend Deployment (Railway)

- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login to Railway: `railway login`
- [ ] Navigate to server: `cd server`
- [ ] Initialize project: `railway init`
- [ ] Add environment variables in Railway:
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=production`
  - [ ] `ALLOWED_ORIGINS=https://www.chefanandhub.com,https://chefanandhub.com`
- [ ] Deploy: `railway up`
- [ ] Copy Railway app URL
- [ ] Test health endpoint: `curl https://your-app.railway.app/api/health`

---

## 🌐 DNS Configuration

### Add these records in your domain registrar:

**For Root Domain (chefanandhub.com):**
- [ ] Type: `A`
- [ ] Name: `@`
- [ ] Value: `76.76.21.21` (Vercel's IP)
- [ ] TTL: `3600`

**For WWW Subdomain:**
- [ ] Type: `CNAME`
- [ ] Name: `www`
- [ ] Value: `cname.vercel-dns.com`
- [ ] TTL: `3600`

**Note:** Exact values provided by Vercel in dashboard

---

## 🔒 Supabase Configuration

- [ ] Open Supabase dashboard
- [ ] Select your project
- [ ] Go to Authentication → URL Configuration
- [ ] Update Site URL: `https://www.chefanandhub.com`
- [ ] Add Redirect URLs:
  - [ ] `https://www.chefanandhub.com/**`
  - [ ] `https://chefanandhub.com/**`
- [ ] Save changes

---

## 🔗 Connect Frontend to Backend

- [ ] Copy Railway backend URL
- [ ] Add to Vercel environment variables:
  - [ ] Variable: `VITE_API_URL`
  - [ ] Value: `https://your-app.railway.app`
- [ ] Redeploy frontend: `vercel --prod`

---

## ✨ Post-Deployment Testing

### Frontend Tests
- [ ] Visit https://www.chefanandhub.com
- [ ] Visit https://chefanandhub.com (should redirect)
- [ ] Test user signup
- [ ] Test user login
- [ ] Test logout
- [ ] Create a task
- [ ] Upload a roster file
- [ ] Test analytics dashboard
- [ ] Test meeting notes feature
- [ ] Test chat/collaboration
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### Backend Tests
- [ ] Health endpoint responds
- [ ] File upload works
- [ ] Roster parsing works
- [ ] No CORS errors in browser console

### Database Tests
- [ ] Tasks save correctly
- [ ] User authentication works
- [ ] Messages save correctly
- [ ] Real-time updates work

---

## 🐛 Common Issues & Solutions

### Issue: CORS Error
- [ ] Check `ALLOWED_ORIGINS` in Railway includes your domain
- [ ] Verify domain spelling is exact
- [ ] Check for trailing slashes

### Issue: Environment Variables Not Working
- [ ] Verify all VITE_* variables are in Vercel
- [ ] Redeploy after adding variables
- [ ] Check variable names match exactly

### Issue: Page 404 on Refresh
- [ ] Verify `vercel.json` exists in root
- [ ] Check rewrites configuration

### Issue: Authentication Not Working
- [ ] Verify Supabase Site URL
- [ ] Check Redirect URLs include all variations
- [ ] Test with incognito window

---

## 📊 Monitoring Setup

### Vercel
- [ ] Enable Analytics in dashboard
- [ ] Set up deployment notifications
- [ ] Configure error tracking

### Railway
- [ ] View logs: `railway logs`
- [ ] Set up monitoring
- [ ] Configure alerts

---

## 🎉 Launch Checklist

Before announcing:
- [ ] All features work on production
- [ ] Mobile responsive
- [ ] SSL certificate active (https)
- [ ] Fast load times (< 3 seconds)
- [ ] No console errors
- [ ] SEO basics configured
- [ ] Privacy policy page (if needed)
- [ ] Terms of service (if needed)
- [ ] Contact information available

---

## 📝 Notes

**Deployment Date:** _______________

**Vercel Project URL:** _______________

**Railway Backend URL:** _______________

**Any Issues Encountered:**
_________________________________________
_________________________________________
_________________________________________

---

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- See `DEPLOYMENT_GUIDE.md` for detailed steps
