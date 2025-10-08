# Database Optimization Guide for HarvestHub

This guide outlines the database optimizations implemented for improved performance and security.

## 🚀 Performance Optimizations

### 1. Enhanced MongoDB Connection
- **Connection Pooling**: Increased to 50 concurrent connections with minimum 5
- **Timeout Configuration**: Optimized timeouts for better reliability
- **Heartbeat Monitoring**: Regular health checks every 10 seconds
- **Connection Persistence**: Cached connections to prevent reconnection overhead

### 2. Database Indexes
The following indexes have been added to the User model:
- `email` (unique index for fast user lookups)
- `createdAt` (descending for recent user queries)
- `resetPasswordToken + resetPasswordExpires` (compound index for password reset)
- `accountLocked + lockUntil` (for account security queries)

### 3. Optimized Queries
- **Lean Queries**: Return plain JavaScript objects instead of Mongoose documents
- **Query Profiling**: Monitor and log slow queries (>1000ms)
- **Retry Logic**: Automatic retry with exponential backoff for failed queries
- **Field Projection**: Only select necessary fields to reduce network traffic

## 🔒 Security Enhancements

### 1. Authentication Security
- **Account Lockout**: Automatic lockout after 5 failed login attempts for 2 hours
- **Password Hashing**: Increased bcrypt cost factor to 12 rounds
- **JWT Security**: Enhanced token generation with unique JTI and proper claims
- **HTTP-Only Cookies**: Secure token storage to prevent XSS attacks

### 2. Rate Limiting
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP
- **General API**: 100 requests per 15 minutes per IP

### 3. Input Validation & Sanitization
- **Email Validation**: Regex-based email format validation
- **Input Sanitization**: Remove potentially harmful characters
- **Password Strength**: Enforce strong password requirements
- **Length Limits**: Prevent buffer overflow attacks

### 4. Security Headers
Automatically applied to all API responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 📊 Monitoring & Diagnostics

### Database Health Endpoint
Access `/api/monitoring/database` to get real-time database statistics:
- Connection status and response times
- Collection statistics and document counts
- Query performance metrics
- Performance recommendations

### Query Performance Tracking
- Automatic logging of slow queries
- Average response time tracking per query type
- Performance degradation alerts

## 🛠️ Setup Instructions

### 1. Environment Configuration
Copy `.env.template` to `.env.local` and configure:

```bash
# Database
MONGODB_URI=your-mongodb-connection-string

# Security
JWT_SECRET=your-jwt-secret-at-least-32-chars
ENCRYPTION_KEY=32-character-encryption-key

# Monitoring (optional)
MONITORING_TOKEN=secure-token-for-monitoring-endpoint

# Performance Tuning
DB_POOL_SIZE=50
DB_MIN_POOL_SIZE=5
BCRYPT_ROUNDS=12
```

### 2. Database Indexes Creation
Indexes are automatically created when the application starts. To manually create them:

```javascript
// In MongoDB shell or Compass
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "createdAt": -1 })
db.users.createIndex({ "resetPasswordToken": 1, "resetPasswordExpires": 1 })
db.users.createIndex({ "accountLocked": 1, "lockUntil": 1 })
```

### 3. Production Deployment

#### MongoDB Atlas Optimization
1. **Cluster Tier**: Use M10+ for production workloads
2. **Region**: Choose region closest to your application servers
3. **Replica Set**: Enable 3-member replica set for high availability
4. **Backup**: Enable automated backups
5. **Monitoring**: Enable MongoDB Atlas monitoring and alerts

#### Connection String Optimization
```
mongodb+srv://user:pass@cluster.mongodb.net/harvesthub?retryWrites=true&w=majority&maxPoolSize=50&minPoolSize=5
```

### 4. Monitoring Setup

#### Production Monitoring
1. Set up the monitoring endpoint with proper authentication
2. Configure alerting for slow queries and connection issues
3. Monitor memory usage and connection pool utilization
4. Set up log aggregation for error tracking

#### Performance Metrics to Monitor
- Average query response time
- Database connection pool usage
- Failed login attempt rates
- Rate limit trigger frequency
- Memory usage and garbage collection

## 🔧 Maintenance Tasks

### Daily
- Review query performance logs
- Check rate limit violations
- Monitor failed login attempts

### Weekly
- Analyze database statistics
- Review and rotate JWT secrets if needed
- Clean up expired tokens and sessions

### Monthly
- Performance optimization review
- Security audit of authentication flows
- Update dependencies and security patches

## ⚡ Performance Tips

### For High Traffic
1. **Implement Redis**: Use Redis for session storage and rate limiting
2. **Database Sharding**: Consider sharding for >1M users
3. **CDN**: Use CDN for static assets
4. **Caching**: Implement application-level caching for frequently accessed data

### For Development
1. **Local MongoDB**: Use local MongoDB instance for development
2. **Reduced Security**: Lower bcrypt rounds to 10 for faster development
3. **Verbose Logging**: Enable detailed logging for debugging

## 🚨 Security Checklist

- [ ] JWT secret is at least 32 characters and random
- [ ] Database connection string uses strong passwords
- [ ] Rate limiting is enabled for all authentication endpoints
- [ ] HTTPS is enforced in production
- [ ] Security headers are applied to all responses
- [ ] Input validation is implemented for all user inputs
- [ ] Account lockout is configured appropriately
- [ ] Password strength requirements are enforced
- [ ] Monitoring and alerting are set up
- [ ] Regular security updates are applied

## 📈 Expected Performance Improvements

With these optimizations, you should see:
- **50-80% faster** database queries due to indexes and connection pooling
- **Reduced memory usage** through lean queries and optimized connections
- **Better security posture** with comprehensive protection against common attacks
- **Improved user experience** through faster authentication and registration
- **Better monitoring** and ability to proactively address performance issues

## 🆘 Troubleshooting

### Common Issues

**Slow Queries**
- Check if indexes are being used with `explain()` in MongoDB
- Review query patterns in the monitoring endpoint
- Consider adding compound indexes for complex queries

**Connection Issues**
- Verify MongoDB connection string and credentials
- Check network connectivity and firewall rules
- Monitor connection pool usage

**High Memory Usage**
- Review query projection to ensure only necessary fields are returned
- Check for memory leaks in long-running connections
- Consider implementing query result caching

**Rate Limiting Issues**
- Review rate limit configurations for your traffic patterns
- Implement user-specific rate limiting instead of IP-based for authenticated users
- Consider using Redis for distributed rate limiting

For additional support, check the monitoring dashboard at `/api/monitoring/database` for real-time performance insights.