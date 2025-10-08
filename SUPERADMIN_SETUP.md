# HarvestHub Superadmin Initialization Guide

## Quick Setup for iamraymondbautista17@gmail.com

### Method 1: Using PowerShell (Recommended for Windows)

```powershell
# Initialize superadmin account
$body = @{
    initKey = "HARVESTHUB_SUPERADMIN_INIT_2025"
    email = "iamraymondbautista17@gmail.com"
    password = "YourSecurePassword123!"  # Change this password!
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/init-superadmin" -Method POST -Body $body -ContentType "application/json"
```

### Method 2: Using Node.js Script

```bash
# Run the initialization script
node scripts/init-superadmin.js
```

### Method 3: Using curl

```bash
curl -X POST http://localhost:3000/api/admin/init-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "initKey": "HARVESTHUB_SUPERADMIN_INIT_2025",
    "email": "iamraymondbautista17@gmail.com",
    "password": "YourSecurePassword123!"
  }'
```

### Method 4: Manual Database Setup

If you prefer to set it up directly in MongoDB:

```javascript
// Connect to your MongoDB database and run:
db.users.updateOne(
  { email: "iamraymondbautista17@gmail.com" },
  {
    $set: {
      role: "superadmin",
      status: "active",
      suspendedAt: null,
      suspendedBy: null,
      suspendReason: null
    }
  },
  { upsert: true }
);
```

## After Initialization

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin dashboard:
   ```
   http://localhost:3000/admin
   ```

3. Log in with:
   - Email: `iamraymondbautista17@gmail.com`
   - Password: `[Your chosen password]`

## Features Available

✅ **User Management**
- View, suspend, delete, promote/demote users
- Real-time user statistics
- User activity monitoring

✅ **Reports Management**
- Review user reports
- Categorize and prioritize reports
- Take moderation actions

✅ **Appeals System**
- Review user appeals
- Approve/reject appeals with detailed reasoning
- Track appeal timeline

✅ **Audit Logging**
- Complete audit trail of all admin actions
- IP address and user agent tracking
- Severity-based filtering

✅ **Role-Based Access Control**
- Superadmin, Admin, and User roles
- Protected API endpoints
- Session management with token versioning

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change the initialization key** in production (`HARVESTHUB_SUPERADMIN_INIT_2025`)
2. **Use strong passwords** (minimum 8 characters, include numbers and special characters)
3. **Enable HTTPS** in production
4. **Set up proper environment variables** for sensitive configurations
5. **Regularly review audit logs** for suspicious activities

## Troubleshooting

**Issue: "Superadmin already exists"**
- A superadmin account has already been created
- Log in with existing credentials or reset in MongoDB

**Issue: "Cannot connect to server"**
- Make sure Next.js server is running (`npm run dev`)
- Check that MongoDB is connected
- Verify the API endpoint URL

**Issue: "Access denied"**
- Clear browser cookies and try again
- Check user role in database
- Verify authentication middleware

## Success! 🎉

Once initialized, you'll have full administrative control over the HarvestHub platform with comprehensive moderation capabilities!