export interface PasswordStrength {
  score: number; // 0-4 (0=very weak, 4=very strong)
  feedback: string[];
  isValid: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Basic requirements
  if (password.length < 8) {
    feedback.push('passwordMinLength');
    return { score: 0, feedback, isValid: false };
  }

  // Check for symbols
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSymbol) {
    feedback.push('passwordNeedsSymbol');
    return { score: 0, feedback, isValid: false };
  }

  // Password strength scoring
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Base score for meeting requirements
  score = 1;

  if (hasLower) score++;
  if (hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  // Length bonus
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Penalty for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score = Math.max(0, score - 2);
    feedback.push('passwordTooWeak');
  }

  // Repetitive characters penalty
  const hasRepetitive = /(.)\1{2,}/.test(password);
  if (hasRepetitive) {
    score = Math.max(0, score - 1);
  }

  // Sequential characters penalty
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
  if (hasSequential) {
    score = Math.max(0, score - 1);
  }

  // Cap score at 4
  score = Math.min(4, score);

  // Add strength feedback
  if (score <= 1) {
    feedback.push('passwordWeak');
  } else if (score <= 2) {
    feedback.push('passwordMedium');
  } else {
    feedback.push('passwordStrong');
  }

  return {
    score,
    feedback,
    isValid: score >= 1 && hasSymbol && password.length >= 8
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600';
    case 2:
      return 'text-yellow-600';
    case 3:
    case 4:
      return 'text-green-600';
    default:
      return 'text-gray-400';
  }
};

export const getPasswordStrengthBg = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-100';
    case 2:
      return 'bg-yellow-100';
    case 3:
    case 4:
      return 'bg-green-100';
    default:
      return 'bg-gray-100';
  }
};