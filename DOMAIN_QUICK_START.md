# ⚡ Domain Setup - Quick Start

Get **chefanandhub.com** live in 3 steps!

---

## 🎯 The 3-Step Process

```
1. Add Domain in Vercel
         ↓
2. Update DNS Records
         ↓
3. Wait 15-30 mins
         ↓
   🎉 LIVE!
```

---

## 📝 Step 1: Vercel Dashboard (2 minutes)

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Settings → Domains
4. Add: `chefanandhub.com` → Click Add
5. Add: `www.chefanandhub.com` → Click Add
6. Set `www.chefanandhub.com` as Primary

**Vercel will show you DNS records. Copy them!**

---

## 🔧 Step 2: Your Domain Registrar (5 minutes)

Log in to where you bought your domain (GoDaddy, Namecheap, etc.)

### Add These 2 Records:

**Record 1: Root Domain**
```
Type:  A
Name:  @ (or blank)
Value: 76.76.21.21
TTL:   3600
```

**Record 2: WWW Subdomain**
```
Type:  CNAME
Name:  www
Value: cname.vercel-dns.com
TTL:   3600
```

**Save the records!**

---

## ⏱️ Step 3: Wait for DNS (15-30 minutes)

DNS needs time to update globally. This is normal!

### Check Status:

**Run this command:**
```bash
./scripts/check-domain.sh
```

**Or visit:**
- https://dnschecker.org/#A/chefanandhub.com
- https://www.whatsmydns.net/#A/chefanandhub.com

**When ready, you'll see:**
- ✅ Green checkmarks globally
- ✅ A record shows: `76.76.21.21`
- ✅ CNAME shows: `cname.vercel-dns.com`

---

## ✅ Done? Update These:

### Supabase (1 minute)
1. https://supabase.com/dashboard
2. Your project → Authentication → URL Configuration
3. Site URL: `https://www.chefanandhub.com`
4. Add to Redirect URLs:
   ```
   https://www.chefanandhub.com/**
   https://chefanandhub.com/**
   ```

### Railway Backend (1 minute)
1. Railway dashboard → Your project → Variables
2. Update `ALLOWED_ORIGINS`:
   ```
   https://www.chefanandhub.com,https://chefanandhub.com
   ```
3. Redeploy: `railway up`

---

## 🎉 Test Your Site

Visit: https://www.chefanandhub.com

**Should work:**
- ✅ Site loads
- ✅ HTTPS with padlock 🔒
- ✅ Login/Signup
- ✅ Create tasks
- ✅ Upload files

---

## 🐛 Not Working?

### After 30+ minutes?

**Check:**
1. DNS records are EXACTLY as shown above
2. No typos in values
3. Old records removed (if any)
4. Try incognito browser or mobile data

**Clear DNS cache:**
```bash
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache
```

### Still stuck?

See detailed guide: `DOMAIN_SETUP.md`

---

## 📞 Where to Get Help

**Vercel Issues:**
- https://vercel.com/support
- https://vercel.com/docs/concepts/projects/domains

**DNS Issues:**
- Contact your domain registrar support
- Wait longer (can take up to 48h in rare cases)

**Application Issues:**
- Check browser console for errors
- Verify environment variables in Vercel/Railway

---

## 🎯 Quick Links

| What | Where |
|------|-------|
| Vercel Dashboard | https://vercel.com/dashboard |
| Railway Dashboard | https://railway.app/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| DNS Checker | https://dnschecker.org |
| Your Site | https://www.chefanandhub.com |

---

## ✨ Success Criteria

When everything is working:

- ✅ https://chefanandhub.com → redirects to www
- ✅ https://www.chefanandhub.com → shows your app
- ✅ Green padlock (SSL) in browser
- ✅ Login works
- ✅ All features functional
- ✅ No console errors

**You're live! 🚀**
