import { NextApiResponse } from 'next';

interface UserForCheck {
  _id: string;
  status: 'active' | 'suspended' | 'deleted';
  suspendReason?: string | null;
  suspendedAt?: Date | null;
  suspensionExpiresAt?: Date | null;
}

/**
 * Check if user is suspended and return appropriate error response
 * Returns true if user IS suspended (should block action)
 * Returns false if user is not suspended (allow action)
 */
export function checkUserSuspended(
  user: UserForCheck,
  res: NextApiResponse,
  actionType: 'buy' | 'sell' | 'transact' = 'transact'
): boolean {
  if (user.status !== 'suspended') {
    return false; // Not suspended, allow action
  }

  // User is suspended - determine appropriate message
  const actionVerb = actionType === 'buy' ? 'make purchases' : 
                      actionType === 'sell' ? 'list or sell products' : 
                      'perform this action';

  const message = `Your account is suspended and you cannot ${actionVerb}. You can view your account but buying and selling are disabled. Please submit an appeal to request account restoration.`;

  res.status(403).json({
    error: 'Account suspended',
    code: 'SUSPENDED',
    message,
    suspendReason: user.suspendReason || 'No reason provided',
    suspendedAt: user.suspendedAt,
    canAppeal: true,
    appealUrl: '/appeals/new'
  });

  return true; // Is suspended, action blocked
}

/**
 * Middleware-style function to check suspension before API logic
 * Usage: if (await requireNotSuspended(user, res, 'buy')) return;
 */
export function requireNotSuspended(
  user: UserForCheck,
  res: NextApiResponse,
  actionType: 'buy' | 'sell' | 'transact' = 'transact'
): boolean {
  return checkUserSuspended(user, res, actionType);
}

/**
 * Check if suspension has expired and should be auto-lifted
 */
export function isSuspensionExpired(user: UserForCheck): boolean {
  if (user.status !== 'suspended') return false;
  if (!user.suspensionExpiresAt) return false;
  
  return new Date() > new Date(user.suspensionExpiresAt);
}

/**
 * Get user-friendly suspension message
 */
export function getSuspensionMessage(user: UserForCheck): string | null {
  if (user.status !== 'suspended') return null;

  const reason = user.suspendReason || 'Violation of platform terms';
  const expiresAt = user.suspensionExpiresAt 
    ? new Date(user.suspensionExpiresAt).toLocaleDateString()
    : null;

  let message = `Your account has been suspended. Reason: ${reason}.`;
  
  if (expiresAt) {
    message += ` This suspension will be automatically lifted on ${expiresAt}.`;
  } else {
    message += ' This suspension is indefinite.';
  }
  
  message += ' You can submit an appeal to request early restoration.';
  
  return message;
}
