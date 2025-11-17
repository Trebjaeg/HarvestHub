import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthAndFetchUser, RoleHierarchy } from '@/lib/rbac';

/**
 * GET /api/profile/route
 * Fetches authoritative user data from database and returns profile + dashboard route
 * Role is fetched from database, NOT from client or JWT claims
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch authoritative user data from database
    const user = await verifyAuthAndFetchUser(req);
    
    // Get the appropriate dashboard route based on role hierarchy
    const dashboardRoute = RoleHierarchy.getDashboardRoute(user);
    
    // Return user profile with access permissions
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sellerStatus: user.sellerStatus,
        status: user.status,
        profileImage: user.profileImage,
        phone: user.phone
      },
      permissions: {
        canAccessSellerFeatures: RoleHierarchy.canAccessSellerFeatures(user),
        canAccessBuyerFeatures: RoleHierarchy.canAccessBuyerFeatures(user),
        canAccessAdminFeatures: RoleHierarchy.canAccessAdminFeatures(user),
        isSuperAdmin: RoleHierarchy.isSuperAdmin(user)
      },
      dashboardRoute
    });
  } catch (error) {
    console.error('Profile fetch failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 401 }
    );
  }
}
