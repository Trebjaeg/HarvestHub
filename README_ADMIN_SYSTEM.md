# 🌱 HarvestHub Superadmin Moderation System

## 🎯 Overview

A comprehensive, enterprise-grade moderation system for the HarvestHub marketplace platform. This system provides complete administrative control with role-based access, audit logging, user management, reports processing, and appeals handling.

## ✨ Features

### 🔐 Authentication & Authorization
- **Role-based access control** (User, Admin, Superadmin)
- **JWT token management** with versioning for session invalidation
- **Protected API endpoints** with middleware validation
- **Session security** with IP tracking and user agent logging

### 👥 User Management
- **User lifecycle management** (activate, suspend, delete)
- **Role promotion/demotion** (user ↔ admin)
- **Bulk operations** with reason tracking
- **User activity monitoring** and statistics
- **Search and filtering** by role, status, registration date

### 📋 Reports Management
- **User report processing** with evidence handling
- **Priority-based classification** (low, medium, high, critical)
- **Report categorization** (spam, harassment, inappropriate content, etc.)
- **Review workflow** (pending → under review → resolved/dismissed)
- **Action tracking** with detailed notes

### ⚖️ Appeals System
- **Appeal submission** for suspended/deleted users
- **Review timeline** with complete audit trail
- **Evidence collection** (text, images, URLs)
- **Decision tracking** with reasoning
- **Automated actions** (unsuspend, restore content, etc.)

### 📊 Audit Logging
- **Complete action tracking** for all admin operations
- **Severity-based logging** (low, medium, high, critical)
- **IP address and user agent tracking**
- **Metadata storage** for detailed context
- **Real-time monitoring** with filtering capabilities

### 📈 Analytics Dashboard
- **Real-time statistics** (users, reports, appeals)
- **Activity metrics** (recent actions, pending items)
- **Visual indicators** for critical items
- **Performance monitoring** with trends

## 🏗️ Architecture

### Backend Components

```
models/
├── User.ts              # Enhanced user model with moderation fields
├── AuditLog.ts          # Comprehensive action logging
├── UserReport.ts        # User report management
└── Appeal.ts            # Appeal system handling

lib/
└── auth-middleware.ts   # Role-based access control

pages/api/admin/
├── users/route.ts       # User management operations
├── reports/route.ts     # Report processing
├── appeals/route.ts     # Appeal handling
├── audit/route.ts       # Audit log retrieval
├── stats/route.ts       # Dashboard statistics
└── init-superadmin/route.ts  # Initial setup
```

### Frontend Components

```
components/admin/AdminDashboard/
├── index.tsx                 # Main dashboard
├── UserManagement.tsx        # User operations
├── ReportsManagement.tsx     # Report processing
├── AppealsManagement.tsx     # Appeal handling
└── AuditLogs.tsx            # Activity monitoring

components/ui/
├── card.tsx                 # Card components
├── badge.tsx                # Status badges
├── select.tsx               # Dropdown menus
├── alert.tsx                # Alert messages
├── dialog.tsx               # Modal dialogs
├── textarea.tsx             # Text input areas
└── tabs.tsx                 # Tab navigation
```

## 🚀 Quick Start

### 1. Initialize Superadmin Account

```powershell
# Using PowerShell (Windows)
$body = @{
    initKey = "HARVESTHUB_SUPERADMIN_INIT_2025"
    email = "iamraymondbautista17@gmail.com"
    password = "YourSecurePassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/init-superadmin" -Method POST -Body $body -ContentType "application/json"
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Admin Dashboard

Navigate to: `http://localhost:3000/admin`

Login with your superadmin credentials.

## 📋 API Endpoints

### Authentication
- `GET /api/auth/check` - Verify user authentication
- `POST /api/admin/init-superadmin` - Initialize superadmin account

### User Management
- `GET /api/admin/users` - List users with filtering
- `POST /api/admin/users` - Perform user actions (suspend, delete, promote)

### Reports
- `GET /api/admin/reports` - List user reports
- `POST /api/admin/reports` - Process reports (review, resolve, dismiss)

### Appeals
- `GET /api/admin/appeals` - List appeals
- `POST /api/admin/appeals` - Handle appeals (approve, reject)

### Audit & Analytics
- `GET /api/admin/audit` - Retrieve audit logs
- `GET /api/admin/stats` - Dashboard statistics

## 🔧 Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/harvesthub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Security Settings

```javascript
// lib/auth-middleware.ts
const JWT_EXPIRES_IN = '7d';        // Token expiration
const RATE_LIMIT_WINDOW = 900000;   // 15 minutes
const RATE_LIMIT_MAX = 100;         // Requests per window
```

## 🛡️ Security Features

### Data Protection
- **Input validation** and sanitization
- **SQL injection prevention** with Mongoose ODM
- **XSS protection** with proper escaping
- **CSRF protection** with SameSite cookies

### Access Control
- **Role-based permissions** with hierarchy
- **Session management** with token versioning
- **IP allowlisting** (configurable)
- **Rate limiting** on sensitive endpoints

### Audit & Compliance
- **Complete audit trail** for all operations
- **Data retention policies** (configurable)
- **Export capabilities** for compliance reporting
- **Anonymous data handling** options

## 📱 User Experience

### Admin Dashboard
- **Responsive design** for desktop and mobile
- **Real-time updates** with WebSocket integration
- **Bulk operations** with progress indicators
- **Keyboard shortcuts** for power users

### Notifications
- **In-app notifications** for urgent actions
- **Email alerts** for critical events
- **Dashboard badges** for pending items
- **Sound notifications** (configurable)

## 🔄 Workflows

### User Suspension Process
1. **Report received** → Auto-categorized by priority
2. **Admin review** → Evidence evaluation
3. **Decision made** → Action taken with reasoning
4. **User notified** → Appeal option provided
5. **Audit logged** → Complete trail maintained

### Appeal Processing
1. **Appeal submitted** → User provides evidence
2. **Review initiated** → Admin evaluation
3. **Decision rendered** → Approve/reject with reasoning
4. **Action executed** → Automatic restoration if approved
5. **Timeline updated** → Complete process tracked

## 📊 Monitoring & Analytics

### Key Metrics
- **User activity** (registrations, logins, suspensions)
- **Report volume** (by type, priority, resolution time)
- **Appeal success rates** (by category, reviewer)
- **Admin performance** (actions per day, response time)

### Dashboard Widgets
- **Real-time counters** for active users, pending reports
- **Trend graphs** for user growth, report volumes
- **Heat maps** for activity patterns
- **Alert panels** for critical issues

## 🚨 Troubleshooting

### Common Issues

**"Access Denied" Error**
```bash
# Check user role in database
db.users.findOne({ email: "your-email@gmail.com" })

# Update role if needed
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "superadmin" } }
)
```

**"Cannot Connect to Database"**
```bash
# Verify MongoDB is running
mongod --version

# Check connection string
echo $MONGODB_URI
```

**"Token Expired" Error**
```javascript
// Clear browser cookies and login again
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

## 🤝 Contributing

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Initialize database: `npm run db:setup`
5. Start development server: `npm run dev`

### Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 📞 Support

For technical support or questions about the moderation system:

- **Documentation**: `/docs/admin-system`
- **API Reference**: `/api-docs`
- **Support Email**: admin@harvesthub.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

---

## 🎉 Success!

Your HarvestHub superadmin moderation system is now ready! You have complete administrative control with enterprise-level security and comprehensive audit capabilities.

**Next Steps:**
1. ✅ Initialize your superadmin account
2. ✅ Access the admin dashboard
3. ✅ Configure notification preferences
4. ✅ Set up monitoring alerts
5. ✅ Review security settings

**Happy moderating! 🌱**