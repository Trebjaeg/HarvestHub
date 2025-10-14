import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '../../../../models/User';
import AuditLog from '../../../../models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded: any = jwt.verify(token, JWT_SECRET);
  await dbConnect();
  
  const user = await User.findById(decoded.userId);
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json();
    const { action, userId, reason } = body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admins from modifying superadmins (unless the admin is also a superadmin)
    if (targetUser.role === 'superadmin' && admin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Cannot modify superadmin users' }, { status: 403 });
    }

    let updatedUser;
    let auditAction;

    switch (action) {
      case 'suspend':
        updatedUser = await User.findByIdAndUpdate(
          userId, 
          { status: 'suspended' }, 
          { new: true }
        ).select('-password');
        auditAction = 'user_suspended';
        break;

      case 'activate':
        updatedUser = await User.findByIdAndUpdate(
          userId, 
          { status: 'active' }, 
          { new: true }
        ).select('-password');
        auditAction = 'user_unsuspended';
        break;

      case 'delete':
        updatedUser = await User.findByIdAndUpdate(
          userId, 
          { status: 'deleted' }, 
          { new: true }
        ).select('-password');
        auditAction = 'user_deleted';
        break;

      case 'promote':
        if (admin.role !== 'superadmin') {
          return NextResponse.json({ error: 'Only superadmins can promote users' }, { status: 403 });
        }
        updatedUser = await User.findByIdAndUpdate(
          userId, 
          { role: 'admin' }, 
          { new: true }
        ).select('-password');
        auditAction = 'user_role_changed';
        break;

      case 'demote':
        if (admin.role !== 'superadmin') {
          return NextResponse.json({ error: 'Only superadmins can demote users' }, { status: 403 });
        }
        updatedUser = await User.findByIdAndUpdate(
          userId, 
          { role: 'user' }, 
          { new: true }
        ).select('-password');
        auditAction = 'user_role_changed';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the action
    await AuditLog.create({
      performedBy: admin._id,
      action: auditAction,
      targetUser: userId,
      reason: reason || 'No reason provided',
      details: {
        targetUserEmail: targetUser.email,
        adminEmail: admin.email,
        previousStatus: targetUser.status,
        newStatus: updatedUser.status
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('User action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}