# 🚀 HarvestHub Production Deployment Guide

## Prerequisites ✅
- [x] DigitalOcean Droplet (Ubuntu 25.04) - **128.199.108.56**
- [x] MongoDB Database - **dbaas-db-6287636**
- [x] DigitalOcean Spaces - **sgp1**
- [x] Domain & SSL - **harvesthubph.app**
- [x] Nginx installed

## Quick Deployment Steps

### 1. Upload Files to Droplet
```bash
# From your local machine, upload these files:
scp deploy.sh root@128.199.108.56:/tmp/
scp nginx-harvesthubph.conf root@128.199.108.56:/tmp/
```

### 2. Run Deployment Script
```bash
# SSH into your droplet
ssh root@128.199.108.56

# Make script executable and run
chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

### 3. Clone and Setup Application
```bash
# Clone your repository
cd /var/www/harvesthub
git clone https://github.com/Trebjaeg/HarvestHub.git .

# Create environment file
nano .env.local
# Copy the contents from your local .env.local file

# Install and build
npm install
npm run build
```

### 4. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs harvesthub
```

### 5. Verify Deployment
- **HTTP**: http://128.199.108.56 (should redirect to HTTPS)
- **HTTPS**: https://harvesthubph.app
- **API Health**: https://harvesthubph.app/api/auth/check

## Troubleshooting Commands

### Check Services
```bash
# Nginx status
sudo systemctl status nginx
sudo nginx -t

# PM2 status
pm2 status
pm2 logs harvesthub

# MongoDB connection test
node -e "require('./lib/mongodb.js').default().then(() => console.log('DB Connected')).catch(console.error)"
```

### View Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/harvesthubph.app.access.log
sudo tail -f /var/log/nginx/harvesthubph.app.error.log

# Application logs
pm2 logs harvesthub
tail -f /var/log/harvesthub/error.log
```

### Restart Services
```bash
# Restart nginx
sudo systemctl restart nginx

# Restart application
pm2 restart harvesthub

# Reload nginx config
sudo nginx -s reload
```

## SSL Certificate Paths
Make sure your SSL certificates are located at:
- **Certificate**: `/etc/ssl/certs/harvesthubph.app.crt`
- **Private Key**: `/etc/ssl/private/harvesthubph.app.key`

If your certificates are in different locations, update the nginx config:
```bash
sudo nano /etc/nginx/sites-available/harvesthubph.app
```

## Environment Variables Checklist
Your `.env.local` should contain:
- [x] `MONGODB_URI` - DigitalOcean MongoDB connection
- [x] `DIGITALOCEAN_SPACES_*` - Spaces configuration  
- [x] `NEXT_PUBLIC_BASE_URL=https://harvesthubph.app`
- [x] `NODE_ENV=production`
- [x] `SECURE_COOKIES=true`

## Monitoring
```bash
# System resources
htop
df -h
free -h

# Application performance
pm2 monit

# Database connection
pm2 logs harvesthub | grep "MongoDB"
```

## Updates & Maintenance
```bash
# Pull latest changes
cd /var/www/harvesthub
git pull origin main

# Rebuild and restart
npm run build
pm2 restart harvesthub

# Clear nginx cache if needed
sudo systemctl reload nginx
```

## Security Notes
- Firewall configured for ports 22, 80, 443
- SSL/TLS encryption enabled
- Security headers configured in nginx
- MongoDB credentials secured in environment variables
- DigitalOcean Spaces keys secured

---

**🎉 Your HarvestHub application will be live at: https://harvesthubph.app**