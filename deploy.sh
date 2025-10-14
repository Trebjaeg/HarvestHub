#!/bin/bash
# HarvestHub Production Deployment Script
# Run this script on your DigitalOcean droplet

echo "🚀 Starting HarvestHub Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/harvesthub"
NGINX_SITE="harvesthubph.app"
NODE_USER="harvesthub"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons."
   print_status "Please run as a regular user with sudo privileges."
   exit 1
fi

print_status "Setting up HarvestHub production environment..."

# 1. Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 (LTS)
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js installed: $NODE_VERSION"
print_status "npm installed: $NPM_VERSION"

# 3. Install PM2 for process management
print_status "Installing PM2..."
sudo npm install -g pm2

# 4. Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 5. Clone repository (you'll need to do this manually or set up SSH keys)
print_warning "Next steps (manual):"
echo "1. Clone your repository to $APP_DIR"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/Trebjaeg/HarvestHub.git ."
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Build the application:"
echo "   npm run build"

# 6. Set up nginx configuration
print_status "Setting up nginx configuration..."

# Create nginx site configuration
sudo tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name harvesthubph.app www.harvesthubph.app;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    server_name harvesthubph.app www.harvesthubph.app;

    # SSL Configuration (adjust paths to your SSL certificates)
    ssl_certificate /etc/ssl/certs/harvesthubph.app.crt;
    ssl_certificate_key /etc/ssl/private/harvesthubph.app.key;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Static files from public directory
    location /images/ {
        alias /var/www/harvesthub/public/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /fonts/ {
        alias /var/www/harvesthub/public/fonts/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Next.js static files
    location /_next/static/ {
        alias /var/www/harvesthub/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Next.js API routes and pages - proxy to Node.js server
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logging
    access_log /var/log/nginx/harvesthubph.app.access.log;
    error_log /var/log/nginx/harvesthubph.app.error.log;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid!"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration has errors. Please check the configuration."
    exit 1
fi

# 7. Set up PM2 ecosystem file
print_status "Creating PM2 ecosystem file..."
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'harvesthub',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/harvesthub',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/harvesthub/error.log',
    out_file: '/var/log/harvesthub/out.log',
    log_file: '/var/log/harvesthub/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/harvesthub
sudo chown -R $USER:$USER /var/log/harvesthub

# 8. Set up firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

print_status "🎉 Basic setup completed!"
print_warning "Manual steps remaining:"
echo ""
echo "1. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/Trebjaeg/HarvestHub.git ."
echo ""
echo "2. Create .env.local file with your production environment variables"
echo ""
echo "3. Install dependencies and build:"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Start the application with PM2:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Check SSL certificate paths in nginx config:"
echo "   sudo nano /etc/nginx/sites-available/$NGINX_SITE"
echo ""
echo "6. Restart nginx:"
echo "   sudo systemctl restart nginx"
echo ""
print_status "Your application will be available at: https://harvesthubph.app"