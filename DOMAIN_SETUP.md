# 🌐 Custom Domain Setup: chefanandhub.com

Complete guide to connect your domain to ChefAnand Hub

---

## 📋 Prerequisites

- [ ] Domain purchased: **chefanandhub.com**
- [ ] Access to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)
- [ ] Frontend deployed to Vercel
- [ ] Vercel account logged in

---

## 🚀 Step 1: Add Domain in Vercel

### 1.1 Open Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your **chefanand-hub** project
3. Click **Settings** tab
4. Click **Domains** in the left sidebar

### 1.2 Add Your Domain
1. In the "Add Domain" field, enter: `chefanandhub.com`
2. Click **Add**
3. Vercel will show: "Invalid Configuration"
4. Don't worry - this is expected!

### 1.3 Add WWW Subdomain
1. Click **Add Domain** again
2. Enter: `www.chefanandhub.com`
3. Click **Add**

### 1.4 Set Primary Domain
1. Find `www.chefanandhub.com` in the list
2. Click the three dots menu (⋯)
3. Select **Set as Primary Domain**
4. This ensures all traffic redirects to www version

---

## 🔧 Step 2: Configure DNS Records

Vercel will show you the exact DNS records to add. Here's what you'll see:

### For Root Domain (chefanandhub.com)

**Record Type:** `A Record`
- **Name/Host:** `@` (or leave blank)
- **Value/Points to:** `76.76.21.21`
- **TTL:** `3600` (or Auto)

### For WWW Subdomain (www.chefanandhub.com)

**Record Type:** `CNAME`
- **Name/Host:** `www`
- **Value/Points to:** `cname.vercel-dns.com`
- **TTL:** `3600` (or Auto)

---

## 🏢 Step 3: Update DNS at Your Registrar

The steps vary by registrar. Here are instructions for popular ones:

### GoDaddy

1. Log in to https://godaddy.com
2. Click **My Products**
3. Next to **Domains**, click **DNS**
4. Find your domain and click **Manage DNS**
5. Click **Add** to create new records
6. Add the A record:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`
   - TTL: `1 Hour`
7. Add the CNAME record:
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `1 Hour`
8. Click **Save**

### Namecheap

1. Log in to https://namecheap.com
2. Click **Domain List**
3. Click **Manage** next to your domain
4. Click **Advanced DNS** tab
5. Click **Add New Record**
6. Add the A record:
   - Type: `A Record`
   - Host: `@`
   - Value: `76.76.21.21`
   - TTL: `Automatic`
7. Add the CNAME record:
   - Type: `CNAME Record`
   - Host: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `Automatic`
8. Click the green checkmark to save

### Google Domains / Squarespace Domains

1. Log in to https://domains.google.com
2. Click on your domain
3. Click **DNS** in the left menu
4. Scroll to **Custom records**
5. Add A record:
   - Host name: `@`
   - Type: `A`
   - TTL: `3600`
   - Data: `76.76.21.21`
6. Add CNAME record:
   - Host name: `www`
   - Type: `CNAME`
   - TTL: `3600`
   - Data: `cname.vercel-dns.com`
7. Click **Save**

### Cloudflare

1. Log in to https://cloudflare.com
2. Select your domain
3. Click **DNS** tab
4. Click **Add record**
5. Add A record:
   - Type: `A`
   - Name: `@`
   - IPv4 address: `76.76.21.21`
   - Proxy status: **DNS only** (grey cloud)
   - TTL: `Auto`
6. Add CNAME record:
   - Type: `CNAME`
   - Name: `www`
   - Target: `cname.vercel-dns.com`
   - Proxy status: **DNS only** (grey cloud)
   - TTL: `Auto`
7. Click **Save**

**Important for Cloudflare:** Turn OFF the orange cloud (proxy) - it should be grey!

---

## ⏱️ Step 4: Wait for DNS Propagation

### How Long?
- **Typical:** 5-30 minutes
- **Maximum:** Up to 48 hours (rare)
- **Usually:** 15-20 minutes

### Check Status in Vercel
1. Go back to Vercel Dashboard → Domains
2. Refresh the page every few minutes
3. When successful, you'll see:
   - ✅ `chefanandhub.com` - Valid Configuration
   - ✅ `www.chefanandhub.com` - Valid Configuration

---

## 🔍 Step 5: Verify DNS Configuration

### Check DNS Propagation

Visit these tools to check if DNS has updated:
- https://dnschecker.org
- https://www.whatsmydns.net

Enter: `chefanandhub.com`

**What to look for:**
- A records should show `76.76.21.21`
- CNAME for www should show `cname.vercel-dns.com`

### Test Your Site

```bash
# Test root domain
curl -I https://chefanandhub.com

# Test www subdomain
curl -I https://www.chefanandhub.com
```

Both should return `HTTP/2 200` or redirect properly.

---

## 🔒 Step 6: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificates for your domain!

### What Happens:
1. Once DNS is verified, Vercel requests SSL certificate
2. Certificate is issued by Let's Encrypt
3. Takes 1-5 minutes after DNS verification
4. Your site automatically uses HTTPS

### Verify SSL:
1. Visit https://www.chefanandhub.com
2. Look for the padlock 🔒 icon in browser
3. Click the padlock to view certificate details

---

## ✅ Step 7: Final Configuration

### Update Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL** to: `https://www.chefanandhub.com`
5. Add to **Redirect URLs**:
   ```
   https://www.chefanandhub.com/**
   https://chefanandhub.com/**
   ```
6. Click **Save**

### Update Railway Backend
1. Go to Railway dashboard
2. Open your backend project
3. Go to **Variables**
4. Update `ALLOWED_ORIGINS`:
   ```
   https://www.chefanandhub.com,https://chefanandhub.com
   ```
5. Redeploy backend: `railway up`

### Update Frontend Environment
1. Go to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Add/Update:
   ```
   VITE_API_URL=https://your-app.railway.app
   ```
4. Redeploy: `vercel --prod`

---

## 🎉 Step 8: Test Everything

### Checklist:
- [ ] Visit https://chefanandhub.com (redirects to www)
- [ ] Visit https://www.chefanandhub.com (loads site)
- [ ] SSL certificate shows valid 🔒
- [ ] Login works
- [ ] Signup works
- [ ] Tasks can be created
- [ ] No CORS errors in console
- [ ] File uploads work
- [ ] Real-time features work

---

## 🐛 Troubleshooting

### Domain Not Working After 30 Minutes

**Check these:**
1. DNS records are exactly correct (no typos)
2. Old DNS records are removed (if any existed)
3. DNS cache cleared: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
4. Try different browser or incognito mode
5. Check on mobile data (different network)

### SSL Certificate Not Issued

**Solutions:**
1. Wait 5-10 more minutes
2. Remove and re-add domain in Vercel
3. Ensure DNS records are correct
4. Check CAA records aren't blocking Let's Encrypt

### "Too Many Redirects" Error

**Fix:**
1. If using Cloudflare, turn off proxy (grey cloud)
2. Clear browser cache
3. Check Vercel domain settings

### CORS Errors After Domain Setup

**Fix:**
1. Update `ALLOWED_ORIGINS` in Railway to include new domain
2. Redeploy backend
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

---

## 📊 Monitoring

### Check Domain Status
```bash
# Check if domain resolves
nslookup chefanandhub.com

# Check SSL certificate
curl -vI https://www.chefanandhub.com 2>&1 | grep -i ssl

# Check response time
curl -w "@-" -o /dev/null -s https://www.chefanandhub.com <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

---

## 🎯 Quick Reference

**Your URLs:**
- Primary: https://www.chefanandhub.com
- Alternate: https://chefanandhub.com (redirects to www)

**DNS Records:**
```
@ → A → 76.76.21.21
www → CNAME → cname.vercel-dns.com
```

**Vercel Dashboard:**
https://vercel.com/dashboard

**DNS Checker:**
https://dnschecker.org

---

## 📞 Need Help?

### Vercel Support
- Docs: https://vercel.com/docs/concepts/projects/domains
- Support: https://vercel.com/support

### DNS Issues
- Wait longer (DNS can take time)
- Contact your domain registrar support
- Check DNS propagation tools

### Application Issues
- Check browser console for errors
- Verify environment variables
- Check Supabase configuration

---

## ✨ Success!

Once everything is configured:

🎉 **Your ChefAnand Hub is live at:**
- https://www.chefanandhub.com
- https://chefanandhub.com

Share it with your team and start managing your kitchen operations!
