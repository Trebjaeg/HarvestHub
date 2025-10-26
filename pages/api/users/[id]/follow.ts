import type { NextApiRequest, NextApiResponse} from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, withSecurity, withLogging } from '@/lib/middleware';

async function followHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;
  const userId = (req as any).userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid user ID' 
    });
  }

  if (req.method === 'POST') {
    return await toggleFollow(req, res, userId, id);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function toggleFollow(req: NextApiRequest, res: NextApiResponse, currentUserId: string, targetUserId: string) {
  try {
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Get current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Get target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    // Check if already following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((id: any) => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter((id: any) => id.toString() !== currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length
    });
  } catch (error: any) {
    console.error('Follow toggle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle follow status'
    });
  }
}

export default withLogging(withSecurity(withAuth(followHandler)));
