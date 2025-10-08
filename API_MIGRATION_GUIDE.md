# API Routes Security Migration Guide

This guide shows you how to migrate your existing Next.js API routes to use the new security middleware.

## 📋 Migration Pattern

### Before (Old Pattern)
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ email });
    res.status(200).json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}
```

### After (New Pattern)
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { DatabaseUtils, QueryProfiler } from '@/lib/database-utils';
import { sanitizeInput } from '@/lib/security';

async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  let { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Sanitize input
  email = sanitizeInput(email).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    await dbConnect();
    
    const user = await QueryProfiler.profile('user_lookup', async () => {
      return await DatabaseUtils.findOneWithRetry(User, { email }, { _id: 1 });
    });
    
    res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Apply security middleware
export default withSecurity(
  withLogging(apiHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['POST'],
    cors: true
  }
);
```

## 🔄 Step-by-Step Migration

### Step 1: Import Security Modules
Add these imports at the top of your API files:
```typescript
import { withSecurity, withLogging } from '@/lib/middleware';
import { DatabaseUtils, QueryProfiler } from '@/lib/database-utils';
import { sanitizeInput } from '@/lib/security';
```

### Step 2: Rename Your Handler Function
Change from:
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
```
To:
```typescript
async function myApiHandler(req: NextApiRequest, res: NextApiResponse) {
```

### Step 3: Remove Manual Method Checking
Remove this pattern:
```typescript
if (req.method !== 'POST') {
  return res.status(405).json({ message: 'Method not allowed' });
}
```
The security middleware will handle this automatically.

### Step 4: Add Input Sanitization
Replace direct body destructuring:
```typescript
const { email, password } = req.body;
```
With sanitized inputs:
```typescript
let { email, password } = req.body;
email = sanitizeInput(email).toLowerCase();
password = sanitizeInput(password);
```

### Step 5: Replace Direct Database Calls
Replace:
```typescript
const user = await User.findOne({ email });
```
With optimized calls:
```typescript
const user = await QueryProfiler.profile('user_lookup', async () => {
  return await DatabaseUtils.findOneWithRetry(User, { email }, { _id: 1 });
});
```

### Step 6: Apply Security Middleware
Add at the bottom of your file:
```typescript
export default withSecurity(
  withLogging(myApiHandler),
  {
    rateLimit: 'general',        // or 'login', 'register', 'passwordReset'
    allowedMethods: ['POST'],    // specify allowed HTTP methods
    cors: true,                  // enable CORS if needed
    requireAuth: false           // set to true if authentication is required
  }
);
```

## 🛡️ Security Middleware Options

### Rate Limiting Options
- `'login'`: 5 attempts per 15 minutes
- `'register'`: 3 attempts per hour  
- `'passwordReset'`: 3 attempts per hour
- `'general'`: 100 requests per 15 minutes

### Method Restrictions
```typescript
allowedMethods: ['GET']           // Read-only endpoints
allowedMethods: ['POST']          // Write endpoints
allowedMethods: ['POST', 'PUT']   // Multiple methods
```

### Authentication Requirements
```typescript
requireAuth: true   // Requires valid JWT token in Authorization header
requireAuth: false  // Public endpoint (default)
```

## 📊 Database Query Optimization

### Replace Basic Queries
```typescript
// Before
const users = await User.find({ status: 'active' });

// After
const users = await QueryProfiler.profile('active_users', async () => {
  return await DatabaseUtils.findWithRetry(
    User, 
    { status: 'active' }, 
    { projection: { password: 0 } } // Don't return sensitive fields
  );
});
```

### Use Lean Queries for Performance
```typescript
// Automatically enabled in DatabaseUtils, or manually:
const user = await User.findOne({ email }).lean().exec();
```

## 🔍 Input Validation Examples

### Email Validation
```typescript
email = sanitizeInput(email).toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ message: 'Invalid email format' });
}
```

### Password Validation
```typescript
import { validatePasswordStrength } from '@/lib/password-strength';

const passwordValidation = validatePasswordStrength(password);
if (passwordValidation.score < 2) {
  return res.status(400).json({ 
    message: 'Password is too weak',
    suggestions: passwordValidation.feedback.suggestions
  });
}
```

## 🎯 Common Migration Patterns

### Authentication Endpoints
```typescript
export default withSecurity(
  withLogging(loginHandler),
  {
    rateLimit: 'login',
    allowedMethods: ['POST'],
    cors: true
  }
);
```

### Protected Endpoints
```typescript
export default withSecurity(
  withLogging(protectedHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['GET', 'POST'],
    requireAuth: true,  // Requires JWT token
    cors: true
  }
);
```

### Public Read-Only Endpoints
```typescript
export default withSecurity(
  withLogging(publicHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['GET'],
    cors: true
  }
);
```

## ✅ Migration Checklist

For each API route, ensure you:

- [ ] Import security middleware and utilities
- [ ] Rename handler function (not default export)
- [ ] Remove manual method checking
- [ ] Add input sanitization
- [ ] Replace database calls with optimized versions
- [ ] Apply security middleware with appropriate options
- [ ] Test rate limiting behavior
- [ ] Verify error handling and logging
- [ ] Check CORS headers if needed
- [ ] Test with malicious inputs

## 🔧 Testing Your Migrated APIs

### Test Rate Limiting
```bash
# Make multiple rapid requests to test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
done
```

### Test Input Validation
```bash
# Test with malicious input
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>","password":"test123"}'
```

### Monitor Performance
Access the monitoring endpoint to check query performance:
```bash
curl -H "Authorization: Bearer YOUR_MONITORING_TOKEN" \
  http://localhost:3000/api/monitoring/database
```

## 🚨 Important Notes

1. **Backwards Compatibility**: The middleware doesn't break existing functionality
2. **Environment Variables**: Make sure to set up `.env.local` with the security configuration
3. **Error Handling**: Enhanced error messages provide better user experience
4. **Logging**: All requests are now automatically logged for debugging
5. **Performance**: Database calls are optimized and monitored automatically

Your API routes are now secured and optimized! 🎉