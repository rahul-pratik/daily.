/**
 * Password complexity validation utility.
 * Validates minimum length (>= 8 chars), digits (0-9), and special characters.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
export const DIGIT_REGEX = /\d/;

export interface PasswordRequirement {
  id: 'length' | 'digit' | 'special';
  label: string;
  met: boolean;
  hint: string;
}

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasSpecialChar: boolean;
  hasDigit: boolean;
  isValid: boolean;
  score: number; // 0 to 3
  percentage: number; // 0 to 100
  strengthLabel: 'Too Weak' | 'Weak' | 'Fair' | 'Strong';
  strengthColor: string;
  strengthBgColor: string;
  requirements: PasswordRequirement[];
  errors: string[];
}

export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const pwd = typeof password === 'string' ? password : '';
  const hasMinLength = pwd.length >= MIN_PASSWORD_LENGTH;
  const hasDigit = DIGIT_REGEX.test(pwd);
  const hasSpecialChar = SPECIAL_CHAR_REGEX.test(pwd);

  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: `Minimum ${MIN_PASSWORD_LENGTH} characters`,
      met: hasMinLength,
      hint: `${pwd.length}/${MIN_PASSWORD_LENGTH} characters`,
    },
    {
      id: 'digit',
      label: 'At least 1 digit (0-9)',
      met: hasDigit,
      hint: hasDigit ? 'Included' : 'Missing number',
    },
    {
      id: 'special',
      label: 'At least 1 special character (!@#$%^&*)',
      met: hasSpecialChar,
      hint: hasSpecialChar ? 'Included' : 'Missing symbol',
    },
  ];

  const errors: string[] = requirements
    .filter((req) => !req.met)
    .map((req) => req.label);

  const metCount = requirements.filter((req) => req.met).length;
  const percentage = Math.round((metCount / requirements.length) * 100);

  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Too Weak';
  let strengthColor = 'text-red-400';
  let strengthBgColor = 'bg-red-500';

  if (!pwd) {
    strengthLabel = 'Too Weak';
    strengthColor = 'text-white/40';
    strengthBgColor = 'bg-white/10';
  } else if (metCount === 1) {
    strengthLabel = 'Weak';
    strengthColor = 'text-red-400';
    strengthBgColor = 'bg-red-500';
  } else if (metCount === 2) {
    strengthLabel = 'Fair';
    strengthColor = 'text-amber-400';
    strengthBgColor = 'bg-amber-500';
  } else if (metCount === 3) {
    strengthLabel = 'Strong';
    strengthColor = 'text-emerald-400';
    strengthBgColor = 'bg-emerald-500';
  }

  return {
    hasMinLength,
    hasSpecialChar,
    hasDigit,
    isValid: metCount === 3,
    score: metCount,
    percentage,
    strengthLabel,
    strengthColor,
    strengthBgColor,
    requirements,
    errors,
  };
}
