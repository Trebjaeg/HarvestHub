# 📧 Email Setup Guide for HarvestHub

## Gmail App Password Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in the left panel
3. Under **"Signing in to Google"**, click **2-Step Verification**
4. Follow the setup process to enable 2FA

### Step 2: Generate App Password
1. In Google Account Settings → **Security**
2. Under **"Signing in to Google"**, click **App passwords**
3. Select **Mail** from the dropdown
4. Click **Generate**
5. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

### Step 3: Update Your .env.local
Replace these values in your `.env.local` file:

```bash
# Email Configuration - REPLACE WITH YOUR ACTUAL GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-actual-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM="HarvestHub <your-actual-gmail@gmail.com>"
```

## Alternative Email Providers

### Gmail (Business/Workspace)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-business-email@yourdomain.com
SMTP_PASS=your-app-password
```

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid (Professional)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Testing Your Email Configuration

### 1. Test Email Service
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","type":"test"}'
```

### 2. Test Password Reset Email
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","type":"password-reset"}'
```

### 3. Test Account Verification Email
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","type":"verification"}'
```

## Email Features Now Available

### ✅ Password Reset Emails
- Professional HTML template with your branding
- 15-minute expiration security
- Mobile-responsive design
- Security warnings and instructions

### ✅ Account Verification Emails
- Welcome message with verification link
- 24-hour expiration for verification
- Professional styling

### ✅ Email Service Features
- Automatic retry logic
- Connection verification
- Error logging and debugging
- Development vs production modes
- Plain text fallback for accessibility

## Troubleshooting

### Common Issues

#### ❌ "Authentication failed"
- **Solution**: Make sure you're using an App Password, not your regular Gmail password
- **Check**: 2-Factor Authentication must be enabled first

#### ❌ "Connection timeout"
- **Solution**: Check your network connection and firewall settings
- **Try**: Different SMTP ports (587, 465, or 25)

#### ❌ "Invalid login"
- **Solution**: Double-check your email address and app password
- **Verify**: The email address exists and is correct

#### ❌ "Email not configured"
- **Solution**: Make sure all SMTP environment variables are set in `.env.local`
- **Check**: No extra spaces or quotes in environment variables

### Development Mode
If email isn't configured, the system will:
- Log email details to console
- Continue working without sending actual emails
- Show configuration hints in API responses

### Production Mode
For production deployment, consider:
- **SendGrid** (99.9% delivery rate, professional service)
- **Mailgun** (Developer-friendly, good pricing)
- **Amazon SES** (Cost-effective for high volumes)
- **Gmail Business** (Professional email addresses)

## Security Best Practices

### ✅ Do This:
- Use App Passwords instead of regular passwords
- Enable 2-Factor Authentication on your email account
- Use professional email addresses for MAIL_FROM
- Monitor email delivery rates and bounces
- Set up SPF, DKIM, and DMARC records for your domain

### ❌ Don't Do This:
- Never commit email passwords to git
- Don't use personal emails for business applications
- Don't disable email security features
- Don't ignore email delivery failures

## Email Templates

Your password reset emails now include:
- 🎨 Professional HarvestHub branding
- 📱 Mobile-responsive design
- 🔒 Security warnings and instructions
- ⏰ Clear expiration times
- 🔗 One-click reset buttons
- 📝 Plain text versions for accessibility

## Next Steps

1. **Set up your Gmail App Password** (most important)
2. **Update your .env.local** with real email credentials
3. **Test the email service** using the test endpoints
4. **Try a real password reset** to make sure everything works
5. **Consider upgrading to a professional email service** for production

Your password reset functionality is now **fully implemented and ready to use**! 🎉