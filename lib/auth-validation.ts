import { validatePasswordStrength } from "./password-strength";
import { validateEmail } from "./validate-email";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AuthValidationState {
  email: ValidationResult;
  firstName: ValidationResult;
  lastName: ValidationResult;
  password: ValidationResult;
  confirmPassword: ValidationResult;
  terms: ValidationResult;
  privacy: ValidationResult;
}

export class AuthValidator {
  // Validate email with enhanced error messages
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email.trim()) {
      errors.push('auth.validation.emailRequired');
    } else if (!validateEmail(email)) {
      errors.push('auth.validation.emailInvalid');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate first name
  static validateFirstName(firstName: string): ValidationResult {
    const errors: string[] = [];
    
    if (!firstName.trim()) {
      errors.push('auth.validation.firstNameRequired');
    } else if (firstName.trim().length < 2) {
      errors.push('auth.validation.firstNameTooShort');
    } else if (firstName.trim().length > 50) {
      errors.push('auth.validation.firstNameTooLong');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate last name
  static validateLastName(lastName: string): ValidationResult {
    const errors: string[] = [];
    
    if (!lastName.trim()) {
      errors.push('auth.validation.lastNameRequired');
    } else if (lastName.trim().length < 2) {
      errors.push('auth.validation.lastNameTooShort');
    } else if (lastName.trim().length > 50) {
      errors.push('auth.validation.lastNameTooLong');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate password with enhanced security
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('auth.validation.passwordRequired');
      return { isValid: false, errors };
    }

    const strengthResult = validatePasswordStrength(password);
    
    if (!strengthResult.isValid) {
      errors.push(...strengthResult.feedback.map(feedback => `auth.validation.${feedback}`));
    }
    
    // Additional security checks
    if (password.includes(' ')) {
      errors.push('auth.validation.passwordNoSpaces');
    }
    
    // Check for personal info (basic check)
    const commonPersonalTerms = ['admin', 'user', 'test', 'demo', 'guest'];
    const lowerPassword = password.toLowerCase();
    if (commonPersonalTerms.some(term => lowerPassword.includes(term))) {
      errors.push('auth.validation.passwordNoPersonalInfo');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: strengthResult.score < 3 ? ['auth.validation.passwordCouldBeStronger'] : undefined
    };
  }

  // Validate confirm password
  static validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];
    
    if (!confirmPassword) {
      errors.push('auth.validation.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      errors.push('auth.validation.passwordsNoMatch');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate terms acceptance
  static validateTermsAcceptance(accepted: boolean): ValidationResult {
    const errors: string[] = [];
    
    if (!accepted) {
      errors.push('auth.validation.termsRequired');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate privacy acceptance
  static validatePrivacyAcceptance(accepted: boolean): ValidationResult {
    const errors: string[] = [];
    
    if (!accepted) {
      errors.push('auth.validation.privacyRequired');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate entire form state
  static validateAuthForm(formData: {
    email: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    acceptPrivacy?: boolean;
  }, isRegistration: boolean = false): AuthValidationState {
    const validation: AuthValidationState = {
      email: this.validateEmail(formData.email),
      firstName: { isValid: true, errors: [] },
      lastName: { isValid: true, errors: [] },
      password: { isValid: true, errors: [] },
      confirmPassword: { isValid: true, errors: [] },
      terms: { isValid: true, errors: [] },
      privacy: { isValid: true, errors: [] },
    };

    if (isRegistration) {
      validation.firstName = this.validateFirstName(formData.firstName || "");
      validation.lastName = this.validateLastName(formData.lastName || "");
      validation.password = this.validatePassword(formData.password || "");
      validation.confirmPassword = this.validateConfirmPassword(
        formData.password || "", 
        formData.confirmPassword || ""
      );
      validation.terms = this.validateTermsAcceptance(formData.acceptTerms || false);
      validation.privacy = this.validatePrivacyAcceptance(formData.acceptPrivacy || false);
    }

    return validation;
  }

  // Check if entire form is valid
  static isFormValid(validation: AuthValidationState): boolean {
    return Object.values(validation).every(field => field.isValid);
  }

  // Get all error messages
  static getAllErrors(validation: AuthValidationState): string[] {
    return Object.values(validation).flatMap(field => field.errors);
  }

  // Sanitize name input (allow only letters, spaces, hyphens, apostrophes)
  static sanitizeNameInput(input: string): string {
    return input.replace(/[^a-zA-Z\s\-']/g, '');
  }
}