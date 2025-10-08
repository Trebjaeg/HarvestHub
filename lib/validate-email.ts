export const validateEmail = (email: string): boolean => {
  // Comprehensive email validation regex (RFC 5322 compliant)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Basic checks first
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC limit
  
  // Check for basic structure issues
  if (!email.includes('@')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.includes('..')) return false; // No consecutive dots
  
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domainPart] = parts;
  
  // Local part validation
  if (!localPart || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  
  // Domain part validation
  if (!domainPart || domainPart.length > 253) return false;
  if (!domainPart.includes('.')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
  if (domainPart.startsWith('-') || domainPart.endsWith('-')) return false;
  
  // Final regex validation
  return emailRegex.test(email);
};
