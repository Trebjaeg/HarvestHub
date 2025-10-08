# 🌐 Domain Email Setup for harvesthubph.app

## Option 1: Google Workspace (Recommended for Professional Use)

### Benefits:
- Professional email addresses (no-reply@harvesthubph.app)
- 99.9% delivery rate
- Easy to set up and manage
- Integrates with your existing Google services

### Setup Steps:
1. **Sign up for Google Workspace** at [workspace.google.com](https://workspace.google.com)
2. **Verify your domain** (harvesthubph.app)
3. **Create email accounts**:
   - `no-reply@harvesthubph.app` (for system emails)
   - `admin@harvesthubph.app` (for admin notifications)
   - `support@harvesthubph.app` (for user support)

### Configuration:
```bash
# Google Workspace Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@harvesthubph.app
SMTP_PASS=your-app-password
MAIL_FROM="HarvestHub Philippines <no-reply@harvesthubph.app>"
```

## Option 2: Domain Provider Email (Most Common)

Many domain providers offer email hosting. Check if your domain registrar provides email services.

### Common Domain Email Providers:

#### Namecheap Email
```bash
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@harvesthubph.app
SMTP_PASS=your-email-password
```

#### GoDaddy Email
```bash
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@harvesthubph.app
SMTP_PASS=your-email-password
```

#### Hostinger Email
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@harvesthubph.app
SMTP_PASS=your-email-password
```

## Option 3: Professional Email Services (Best for Production)

### SendGrid (Recommended for Apps)
- **Cost**: Free tier: 100 emails/day, Paid: $14.95/month for 40K emails
- **Benefits**: High delivery rates, analytics, easy API

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
MAIL_FROM="HarvestHub Philippines <no-reply@harvesthubph.app>"
```

### Mailgun
- **Cost**: Free tier: 5K emails/month, Paid: $35/month for 50K emails
- **Benefits**: Developer-friendly, good documentation

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mg.harvesthubph.app
SMTP_PASS=your-mailgun-password
```

### Amazon SES
- **Cost**: $0.10 per 1,000 emails (very cost-effective)
- **Benefits**: Scalable, integrated with AWS

```bash
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-username
SMTP_PASS=your-ses-password
```

## Quick Setup Guide

### Step 1: Choose Your Email Provider
I recommend **Google Workspace** for simplicity or **SendGrid** for production apps.

### Step 2: Set Up DNS Records
Add these DNS records to your domain (harvesthubph.app):

#### For Google Workspace:
```
MX Records (provided by Google):
1 ASPMX.L.GOOGLE.COM
5 ALT1.ASPMX.L.GOOGLE.COM
5 ALT2.ASPMX.L.GOOGLE.COM
10 ALT3.ASPMX.L.GOOGLE.COM
10 ALT4.ASPMX.L.GOOGLE.COM

SPF Record:
TXT "v=spf1 include:_spf.google.com ~all"

DKIM Record:
TXT (provided by Google Workspace)
```

#### For SendGrid:
```
CNAME Records:
em123.harvesthubph.app -> u123.wl.sendgrid.net
s1._domainkey.harvesthubph.app -> s1.domainkey.u123.wl.sendgrid.net
s2._domainkey.harvesthubph.app -> s2.domainkey.u123.wl.sendgrid.net

SPF Record:
TXT "v=spf1 include:sendgrid.net ~all"
```

### Step 3: Update Your Environment Variables

```bash
# Your Domain Email Configuration
SMTP_HOST=smtp.gmail.com  # or your provider's SMTP
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@harvesthubph.app
SMTP_PASS=your-app-password
MAIL_FROM="HarvestHub Philippines <no-reply@harvesthubph.app>"
NEXT_PUBLIC_BASE_URL=https://harvesthubph.app
```

### Step 4: Test Your Email Setup

```bash
# Test basic email
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-personal-email@gmail.com","type":"test"}'

# Test password reset email
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-personal-email@gmail.com","type":"password-reset"}'
```

## Multi-Provider Email Support

Your password reset system now supports **ANY email provider** for recipients:

### ✅ Supported Recipient Email Providers:
- Gmail (@gmail.com)
- Yahoo (@yahoo.com, @yahoo.co.uk, etc.)
- Outlook/Hotmail (@outlook.com, @hotmail.com)
- Apple iCloud (@icloud.com, @me.com)
- Corporate emails (@company.com)
- Any custom domain emails
- International email providers
- Educational emails (@university.edu)

### Email Validation Features:
- ✅ Validates email format with regex
- ✅ Sanitizes input to prevent injection
- ✅ Supports international characters
- ✅ Works with all TLD extensions (.com, .org, .ph, .app, etc.)

## Recommended Setup for harvesthubph.app

### For Development:
```bash
# Use Google Workspace or your domain email
SMTP_HOST=smtp.gmail.com
SMTP_USER=no-reply@harvesthubph.app
SMTP_PASS=your-app-password
MAIL_FROM="HarvestHub Philippines <no-reply@harvesthubph.app>"
```

### For Production:
```bash
# Use SendGrid for reliability
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
MAIL_FROM="HarvestHub Philippines <no-reply@harvesthubph.app>"
```

## Email Best Practices

### ✅ Do This:
- Use `no-reply@harvesthubph.app` for system emails
- Set up SPF, DKIM, and DMARC records
- Monitor email delivery rates
- Use professional email templates
- Include unsubscribe links in newsletters
- Test emails with different providers

### ❌ Avoid This:
- Don't use personal Gmail for business emails
- Don't ignore email bounces and complaints
- Don't send emails without proper authentication
- Don't use misleading subject lines
- Don't spam users with too many emails

## Cost Comparison

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| Google Workspace | None | $6/user/month | Professional businesses |
| SendGrid | 100 emails/day | $14.95/month | App developers |
| Mailgun | 5K emails/month | $35/month | High-volume apps |
| Amazon SES | 62K emails/month* | $0.10/1K emails | AWS users |
| Domain Provider | Usually 5-10 emails | $5-15/month | Simple setups |

*With AWS Free Tier

## Next Steps

1. **Choose your email provider** (I recommend Google Workspace or SendGrid)
2. **Set up your email account** (no-reply@harvesthubph.app)
3. **Configure DNS records** for your domain
4. **Update your .env.local** with the correct credentials
5. **Test the email system** using the test endpoints
6. **Deploy and enjoy professional emails!** 🎉

Your password reset system will work with any email address users provide, while sending from your professional domain!