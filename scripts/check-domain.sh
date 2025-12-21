#!/bin/bash

echo "🌐 Checking Domain: chefanandhub.com"
echo "====================================="
echo ""

# Check if domain resolves
echo "📍 DNS Resolution:"
nslookup chefanandhub.com 2>/dev/null | grep -A1 "Name:" || echo "❌ Domain not resolving yet"
echo ""

echo "📍 WWW Subdomain:"
nslookup www.chefanandhub.com 2>/dev/null | grep -A1 "Name:" || echo "❌ WWW subdomain not resolving yet"
echo ""

# Check A record
echo "🔍 A Record Check:"
dig +short chefanandhub.com A 2>/dev/null || echo "❌ A record not found"
echo ""

# Check CNAME record
echo "🔍 CNAME Record Check:"
dig +short www.chefanandhub.com CNAME 2>/dev/null || echo "❌ CNAME record not found"
echo ""

# Check if site is accessible
echo "🌍 Testing Site Access:"
if curl -s -o /dev/null -w "%{http_code}" https://www.chefanandhub.com 2>/dev/null | grep -q "200\|301\|302"; then
    echo "✅ Site is accessible!"
else
    echo "❌ Site not accessible yet (this is normal if DNS is still propagating)"
fi
echo ""

# Check SSL certificate
echo "🔒 SSL Certificate:"
if curl -vI https://www.chefanandhub.com 2>&1 | grep -q "SSL certificate verify ok"; then
    echo "✅ SSL certificate is valid!"
else
    echo "⏳ SSL certificate pending or site not accessible yet"
fi
echo ""

echo "📊 DNS Propagation Status:"
echo "   Check global propagation at:"
echo "   → https://dnschecker.org/#A/chefanandhub.com"
echo "   → https://www.whatsmydns.net/#A/chefanandhub.com"
echo ""

echo "💡 Expected DNS Values:"
echo "   A Record (@):    76.76.21.21"
echo "   CNAME (www):     cname.vercel-dns.com"
echo ""
