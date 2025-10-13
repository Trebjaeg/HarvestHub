# DigitalOcean Infrastructure Setup Guide

This guide will help you set up DigitalOcean Droplets for MongoDB hosting and Spaces for file storage for your HarvestHub application.

## Prerequisites

1. DigitalOcean Account
2. Basic knowledge of Linux command line
3. MongoDB experience (basic)

## Step 1: Create DigitalOcean Spaces (Object Storage)

### 1.1 Create Spaces Bucket
1. Go to DigitalOcean Dashboard → Spaces & Object Storage
2. Click "Create Spaces Bucket"
3. Choose Region (recommended: NYC3 for faster access)
4. Enter Bucket Name (e.g., `harvesthub-storage`)
5. Choose "Restrict File Listing" for security
6. Click "Create Bucket"

### 1.2 Create API Keys
1. Go to API → Spaces Keys
2. Click "Generate New Key"
3. Enter Key Name (e.g., `harvesthub-spaces-key`)
4. Save both Access Key and Secret Key securely

### 1.3 Enable CDN (Optional but Recommended)
1. In your Spaces bucket, go to Settings
2. Click "Enable CDN"
3. Note the CDN endpoint URL

## Step 2: Create DigitalOcean Droplet for MongoDB

### 2.1 Create Droplet
1. Go to DigitalOcean Dashboard → Droplets
2. Click "Create Droplet"
3. Choose Image: Ubuntu 22.04 LTS
4. Choose Size: Basic plan, $12/month (2GB RAM, 1 vCPU) minimum for MongoDB
5. Choose Region: Same as your Spaces bucket
6. Add SSH keys or create password authentication
7. Enter Droplet name (e.g., `harvesthub-mongodb`)
8. Click "Create Droplet"

### 2.2 Connect to Droplet
```bash
ssh root@your_droplet_ip
```

### 2.3 Install MongoDB
```bash
# Update packages
apt update && apt upgrade -y

# Import MongoDB GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
apt update

# Install MongoDB
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Check status
systemctl status mongod
```

### 2.4 Configure MongoDB Security
```bash
# Create admin user
mongosh
```

In MongoDB shell:
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your_strong_password_here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

use harvesthub
db.createUser({
  user: "harvesthub_user",
  pwd: "your_app_password_here",
  roles: [ { role: "readWrite", db: "harvesthub" } ]
})

exit
```

Enable authentication:
```bash
# Edit MongoDB config
nano /etc/mongod.conf
```

Add/modify these lines:
```yaml
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1,your_droplet_private_ip
```

Restart MongoDB:
```bash
systemctl restart mongod
```

### 2.5 Configure Firewall
```bash
# Enable UFW firewall
ufw enable

# Allow SSH
ufw allow ssh

# Allow MongoDB from your application server only
ufw allow from your_app_server_ip to any port 27017

# Check firewall status
ufw status
```

## Step 3: Configure Environment Variables

Create or update your `.env` file:

```bash
# Database Configuration
MONGODB_URI=mongodb://harvesthub_user:your_app_password_here@your_droplet_ip:27017/harvesthub

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# DigitalOcean Spaces Configuration
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_ACCESS_KEY_ID=your_access_key_here
DO_SPACES_SECRET_ACCESS_KEY=your_secret_key_here
DO_SPACES_CDN_ENDPOINT=https://your-bucket-name.nyc3.cdn.digitaloceanspaces.com

# Other configurations...
```

## Step 4: Test Connection

### 4.1 Test MongoDB Connection
```bash
# From your application server
mongosh "mongodb://harvesthub_user:your_app_password_here@your_droplet_ip:27017/harvesthub"
```

### 4.2 Test Spaces Upload
You can test the Spaces integration by uploading an image through your application's profile or product image upload feature.

## Step 5: Database Migration (If needed)

If you have existing data on local MongoDB:

### 5.1 Export from Local
```bash
mongodump --db harvesthub --out ./backup
```

### 5.2 Import to DigitalOcean
```bash
mongorestore --host your_droplet_ip:27017 --username harvesthub_user --password your_app_password_here --db harvesthub ./backup/harvesthub
```

## Step 6: Monitoring and Maintenance

### 6.1 MongoDB Monitoring
```bash
# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Monitor MongoDB performance
mongosh "mongodb://harvesthub_user:your_app_password_here@your_droplet_ip:27017/harvesthub"
db.stats()
```

### 6.2 Automated Backups
Create a backup script:
```bash
nano /opt/backup-mongodb.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --host localhost:27017 --username harvesthub_user --password your_app_password_here --db harvesthub --out /opt/backups/mongodb_$DATE
tar -czf /opt/backups/mongodb_$DATE.tar.gz /opt/backups/mongodb_$DATE
rm -rf /opt/backups/mongodb_$DATE
find /opt/backups -name "*.tar.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /opt/backup-mongodb.sh
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /opt/backup-mongodb.sh
```

## Security Best Practices

1. **Use strong passwords** for MongoDB users
2. **Enable firewall** and restrict access to necessary IPs only
3. **Regular updates** of both Ubuntu and MongoDB
4. **Enable MongoDB SSL/TLS** for production (optional)
5. **Monitor access logs** regularly
6. **Use VPC networking** for enhanced security (DigitalOcean feature)

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check MongoDB service: `systemctl status mongod`
   - Check firewall: `ufw status`
   - Verify bindIp in `/etc/mongod.conf`

2. **Authentication Failed**
   - Verify user credentials
   - Check user permissions: `db.getUsers()` in MongoDB shell

3. **Spaces Upload Fails**
   - Verify API keys and permissions
   - Check bucket name and region in environment variables
   - Ensure bucket policy allows uploads

## Cost Optimization

1. **Droplet Sizing**: Start with $12/month droplet, scale up if needed
2. **Spaces Storage**: Monitor usage, implement lifecycle policies
3. **CDN Usage**: Use CDN for frequently accessed files
4. **Reserved Instances**: Consider reserved instances for long-term savings

## Support

For issues specific to DigitalOcean services, consult:
- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- DigitalOcean Community Forums