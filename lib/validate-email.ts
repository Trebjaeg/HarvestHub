export const validateEmail = (email: string) => {
  // Simple validation: check for @ and a dot after @
  if (!email || !email.includes('@')) return false;
  
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [username, domain] = parts;
  if (!username || !domain) return false;
  
  // Check if domain has at least one dot
  return domain.includes('.');
};
