import ProfileRouter from '@/components/ProfileRouter';

/**
 * My Profile page (/my-profile)
 * When user navigates here, this page fetches their role from server
 * and automatically routes them to the appropriate dashboard:
 * 
 * - Verified sellers → /sellerdashboard (with union access to buyer features)
 * - Buyers → /buyer-profile (restricted from seller features)
 * - Admins → /admin
 * 
 * Role is determined server-side from database, not from client or JWT claims.
 * This ensures proper RBAC enforcement.
 */
export default function ProfilePage() {
  return <ProfileRouter />;
}
