# 🔄 Remove Domain from Old Project

Quick guide to disconnect **chefanandhub.com** from your Bolt project

---

## 🎯 Quick Steps

1. Find the old project in Vercel
2. Remove the domain
3. Add it to your new project

Takes 2 minutes!

---

## 📝 Step 1: Find Your Bolt Project

### Option A: From Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Look through your projects list
3. Find the Bolt project (might be named something like "bolt-chefanand" or similar)
4. Click on that project

### Option B: Direct Search

1. Go to: https://vercel.com/dashboard
2. Use the search bar at top
3. Type: `chefanandhub.com`
4. Vercel will show which project uses this domain

---

## 🗑️ Step 2: Remove Domain from Old Project

1. Once you've opened the old Bolt project:
   - Click **Settings** tab
   - Click **Domains** in left sidebar

2. You'll see your domains listed:
   - `chefanandhub.com`
   - `www.chefanandhub.com`

3. For EACH domain:
   - Click the **three dots** (⋯) menu next to domain
   - Click **Remove**
   - Confirm removal

4. Repeat for both domains

**Done! The domain is now free.**

---

## ✅ Step 3: Add Domain to New Project

Now add it to your ChefAnand Hub project:

1. Go back to dashboard: https://vercel.com/dashboard

2. Find and click your **new ChefAnand Hub project**
   - Look for: "chefanand-hub" or similar name
   - Should be the one you just deployed

3. Click **Settings** → **Domains**

4. Add both domains:

   **First domain:**
   - Enter: `chefanandhub.com`
   - Click **Add**

   **Second domain:**
   - Enter: `www.chefanandhub.com`
   - Click **Add**

5. Set primary domain:
   - Find `www.chefanandhub.com` in the list
   - Click three dots (⋯)
   - Click **Set as Primary Domain**

---

## 🔧 DNS Records (No Changes Needed!)

Your DNS records should already be correct from before:

```
Type: A       Name: @      Value: 76.76.21.21
Type: CNAME   Name: www    Value: cname.vercel-dns.com
```

**You don't need to update these** - they point to Vercel infrastructure, which routes to whichever project owns the domain.

---

## ⏱️ How Long Does It Take?

**Domain removal:** Instant
**Domain addition:** Instant
**DNS to recognize change:** 5-15 minutes (sometimes instant)
**SSL certificate:** 1-5 minutes after domain added

---

## 🔍 Verify It Worked

### Check in Vercel:
1. Old Bolt project → Settings → Domains
   - Should be **empty** (no domains listed)

2. New ChefAnand Hub project → Settings → Domains
   - Should show:
     - ✅ `chefanandhub.com`
     - ✅ `www.chefanandhub.com` (Primary)

### Check the Site:
Wait 5-10 minutes, then visit:
- https://www.chefanandhub.com

Should now show your NEW ChefAnand Hub app!

---

## 🐛 Troubleshooting

### "Domain is still showing old project"

**Solutions:**
1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or try incognito/private window

2. **Clear DNS cache:**
   ```bash
   # Windows
   ipconfig /flushdns

   # Mac
   sudo dscacheutil -flushcache
   ```

3. **Wait a bit longer:**
   - Sometimes takes 10-15 minutes
   - Try on mobile data (different network)

4. **Check Vercel status:**
   - Make sure domain is in the correct project
   - Check SSL certificate is issued

### "Cannot remove domain - still in use"

**Solution:**
1. Make sure you're in the correct project
2. Try removing www first, then root domain
3. Check if domain is set as primary (remove that setting first)

### "Domain removed but can't add to new project"

**Solution:**
1. Wait 2-3 minutes after removal
2. Refresh Vercel dashboard
3. Try adding again

### Still stuck?

**Check which project owns the domain:**
```bash
# Visit this to see DNS status
curl -I https://www.chefanandhub.com

# Look for x-vercel-id header - tells you which deployment
```

Or contact Vercel support: https://vercel.com/support

---

## 📋 Quick Checklist

- [ ] Found old Bolt project in Vercel dashboard
- [ ] Removed `chefanandhub.com` from old project
- [ ] Removed `www.chefanandhub.com` from old project
- [ ] Added `chefanandhub.com` to new ChefAnand Hub project
- [ ] Added `www.chefanandhub.com` to new ChefAnand Hub project
- [ ] Set `www.chefanandhub.com` as Primary
- [ ] Waited 5-10 minutes for DNS
- [ ] Tested https://www.chefanandhub.com
- [ ] Verified new app is showing
- [ ] SSL certificate is working (green padlock)

---

## 🎉 Success!

Once complete, your domain will point to the new ChefAnand Hub project!

**Your site:** https://www.chefanandhub.com

All features should work:
- ✅ Login/Signup
- ✅ Task management
- ✅ Duty schedules
- ✅ File uploads
- ✅ Real-time updates

---

## 💡 Pro Tips

### Delete Old Bolt Project?

If you don't need the old Bolt project anymore:

1. Go to project in Vercel
2. Settings → General
3. Scroll to bottom → **Delete Project**
4. Confirm by typing project name

**Warning:** This is permanent! Make sure you've removed the domain first.

### Keep Both Projects?

If you want to keep the old project but with different domain:
1. Get a different domain (like chefanandhub-old.com)
2. Add new domain to old project
3. Old project stays live on different URL

---

## 📞 Need Help?

**Vercel Support:**
- Chat: https://vercel.com/support
- Docs: https://vercel.com/docs/concepts/projects/domains
- Community: https://github.com/vercel/vercel/discussions

**Can't find old project?**
- Check all workspaces/teams in Vercel
- Look in "Archived" projects
- Contact Vercel support to help locate it
